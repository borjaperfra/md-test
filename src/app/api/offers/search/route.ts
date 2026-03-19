import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { shortenUrl } from '@/lib/bitly';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' });

const STOP_AFTER = 10;

// ─── Company portals ──────────────────────────────────────────────────────────
// Source: github.com/borjaperfra/companies-with-public-salary
const COMPANY_PORTALS = [
  { company: 'EdPuzzle',         url: 'https://jobs.lever.co/edpuzzle' },
  { company: 'Keepler',          url: 'https://www.linkedin.com/company/keepler/jobs/' },
  { company: 'Tinybird',         url: 'https://www.tinybird.co/about#join-us' },
  { company: 'Whereby',          url: 'https://jobs.lever.co/whereby' },
  { company: 'Marketgoo',        url: 'https://apply.workable.com/marketgoo/' },
  { company: 'Tymit',            url: 'https://apply.workable.com/tymit/' },
  { company: 'Mercadona Tech',   url: 'http://www.mercadonatech.es/es/' },
  { company: 'RevenueCat',       url: 'https://boards.greenhouse.io/revenuecat' },
  { company: 'MarsBased',        url: 'https://marsbased.com/jobs/' },
  { company: 'Cabify',           url: 'https://cabify.careers/es/' },
  { company: 'Factorial/Itnig',  url: 'https://itnig.net/jobs/' },
  { company: 'Stickermule',      url: 'https://www.stickermule.com/careers' },
  { company: 'Aplanet',          url: 'https://aplanet.org/careers/' },
  { company: 'Chorus',           url: 'https://chorus.one/careers#jointeam' },
  { company: 'Sector Labs',      url: 'https://www.sectorlabs.ro/jobs' },
  { company: 'ConvertKit',       url: 'https://job-boards.greenhouse.io/convertkit/jobs/' },
  { company: 'Brainly',          url: 'https://careers.brainly.com/open-positions/' },
  { company: 'HubStaff',         url: 'https://hubstaff.com/jobs' },
  { company: 'Learnerbly',       url: 'https://learnerbly.bamboohr.com/careers' },
  { company: 'Mimo',             url: 'https://getmimo.com/about-us#jobs-section' },
  { company: 'TaxDown',          url: 'https://taxdown.es/career-list/' },
  { company: 'Graphext',         url: 'https://www.graphext.com/careers' },
  { company: 'Haddock',          url: 'https://jobs.haddock.app/' },
  { company: 'Secfix',           url: 'https://jobs.ashbyhq.com/secfix' },
  { company: 'Docker',           url: 'https://www.docker.com/career-openings/' },
  { company: 'Landbot',          url: 'https://jobs.landbot.io/' },
  { company: 'Coches.com',       url: 'https://www.coches.com/trabaja-con-nosotros/' },
  { company: 'Bequant',          url: 'https://es.bequant.com/careers' },
  { company: 'Newtral',          url: 'https://www.linkedin.com/company/newtral_media/jobs/' },
  { company: 'Guruwalk',         url: 'https://www.linkedin.com/company/guruwalk/jobs/' },
  { company: 'Docplanner Tech',  url: 'https://www.docplanner.com/career' },
  { company: 'Revel',            url: 'https://www.linkedin.com/company/driverevel/jobs/' },
  { company: 'Freepik',          url: 'https://freepik-company.factorialhr.com/' },
  { company: 'CrossPoint',       url: 'https://www.crosspoint365.com/trabaja-con-nosotros/' },
  { company: 'Kraken',           url: 'https://jobs.ashbyhq.com/kraken.com' },
  { company: 'Toggl',            url: 'https://toggl.com/jobs/#jobs' },
  { company: 'BendingSpoons',    url: 'https://jobs.bendingspoons.com/' },
  { company: 'Transparent Edge', url: 'https://www.transparentedge.eu/dejanos-tu-cv/' },
  { company: 'Ravenloop',        url: 'https://www.linkedin.com/company/ravenloop/jobs/' },
  { company: 'Novatec Software', url: 'https://novatec-software.career.softgarden.de/' },
  { company: 'Coursedog',        url: 'https://www.coursedog.com/careers-page#jobs' },
  { company: 'GitLab',           url: 'https://about.gitlab.com/jobs/all-jobs/' },
  { company: 'Arketa',           url: 'https://www.ycombinator.com/companies/arketa/jobs' },
  { company: 'Attio',            url: 'https://attio.com/careers#positions' },
  { company: 'Phantom',          url: 'https://phantom.com/careers#open---positions' },
  { company: 'Owner',            url: 'https://www.owner.com/careers#roles' },
  { company: 'PitchUp',          url: 'https://pitchup.applytojob.com/' },
  { company: 'PC Componentes',   url: 'https://jobs.pccomponentes.com/jobs' },
  { company: 'DuckDuckGo',       url: 'https://duckduckgo.com/hiring' },
];

