import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { notifySlack } from '@/lib/slack';

const patchSchema = z.object({
  message: z.string().min(1).optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['pending', 'sent', 'failed', 'cancelled']).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.scheduledAt) data.scheduledAt = new Date(parsed.data.scheduledAt);

  try {
    const updated = await prisma.scheduledMessage.update({
      where: { id: params.id },
      data,
    });
    if (parsed.data.status === 'cancelled' && updated.scheduledAt) {
      const when = new Date(updated.scheduledAt).toLocaleString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Europe/Madrid',
      });
      await notifySlack(`🚫 Mensaje de Manfred Daily cancelado. Estaba programado para el ${when} (hora Madrid).`);
    }
    return NextResponse.json(updated);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw err;
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.scheduledMessage.delete({ where: { id: params.id } });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw err;
  }
  return NextResponse.json({ ok: true });
}
