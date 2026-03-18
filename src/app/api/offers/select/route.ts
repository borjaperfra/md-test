import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const selectSchema = z.object({
  ids: z.array(z.string()).max(5),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = selectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { ids } = parsed.data;

  const updatedOffers = await prisma.$transaction(async (tx) => {
    // Reset currently selected offers to pending
    await tx.offer.updateMany({
      where: { status: 'selected' },
      data: { status: 'pending', order: null },
    });

    // Mark new offers as selected with their order
    const updates = await Promise.all(
      ids.map((id, index) =>
        tx.offer.update({
          where: { id },
          data: { status: 'selected', order: index },
        })
      )
    );

    return updates;
  });

  return NextResponse.json(updatedOffers);
}
