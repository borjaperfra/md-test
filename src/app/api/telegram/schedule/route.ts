import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';

const schema = z.object({
  message: z.string().min(1),
  scheduledAt: z.string().datetime().optional(), // ISO string; absent = send now
});

export async function GET() {
  const messages = await prisma.scheduledMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(messages);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { message, scheduledAt } = parsed.data;

  // Send now
  if (!scheduledAt) {
    try {
      const telegramId = await sendTelegramMessage(message);
      const record = await prisma.scheduledMessage.create({
        data: { message, status: 'sent', sentAt: new Date(), telegramId },
      });
      return NextResponse.json(record, { status: 201 });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 502 });
    }
  }

  // Schedule for later
  const record = await prisma.scheduledMessage.create({
    data: { message, scheduledAt: new Date(scheduledAt), status: 'pending' },
  });
  return NextResponse.json(record, { status: 201 });
}
