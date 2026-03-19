import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { reviewed } = await request.json();
  const item = await prisma.feedback.update({
    where: { id: params.id },
    data: { reviewed },
  });
  return NextResponse.json(item);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.feedback.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
