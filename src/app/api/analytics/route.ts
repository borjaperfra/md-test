import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClickCount } from '@/lib/bitly';
import { getMessageViews } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

interface SnapshotOffer {
  id: string;
  title: string;
  company: string;
  salary: string | null;
  shortUrl: string | null;
}

interface DbOffer {
  id: string;
  title: string;
  company: string;
  salary: string | null;
  shortUrl: string | null;
}

interface ClickableOffer {
  id: string;
  shortUrl: string | null;
}

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s]+/g) ?? [];
  return matches.map((u: string) => u.replace(/[.,)]+$/, ''));
}

export async function GET() {
  const messages = await prisma.scheduledMessage.findMany({
    where: { status: 'sent' },
    orderBy: { sentAt: 'desc' },
    select: { id: true, sentAt: true, telegramId: true, offerIds: true, offersSnapshot: true, message: true, views: true },
  });

  const msgToOfferIds = new Map<string, string[]>();
  const msgToSnapshot = new Map<string, SnapshotOffer[]>();
  const msgToUrls = new Map<string, string[]>();
  const allScheduledOfferIds = new Set<string>();
  const allLegacyUrls: string[] = [];

  for (const msg of messages) {
    if (msg.offersSnapshot) {
      try {
        const snap = JSON.parse(msg.offersSnapshot) as SnapshotOffer[];
        msgToSnapshot.set(msg.id, snap);
      } catch { /* ignore */ }
    } else if (msg.offerIds) {
      try {
        const ids = JSON.parse(msg.offerIds) as string[];
        msgToOfferIds.set(msg.id, ids);
        ids.forEach((id: string) => allScheduledOfferIds.add(id));
      } catch { /* ignore */ }
    } else {
      const urls = extractUrls(msg.message);
      msgToUrls.set(msg.id, urls);
      urls.forEach((u: string) => allLegacyUrls.push(u));
    }
  }

  // Resolve legacy URLs → offers
  if (allLegacyUrls.length > 0) {
    const matched = await prisma.offer.findMany({
      where: { OR: [{ shortUrl: { in: allLegacyUrls } }, { url: { in: allLegacyUrls } }] },
      select: { id: true, shortUrl: true, url: true },
    });
    const urlToId = new Map<string, string>();
    for (const o of matched) {
      if (o.shortUrl) urlToId.set(o.shortUrl, o.id);
      urlToId.set(o.url, o.id);
      allScheduledOfferIds.add(o.id);
    }
    for (const [msgId, urls] of Array.from(msgToUrls.entries())) {
      const ids = urls.map((u: string) => urlToId.get(u)).filter(Boolean) as string[];
      msgToOfferIds.set(msgId, ids);
    }
  }

  // Fetch offers from DB (only for offerIds / legacy messages)
  const dbOffers: DbOffer[] = allScheduledOfferIds.size > 0
    ? await prisma.offer.findMany({
        where: { id: { in: Array.from(allScheduledOfferIds) }, shortUrl: { not: null } },
        select: { id: true, title: true, company: true, salary: true, shortUrl: true },
      })
    : [];

  // Collect all offers that need click counts
  const snapshotOffers: SnapshotOffer[] = Array.from(msgToSnapshot.values()).flat();
  const allOffersForClicks: ClickableOffer[] = [
    ...dbOffers,
    ...snapshotOffers.filter((o: SnapshotOffer) => o.shortUrl),
  ];

  // Fetch Bitly clicks + Telegram views in parallel
  const [clickResults, viewResults] = await Promise.all([
    Promise.allSettled(allOffersForClicks.map((o: ClickableOffer) => getClickCount(o.shortUrl!))),
    Promise.allSettled(
      messages.map((m) => {
        if (m.views !== null && m.views !== undefined) return Promise.resolve(m.views);
        return m.telegramId ? getMessageViews(m.telegramId) : Promise.resolve(null);
      })
    ),
  ]);

  const clickMap = new Map<string, number>();
  allOffersForClicks.forEach((o: ClickableOffer, i: number) => {
    const result = clickResults[i];
    clickMap.set(o.id, result.status === 'fulfilled' ? (result.value as number) : 0);
  });

  const offerById = new Map<string, DbOffer>(dbOffers.map((o: DbOffer) => [o.id, o]));

  // Build one section per message
  const sections = messages.map((msg, i: number) => {
    let msgOffers: { id: string; title: string; company: string; salary: string | null; shortUrl: string | null; clicks: number }[];

    const snap = msgToSnapshot.get(msg.id);
    if (snap) {
      msgOffers = snap.map((o: SnapshotOffer) => ({ ...o, clicks: clickMap.get(o.id) ?? 0 }));
    } else {
      const ids = msgToOfferIds.get(msg.id) ?? [];
      msgOffers = ids
        .map((id: string) => offerById.get(id))
        .filter((o): o is DbOffer => o !== undefined)
        .map((o: DbOffer) => ({ id: o.id, title: o.title, company: o.company, salary: o.salary, shortUrl: o.shortUrl, clicks: clickMap.get(o.id) ?? 0 }));
    }

    const totalClicks = msgOffers.reduce((s: number, o) => s + o.clicks, 0);
    const viewResult = viewResults[i];
    const views = viewResult.status === 'fulfilled' ? (viewResult.value as number | null) : null;

    return {
      messageId: msg.id,
      date: msg.sentAt ? new Date(msg.sentAt).toISOString().slice(0, 10) : null,
      sentAt: msg.sentAt,
      offers: msgOffers,
      totalClicks,
      avgClicks: msgOffers.length > 0 ? Math.round((totalClicks / msgOffers.length) * 10) / 10 : 0,
      views,
    };
  });

  const allOfferStats = sections.flatMap((s) => s.offers);
  const totalClicks = allOfferStats.reduce((s: number, o) => s + o.clicks, 0);
  const globalAvgClicks = allOfferStats.length > 0
    ? Math.round((totalClicks / allOfferStats.length) * 10) / 10 : 0;
  const sectionsWithViews = sections.filter((s) => s.views !== null);
  const globalAvgViews = sectionsWithViews.length > 0
    ? Math.round(sectionsWithViews.reduce((s: number, d) => s + (d.views as number), 0) / sectionsWithViews.length)
    : null;

  return NextResponse.json({
    sections,
    summary: { totalClicks, totalOffers: allOfferStats.length, globalAvgClicks, globalAvgViews, messagesSent: messages.length },
  });
}
