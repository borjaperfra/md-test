import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const patchSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  type: z.enum(['manfred', 'client', 'external']).optional(),
  modality: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  salary: z.string().nullable().optional(),
  url: z.string().optional(),
  shortUrl: z.string().nullable().optional(),
  status: z.enum(['pending', 'selected', 'discarded']).optional(),
  order: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  isFreelance: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const offer = await prisma.offer.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(offer);
}
