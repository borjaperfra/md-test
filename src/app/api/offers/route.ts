import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { OfferStatus } from '@/lib/types';
import { shortenUrl } from '@/lib/bitly';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as OfferStatus | null;

  const offers = await prisma.offer.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(offers);
}

const createSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  company: z.string().min(1),
  type: z.enum(['manfred', 'client', 'external']),
  modality: z.enum(['remote', 'hybrid', 'onsite']),
  salary: z.string().nullable().optional(),
  isFreelance: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const offer = await prisma.offer.create({ data: parsed.data });

  // Shorten URL with Bit.ly (best-effort, non-blocking)
  shortenUrl(parsed.data.url).then((short) => {
    if (short) prisma.offer.update({ where: { id: offer.id }, data: { shortUrl: short } }).catch(() => {});
  });

  return NextResponse.json(offer, { status: 201 });
}
