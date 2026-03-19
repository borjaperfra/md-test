import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' });

const OfferExtraction = z.object({
  title: z.string(),
  company: z.string(),
  type: z.enum(['manfred', 'client', 'external']),
  modality: z.enum(['remote', 'hybrid', 'onsite']),
  salary: z.string().nullable(),
  isFreelance: z.boolean(),
  location: z.string().nullable(),
});

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 10000);
}

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  if (!url) {
    return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 });
  }

  // Fetch the page
  let pageText: string;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const hint = res.status === 999 || res.status === 403
        ? ' LinkedIn y otras plataformas bloquean el acceso automático. Introduce los datos manualmente.'
        : '';
      return NextResponse.json(
        { error: `No se pudo acceder a la página (${res.status}).${hint}` },
        { status: 422 }
      );
    }

    const html = await res.text();
    pageText = stripHtml(html);

    if (pageText.length < 100) {
      return NextResponse.json(
        { error: 'La página no tiene contenido legible. Puede requerir inicio de sesión.' },
        { status: 422 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'No se pudo acceder a la URL. Si es LinkedIn, introduce los datos manualmente.' },
      { status: 422 }
    );
  }

  // Extract data with Claude
  let parsed: unknown;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `Eres un asistente que extrae datos estructurados de ofertas de empleo tech.
Responde ÚNICAMENTE con un objeto JSON válido con estos campos: title, company, type, modality, salary, isFreelance, location.
Reglas:
- type: "manfred" si la URL contiene getmanfred.com, "external" en cualquier otro caso. Nunca uses "client".
- modality: dedúcelo del contenido (remote/hybrid/onsite). Si no se indica, usa "remote".
- location: ciudad o provincia si modality es hybrid u onsite (ej: "Valencia", "Madrid"). null si es remote o no se especifica.
- salary: extrae como "€XXK", "€XX-XXK", "€XX/h" o "€XX-YY/h". Reglas de extracción:
  * Preserva el rango completo: "€70-80/h" NO "€70/h", "€70-80K" NO "Up to €80K".
  * Si hay rangos por nivel de experiencia, usa el rango senior/experimentado (el más alto).
  * Si hay rangos por ubicación (ej: Londres vs Europa), usa siempre el europeo/continental (no UK/Londres ni USD).
  * Convierte cifras brutas: 107000 → "€107K", 107837-188848 → "€107-188K".
  * Si solo hay un valor máximo (sin mínimo), usa "Up to €XXK".
  * null si no hay información de salario.
- isFreelance: true solo si es freelance o contractor claramente indicado.`,
      messages: [{
        role: 'user',
        content: `URL: ${url}\n\nContenido de la página:\n${pageText}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : text);
  } catch {
    return NextResponse.json(
      { error: 'No se pudieron extraer los datos de la oferta.' },
      { status: 422 }
    );
  }

  const validated = OfferExtraction.safeParse(parsed);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'No se pudieron extraer los datos de la oferta.' },
      { status: 422 }
    );
  }

  return NextResponse.json(validated.data);
}
