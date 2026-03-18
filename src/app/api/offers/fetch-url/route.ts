import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const OfferExtraction = z.object({
  title: z.string(),
  company: z.string(),
  type: z.enum(['manfred', 'client', 'external']),
  modality: z.enum(['remote', 'hybrid', 'onsite']),
  salary: z.string().nullable(),
  isFreelance: z.boolean(),
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
      {
        error:
          'No se pudo acceder a la URL. Si es LinkedIn, introduce los datos manualmente.',
      },
      { status: 422 }
    );
  }

  // Extract data with Claude
  const response = await client.messages.parse({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: `Eres un asistente que extrae datos estructurados de ofertas de empleo tech.
Reglas:
- type: "manfred" si la URL contiene getmanfred.com, "external" en cualquier otro caso. Nunca uses "client".
- modality: dedúcelo del contenido (remote/hybrid/onsite). Si no se indica, usa "remote".
- salary: extrae el salario como string (ej: "70K", "60-80K", "€20/h"). null si no aparece.
- isFreelance: true solo si es una posición freelance o contractor claramente indicada.
Responde únicamente con el JSON estructurado.`,
    messages: [
      {
        role: 'user',
        content: `URL: ${url}\n\nContenido de la página:\n${pageText}`,
      },
    ],
    output_config: {
      format: zodOutputFormat(OfferExtraction),
    },
  });

  if (!response.parsed_output) {
    return NextResponse.json(
      { error: 'No se pudieron extraer los datos de la oferta.' },
      { status: 422 }
    );
  }

  return NextResponse.json(response.parsed_output);
}
