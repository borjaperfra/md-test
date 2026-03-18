import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const now = new Date();

  const updated = await prisma.offer.updateMany({
    where: { status: 'selected', publishedAt: null },
    data: { publishedAt: now },
  });

  return NextResponse.json({ published: updated.count });
}
