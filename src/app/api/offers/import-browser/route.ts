import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { shortenUrl } from '@/lib/bitly';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' });

export async function POST(request: NextRequest) {
  const body = await request.json();

  let prompt: string;
  if (Array.isArray(body.cards) && body.cards.length > 0) {
    prompt = body.cards
      .map((c: { text: string; url: string }) => `URL: ${c.url}\n${c.text}`)
      .join('\n\n---\n\n');
  } else if (typeof body.content === 'string') {
    prompt = `URL de la página: ${body.pageUrl ?? 'desconocida'}\n\n${body.content}`;
  } else {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  let extracted: Array<{
    title: string;
    company: string;
    url: string;
    modality: 'remote' | 'hybrid' | 'onsite';
    location: string | null;
    salary: string | null;
    isFreelance: boolean;
  }>;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: `Eres un asistente que extrae ofertas de empleo tech de contenido copiado de LinkedIn u otras páginas.
Por cada oferta extrae: title, company, url, modality (remote/hybrid/onsite), location (ciudad si hybrid/onsite, null si remote), salary (€XXK o €XX-XXK; si hay rangos por región usa el europeo; si hay rangos por experiencia usa el senior; null si no hay), isFreelance (boolean).
Responde ÚNICAMENTE con un array JSON válido. Si no hay ofertas, responde [].`,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const match = text.match(/\[[\s\S]*\]/);
    extracted = JSON.parse(match ? match[0] : '[]');
    if (!Array.isArray(extracted)) extracted = [];
  } catch {
    return NextResponse.json({ error: 'No se pudieron extraer las ofertas.' }, { status: 422 });
  }

  if (extracted.length === 0) {
    return NextResponse.json({ imported: 0, offers: [] });
  }

  const created: typeof extracted = [];
  for (const offer of extracted) {
    if (!offer.url || !offer.title || !offer.company) continue;
    try {
      const record = await prisma.offer.create({
        data: {
          title: offer.title,
          company: offer.company,
          url: offer.url,
          type: 'external',
          modality: offer.modality ?? 'remote',
          location: offer.location ?? null,
          salary: offer.salary ?? null,
          isFreelance: offer.isFreelance ?? false,
        },
      });
      created.push({ ...offer, url: record.id });

      shortenUrl(offer.url).then((short) => {
        if (short)
          prisma.offer.update({ where: { id: record.id }, data: { shortUrl: short } }).catch(() => {});
      });
    } catch {
      // Skip duplicates
    }
  }

  return NextResponse.json({ imported: created.length, offers: created });
}
