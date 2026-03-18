import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET() {
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  try {
    const res = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 120,
      messages: [{
        role: 'user',
        content: `Write ONE original, catchy opening line for Manfred's daily tech job newsletter. Today is ${today}.
One line only (max 100 chars), in English, no leading emoji, make people want to read on.
Vary the tone: curious, challenging, inspiring, surprising or witty.
Return ONLY the greeting text, no quotes, no explanation.`,
      }],
    });

    const block = res.content.find((b) => b.type === 'text');
    const greeting = block?.type === 'text' ? block.text.trim() : '';
    return NextResponse.json({ greeting });
  } catch {
    return NextResponse.json({ greeting: '' });
  }
}
