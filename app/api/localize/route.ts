import { NextResponse } from 'next/server';

export async function POST() {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.log('[CreativeIQ] Ingen API-nyckel konfigurerad – lokalisering hanteras i frontend');
  }

  return NextResponse.json({ message: 'Lokalisering hanteras i frontend med mockdata' });
}