const LINKEDIN_BATCHES = [
  ['Software Engineer', 'Engineering Manager', 'Product Manager', 'Product Designer', 'Data Scientist'],
  ['Data Engineer', 'QA Engineer', 'Tech Lead', 'CTO', 'VP of Engineering'],
  ['Software Developer', 'Backend Developer', 'Frontend Developer', 'Mobile Developer'],
];

const PORTAL_BATCH_SIZE = 8;

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawOffer {
  title: string;
  company: string;
  url: string;
  salary: string | null;
  modality: 'remote' | 'hybrid' | 'onsite';
  location: string | null;
  type: 'manfred' | 'client' | 'external';
  isFreelance: boolean;
}

interface SearchState {
  total: number;
  existingUrls: Set<string>;
}

// ─── Mutex ────────────────────────────────────────────────────────────────────

class Mutex {
  private queue = Promise.resolve();
  run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn);
    this.queue = next.then(() => {}, () => {});
    return next;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function twoDaysAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return d.toISOString().slice(0, 10);
}

async function getExistingUrls(): Promise<Set<string>> {
  const offers = await prisma.offer.findMany({ select: { url: true } });
  return new Set(offers.map((o) => o.url));
}

// ─── Claude search with web_search tool ───────────────────────────────────────

const SYSTEM = `You find tech job offers with public salary.
Return ONLY a valid JSON array (no markdown, no extra text). Each element:
{"title":"...","company":"...","url":"...","salary":"€70K|€60-80K|€20/h","modality":"remote|hybrid|onsite","location":"City or null","type":"manfred|external","isFreelance":false}
Rules:
- type="manfred" only for getmanfred.com URLs; otherwise "external".
- Omit offers without a visible salary.
- url must be a direct link to the specific job posting, not a generic jobs page.
- location: city/province for hybrid or onsite offers; null for remote.
- salary: use European/continental range when multiple regions listed; use senior range when multiple experience levels listed. Format: €XXK or €XX-XXK.`;

interface SearchResult {
  offers: RawOffer[];
  error?: string;
  rawText?: string;
}

async function searchSource(query: string, signal: AbortSignal): Promise<SearchResult> {
  if (signal.aborted) return { offers: [] };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (anthropic.messages.create as any)(
      {
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2048,
        system: SYSTEM,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: query }],
      },
      { headers: { 'anthropic-beta': 'web-search-2025-03-05' } }
    );

    if (signal.aborted) return { offers: [] };

    const text = (response.content as Array<{ type: string; text?: string }>)
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('');

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return { offers: [], rawText: text.slice(0, 300) };
    try {
      return { offers: JSON.parse(match[0]) as RawOffer[] };
    } catch {
      return { offers: [], rawText: match[0].slice(0, 300) };
    }
  } catch (err: unknown) {
    const name = err && typeof err === 'object' && 'name' in err
      ? (err as { name: string }).name : '';
    if (name === 'AbortError') return { offers: [] };
    const message = err instanceof Error ? err.message : String(err);
    return { offers: [], error: message };
  }
}

