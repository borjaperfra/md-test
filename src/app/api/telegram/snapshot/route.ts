import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMessageViews } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  if (request.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const messages = await prisma.scheduledMessage.findMany({
    where: { status: 'sent', telegramId: { not: null }, views: null },
    select: { id: true, telegramId: true },
  });

  if (messages.length === 0) {
    return NextResponse.json({ saved: 0 });
  }

  const results = await Promise.allSettled(
    messages.map(async (msg) => {
      const views = await getMessageViews(msg.telegramId!);
      if (views === null) return { id: msg.id, saved: false };
      await prisma.scheduledMessage.update({
        where: { id: msg.id },
        data: { views },
      });
      console.log(`[snapshot] Saved ${views} views for message ${msg.id}`);
      return { id: msg.id, saved: true, views };
    })
  );

  const saved = results.filter((r) => r.status === 'fulfilled' && r.value.saved).length;
  return NextResponse.json({ saved, total: messages.length });
}
