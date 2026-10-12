import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/ai/anthropic';
import { localizationPrompt } from '@/lib/ai/prompts/localization';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceMarket, targetMarket, content } = body;

    if (!content || !targetMarket) {
      return NextResponse.json({ message: 'Källinnehåll och målmarknad krävs' }, { status: 400 });
    }

    const prompt = localizationPrompt(sourceMarket || 'SE', targetMarket, content);
    const result = await callClaude(
      'Du är expert på nordisk marknadsföring och lokalisering för Nordea. Svara ALLTID med valid JSON.',
      prompt
    );

    if (result) {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    }

    if (result) throw new Error("AI-svaret kunde inte tolkas");

    // Fallback
    console.log('[CreativeIQ] Lokalisering fallback – ingen AI-nyckel eller parse-fel');
    return NextResponse.json({ simulation: 'mock', message: 'AI-nyckel saknas. Endast demonstration är tillgänglig.' });
  } catch (error) {
    console.error('[CreativeIQ] Localize error:', error);
    return NextResponse.json({ message: 'Lokaliseringen misslyckades. Försök igen.' }, { status: 502 });
  }
}
