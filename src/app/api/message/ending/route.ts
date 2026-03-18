import { NextRequest, NextResponse } from 'next/server';
import { getTodayEnding } from '@/lib/getEnding';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date'); // YYYY-MM-DD

  const date = dateParam ? new Date(dateParam + 'T12:00:00') : new Date();
  const ending = getTodayEnding(date);

  return NextResponse.json(ending);
}
