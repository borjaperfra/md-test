import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateMessage } from '@/lib/generateMessage';
import { Offer } from '@/lib/types';

const generateSchema = z.object({
  offerIds: z.array(z.string()).min(1).max(5),
  greeting: z.string().optional().default(''),
  ending: z.string().optional().default(''),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = generateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { offerIds, greeting, ending } = parsed.data;

  const dbOffers = await prisma.offer.findMany({
    where: { id: { in: offerIds } },
  });

  // Sort by the provided order
  const orderedOffers = offerIds
    .map((id) => dbOffers.find((o) => o.id === id))
    .filter(Boolean) as Offer[];

  const message = generateMessage(orderedOffers, greeting, ending);

  return NextResponse.json({ message });
}
