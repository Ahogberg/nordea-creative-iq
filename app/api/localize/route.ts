import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/ai/anthropic';
import { localizationPrompt } from '@/lib/ai/prompts/localization';
import { mockLocalizations } from '@/lib/constants/localization-mocks';

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

    // Fallback: strukturerad mock per målmarknad så klientvägen är enhetlig
    console.log('[CreativeIQ] Lokalisering fallback till mockdata');
    await new Promise((resolve) => setTimeout(resolve, 800));
    const mock = mockLocalizations[String(targetMarket).toLowerCase()];
    if (mock) return NextResponse.json(mock);
    return NextResponse.json({ message: 'Ingen mockdata för denna marknad' }, { status: 404 });
  } catch (error) {
    console.error('[CreativeIQ] Localize error:', error);
    return NextResponse.json({ message: 'Lokalisering misslyckades' }, { status: 500 });
  }
}
