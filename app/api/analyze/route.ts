import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/ai/anthropic';
import { brandAnalysisPrompt } from '@/lib/ai/prompts/brand-analysis';

const mockAnalysis = {
  brandFit: 78,
  performance: 72,
  compliance: 85,
  heatmapData: [
    { x: 50, y: 15, intensity: 0.95, label: 'Rubrik' },
    { x: 50, y: 45, intensity: 0.8, label: 'Huvudbild' },
    { x: 50, y: 75, intensity: 0.7, label: 'CTA' },
    { x: 15, y: 10, intensity: 0.6, label: 'Logo' },
    { x: 80, y: 85, intensity: 0.5, label: 'Disclaimer' },
  ],
  complianceItems: [
    { status: 'pass', category: 'logo', message: 'Nordea-logotyp korrekt placerad' },
    { status: 'pass', category: 'contrast', message: 'Textkontrast uppfyller WCAG AA' },
    { status: 'warning', category: 'disclaimer', message: 'Riskdisclaimer saknas för investeringsprodukt' },
    { status: 'pass', category: 'terminology', message: 'Korrekt terminologi används' },
    { status: 'fail', category: 'legal', message: 'Effektiv ränta måste anges tydligare' },
  ],
  suggestions: [
    { type: 'visual', priority: 'high', message: 'Öka kontrasten på CTA-knappen för bättre synlighet' },
    { type: 'copy', priority: 'medium', message: 'Förenkla rubriken – använd max 8 ord för LinkedIn' },
    { type: 'compliance', priority: 'high', message: 'Lägg till riskdisclaimer: "Historisk avkastning är ingen garanti för framtida avkastning"' },
    { type: 'performance', priority: 'medium', message: 'Placera CTA ovanför folden för bättre konvertering' },
  ],
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adCopy, channel, title } = body;

    const userMessage = `Analysera denna annons:
Titel: ${title || 'Ej angiven'}
Kanal: ${channel || 'Ej angiven'}
Annonstext: ${adCopy || 'Ingen text angiven'}

Ge din analys i det specificerade JSON-formatet.`;

    const result = await callClaude(brandAnalysisPrompt, userMessage);

    if (result) {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    }

    // Fallback to mock
    console.log('[CreativeIQ] AI-analys fallback till mockdata');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return NextResponse.json(mockAnalysis);
  } catch (error) {
    console.error('[CreativeIQ] Analyze error:', error);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return NextResponse.json(mockAnalysis);
  }
}