// ─── DB insertion ─────────────────────────────────────────────────────────────

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
      location: o.location ?? null,
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

  for (const offer of inserted) {
    if (!offer.shortUrl) {
      shortenUrl(offer.url).then((short) => {
        if (short)
          prisma.offer
            .update({ where: { id: offer.id }, data: { shortUrl: short } })
            .catch(() => {});
      });
    }
  }

  return inserted;
}

// ─── Parallel source processor ────────────────────────────────────────────────

function processSource(
  name: string,
  query: string,
  state: SearchState,
  mutex: Mutex,
  signal: AbortSignal,
  send: (obj: object) => void,
): Promise<void> {
  return (async () => {
    if (state.total >= STOP_AFTER || signal.aborted) return;

    send({ searching: name });
    const result = await searchSource(query, signal);
    if (signal.aborted) return;

    if (result.error) {
      send({ source: name, offers: [], count: 0, error: result.error });
      return;
    }
    if (result.rawText !== undefined) {
      send({ source: name, offers: [], count: 0, debug: `No JSON array in response: ${result.rawText}` });
      return;
    }

    await mutex.run(async () => {
      if (state.total >= STOP_AFTER) return;
      const needed = STOP_AFTER - state.total;
      const capped = result.offers.slice(0, needed);
      try {
        const inserted = await insertOffers(capped, state.existingUrls);
        inserted.forEach((o) => state.existingUrls.add(o.url));
        state.total += inserted.length;
        send({ source: name, offers: inserted, count: inserted.length });
      } catch (err) {
        send({ source: name, offers: [], count: 0, error: String(err) });
      }
    });
  })();
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 });
  }

  const today = todayStr();
  const from = twoDaysAgoStr();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

      const state: SearchState = { total: 0, existingUrls: new Set() };
      const mutex = new Mutex();
      const sig = request.signal;

      try {
        state.existingUrls = await getExistingUrls();
      } catch (err) {
        send({ error: String(err) });
        controller.close();
        return;
      }

      // ── Phase 1: Manfred ─────────────────────────────────────────────────────
      await processSource(
        'Manfred',
        `Search getmanfred.com/ofertas-de-trabajo for tech job offers with public salary posted between ${from} and ${today}. Return up to 5 offers as JSON array.`,
        state, mutex, sig, send,
      );

      // ── Phase 2: Company portals ─────────────────────────────────────────────
      if (state.total < STOP_AFTER && !sig.aborted) {
        const portalBatches: Array<{ name: string; query: string }> = [];
        for (let i = 0; i < COMPANY_PORTALS.length; i += PORTAL_BATCH_SIZE) {
          const batch = COMPANY_PORTALS.slice(i, i + PORTAL_BATCH_SIZE);
          const urlList = batch.map((c) => `- ${c.company}: ${c.url}`).join('\n');
          portalBatches.push({
            name: `Portales (${batch.map((c) => c.company).join(', ')})`,
            query: `Search these company job portals for tech offers with public salary posted between ${from} and ${today}:\n${urlList}\nReturn up to 5 offers as JSON array.`,
          });
        }
        await Promise.allSettled(
          portalBatches.map(({ name, query }) =>
            processSource(name, query, state, mutex, sig, send)
          )
        );
      }

      // ── Phase 3: LinkedIn ────────────────────────────────────────────────────
      if (state.total < STOP_AFTER && !sig.aborted) {
        await Promise.allSettled(
          LINKEDIN_BATCHES.map((titles) => {
            const name = `LinkedIn · ${titles.join(', ')}`;
            const query = `Search LinkedIn Jobs for these roles in Spain or remote with public salary, posted between ${from} and ${today}: ${titles.join(', ')}. Return up to 5 offers as JSON array.`;
            return processSource(name, query, state, mutex, sig, send);
          })
        );
      }

      send({ done: true, total: state.total });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  });
}
