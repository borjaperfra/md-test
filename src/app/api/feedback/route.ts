import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const items = await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }
  const session = await getServerSession(authOptions);
  const item = await prisma.feedback.create({
    data: { text: text.trim(), author: session?.user?.email ?? null },
  });
  return NextResponse.json(item, { status: 201 });
}
