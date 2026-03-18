import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';

// Call this endpoint every minute via cron (e.g. Windows Task Scheduler or curl)
// curl -X POST http://localhost:3000/api/telegram/cron
export async function POST() {
  const due = await prisma.scheduledMessage.findMany({
    where: {
      status: 'pending',
      scheduledAt: { lte: new Date() },
    },
  });

  const results = await Promise.allSettled(
    due.map(async (msg) => {
      try {
        const telegramId = await sendTelegramMessage(msg.message);
        await prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: { status: 'sent', sentAt: new Date(), telegramId },
        });
        return { id: msg.id, sent: true };
      } catch (err) {
        await prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: { status: 'failed' },
        });
        return { id: msg.id, sent: false, error: String(err) };
      }
    })
  );

  return NextResponse.json({ processed: due.length, results });
}
