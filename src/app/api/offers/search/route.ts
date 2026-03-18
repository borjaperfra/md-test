import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { shortenUrl } from '@/lib/bitly';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STOP_AFTER = 10; // stop searching more sources once we have this many new offers

async function getExistingUrls(): Promise<Set<string>> {
  const offers = await prisma.offer.findMany({ select: { url: true } });
  return new Set(offers.map((o) => o.url));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function threeDaysAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return d.toISOString().slice(0, 10);
}

const SYSTEM = `Find tech job offers in Spain (remote/hybrid/onsite) with public salary posted in the last 3 days.
Return ONLY a valid JSON array. Each item:
{"title":"...","company":"...","url":"...","salary":"70K|60-80K|€20/h|null","modality":"remote|hybrid|onsite","type":"manfred|external","isFreelance":false}
Rules: type="manfred" only for getmanfred.com URLs. Skip offers without visible salary. No extra text.`;

interface RawOffer {
  title: string;
  company: string;
  url: string;
  salary: string | null;
  modality: 'remote' | 'hybrid' | 'onsite';
  type: 'manfred' | 'client' | 'external';
  isFreelance: boolean;
}

const SOURCES = [
  {
    name: 'LinkedIn',
    query: (today: string, from: string) =>
      `Search LinkedIn Jobs for tech offers in Spain/remote with public salary, posted ${from} to ${today}. Query: "software engineer Spain remote salary" on linkedin.com/jobs filtered to last 3 days. Return up to 5 offers as JSON array.`,
  },
  {
    name: 'Indeed España',
    query: (today: string, from: string) =>
      `Search Indeed Spain for tech offers with public salary, posted ${from} to ${today}. Query: "desarrollador España remoto salario" on es.indeed.com filtered to last 3 days. Return up to 5 offers as JSON array.`,
  },
  {
    name: 'Wellfound',
    query: (today: string, from: string) =>
      `Search wellfound.com/location/spain for recent tech offers with public salary posted ${from} to ${today}. Return up to 5 offers as JSON array.`,
  },
  {
    name: 'Jobfluent',
    query: (today: string, from: string) =>
      `Search jobfluent.com for recent tech offers in Spain with public salary posted ${from} to ${today}. Return up to 5 offers as JSON array.`,
  },
  {
    name: 'Manfred',
    query: (today: string, from: string) =>
      `Search getmanfred.com/ofertas-de-trabajo for tech offers with public salary posted ${from} to ${today}. Return up to 5 offers as JSON array.`,
  },
];

async function searchSource(query: string, signal: AbortSignal): Promise<RawOffer[]> {
  if (signal.aborted) return [];

  try {
    const response = await client.messages.create(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20260209', name: 'web_search' }],
        system: SYSTEM,
        messages: [{ role: 'user', content: query }],
      },
      { signal }
    );

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return [];

    const match = textBlock.text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    return JSON.parse(match[0]) as RawOffer[];
  } catch (err: unknown) {
    const name = err && typeof err === 'object' && 'name' in err ? (err as { name: string }).name : '';
    if (name === 'AbortError') return [];
    console.error('Source search error:', err);
    return [];
  }
}

async function insertOffers(raw: RawOffer[], existingUrls: Set<string>) {
  const newOffers = raw.filter(
    (o) => o.url && o.title && o.company && o.salary && !existingUrls.has(o.url)
  );
  if (newOffers.length === 0) return [];

  await prisma.offer.createMany({
    data: newOffers.map((o) => ({
      title: o.title,
      company: o.company,
      url: o.url,
      salary: o.salary,
      modality: o.modality ?? 'remote',
      type: o.type ?? 'external',
      isFreelance: o.isFreelance ?? false,
      status: 'pending',
    })),
    skipDuplicates: true,
  });

  const inserted = await prisma.offer.findMany({
    where: { url: { in: newOffers.map((o) => o.url) } },
    orderBy: { createdAt: 'desc' },
  });

  // Shorten URLs in background (non-blocking)
  for (const offer of inserted) {
    if (!offer.shortUrl) {
      shortenUrl(offer.url).then((short) => {
        if (short) prisma.offer.update({ where: { id: offer.id }, data: { shortUrl: short } }).catch(() => {});
      });
    }
  }

  return inserted;
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 });
  }

  const today = todayStr();
  const from = threeDaysAgoStr();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

      let existingUrls: Set<string>;
      try {
        existingUrls = await getExistingUrls();
      } catch (err) {
        send({ error: String(err) });
        controller.close();
        return;
      }

      let totalAdded = 0;

      for (const source of SOURCES) {
        if (request.signal.aborted) break;
        if (totalAdded >= STOP_AFTER) break; // enough offers found

        send({ searching: source.name });

        const raw = await searchSource(source.query(today, from), request.signal);
        if (request.signal.aborted) break;

        try {
          const inserted = await insertOffers(raw, existingUrls);
          inserted.forEach((o) => existingUrls.add(o.url));
          totalAdded += inserted.length;
          send({ source: source.name, offers: inserted, count: inserted.length });
        } catch (err) {
          send({ source: source.name, offers: [], count: 0, error: String(err) });
        }
      }

      send({ done: true, total: totalAdded });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  });
}
