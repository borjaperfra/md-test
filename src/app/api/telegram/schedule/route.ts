import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notifySlack } from '@/lib/slack';

const schema = z.object({
  message: z.string().min(1),
  offerIds: z.array(z.string()).optional(),
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

  const { message, offerIds, scheduledAt } = parsed.data;
  const offerIdsJson = offerIds && offerIds.length > 0 ? JSON.stringify(offerIds) : null;
  const session = await getServerSession(authOptions);
  const createdBy = session?.user?.email ?? null;

  const publishOffers = async () => {
    if (!offerIds || offerIds.length === 0) return;
    await prisma.offer.updateMany({
      where: { id: { in: offerIds } },
      data: { publishedAt: new Date(), status: 'pending', order: null },
    });
  };

  // Send now
  if (!scheduledAt) {
    try {
      const telegramId = await sendTelegramMessage(message);
      const record = await prisma.scheduledMessage.create({
        data: { message, offerIds: offerIdsJson, status: 'sent', sentAt: new Date(), telegramId, createdBy },
      });
      await publishOffers();
      return NextResponse.json(record, { status: 201 });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 502 });
    }
  }

  // Schedule for later
  const record = await prisma.scheduledMessage.create({
    data: { message, offerIds: offerIdsJson, scheduledAt: new Date(scheduledAt), status: 'pending', createdBy },
  });
  await publishOffers();
  const scheduledFormatted = new Date(scheduledAt).toLocaleString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Madrid',
  });
  await notifySlack(`📅 Mensaje de Manfred Daily programado para el ${scheduledFormatted} (hora Madrid)${createdBy ? ` por ${createdBy.split('@')[0]}` : ''}.`);
  return NextResponse.json(record, { status: 201 });
}
