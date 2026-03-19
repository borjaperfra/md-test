import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' });

export async function GET(request: NextRequest) {
  const dateParam = new URL(request.url).searchParams.get('date');
  const date = dateParam ? new Date(dateParam) : new Date();
  const today = date.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{
        role: 'user',
        content: `Write ONE original, catchy opening line for Manfred's daily tech job newsletter. Today is ${today}.
One line only (max 100 chars), in English, no leading emoji, make people want to read on.
Vary the tone: curious, challenging, inspiring, surprising or witty.
Return ONLY the greeting text, no quotes, no explanation.`,
      }],
    });
    const greeting = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    return NextResponse.json({ greeting });
  } catch {
    return NextResponse.json({ greeting: '' });
  }
}
