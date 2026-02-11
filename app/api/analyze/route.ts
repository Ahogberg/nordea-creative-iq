import { NextResponse } from 'next/server';

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

export async function POST() {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.log('[CreativeIQ] Ingen API-nyckel konfigurerad – returnerar mockad analys');
  }

  return NextResponse.json(mockAnalysis);
}
