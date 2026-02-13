import { NextResponse } from 'next/server';
import { getClaudeClient, COMPLIANCE_RULES } from '@/lib/claude';
import { NORDEA_SYSTEM_PROMPT } from '@/lib/nordea-brand-guidelines';

interface AnalyzeImageRequest {
  imageBase64: string;
  mediaType: string;
  headline?: string;
  bodyText?: string;
  cta?: string;
  channel: string;
}

// Mock fallback
const mockAnalysis = {
  scores: {
    visual: 78,
    copy: 85,
    overall: 82,
    brandFit: 76,
    compliance: 70,
  },
  visualAnalysis: {
    feedback: [
      { status: 'pass' as const, message: 'Bildkvalitet är god (hög upplösning)' },
      { status: 'pass' as const, message: 'Nordea-logotyp korrekt placerad' },
      { status: 'warning' as const, message: 'Kontrasten kan förbättras på CTA' },
    ],
    composition: 'Bilden har bra visuell hierarki med logotyp i övre hörnet.',
    brandElements: 'Nordeas blå färg (#0000A0) används i bakgrund och CTA.',
    attention: 'Ögat dras först till rubriken, sedan till bilden i mitten.',
  },
  copyAnalysis: {
    feedback: [
      { status: 'pass' as const, message: 'Rubriken är tydlig och kortfattad' },
      { status: 'pass' as const, message: 'Tone of Voice stämmer med riktlinjer' },
      { status: 'fail' as const, message: 'Disclaimer saknas för finansiell produkt' },
    ],
    toneOfVoice: 'Texten följer Nordeas riktlinjer för mänsklig och tydlig kommunikation.',
    clarity: 'Budskapet är tydligt men CTA kunde vara mer specifik.',
  },
  holisticAnalysis: {
    feedback: [
      { status: 'pass' as const, message: 'Bild och budskap hänger ihop' },
      { status: 'warning' as const, message: 'CTA kunde vara mer framträdande' },
    ],
    synergy: 'Bild och text kompletterar varandra väl.',
    targetAudience: 'Riktar sig till privatpersoner som överväger bolån.',
  },
  complianceIssues: [
    {
      severity: 'high' as const,
      issue: 'Riskdisclaimer saknas',
      recommendation: 'Lägg till standarddisclaimer för finansiella produkter',
    },
  ],
  suggestions: [
    'Lägg till riskdisclaimer för finansiella produkter',
    'Öka kontrasten på CTA-knappen',
    'Placera CTA ovanför folden',
  ],
  summary: 'Annonsen har god visuell kvalitet och följer Nordeas Tone of Voice, men saknar nödvändiga disclaimers.',
};

export async function POST(request: Request) {
  try {
    const body: AnalyzeImageRequest = await request.json();
    const { imageBase64, mediaType, headline, bodyText, cta, channel } = body;

    const copyContext =
      headline || bodyText || cta
        ? `\n\nTILLHÖRANDE COPY:\nRubrik: ${headline || 'Ej angiven'}\nBrödtext: ${bodyText || 'Ej angiven'}\nCTA: ${cta || 'Ej angiven'}`
        : '';

    const anthropic = getClaudeClient();
    if (anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 3000,
        system: `${NORDEA_SYSTEM_PROMPT}

${COMPLIANCE_RULES}

Du är en expert på att analysera annonsmaterial för banker. Analysera bilden och ge detaljerad feedback.

Svara ENDAST i följande JSON-format:
{
  "scores": {
    "visual": 0-100,
    "copy": 0-100,
    "overall": 0-100,
    "brandFit": 0-100,
    "compliance": 0-100
  },
  "visualAnalysis": {
    "feedback": [
      { "status": "pass" | "warning" | "fail", "message": "..." }
    ],
    "composition": "Beskrivning av bildkomposition",
    "brandElements": "Hur väl Nordeas visuella identitet representeras",
    "attention": "Var ögat dras först, vad som sticker ut"
  },
  "copyAnalysis": {
    "feedback": [
      { "status": "pass" | "warning" | "fail", "message": "..." }
    ],
    "toneOfVoice": "Hur väl texten matchar Nordeas ToV",
    "clarity": "Hur tydligt budskapet är"
  },
  "holisticAnalysis": {
    "feedback": [
      { "status": "pass" | "warning" | "fail", "message": "..." }
    ],
    "synergy": "Hur bild och text fungerar tillsammans",
    "targetAudience": "Vem annonsen verkar rikta sig till"
  },
  "complianceIssues": [
    { "severity": "high" | "medium" | "low", "issue": "...", "recommendation": "..." }
  ],
  "suggestions": [
    "Konkret förbättringsförslag 1",
    "Konkret förbättringsförslag 2"
  ],
  "summary": "Kort sammanfattning av analysen"
}`,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: imageBase64,
                },
              },
              {
                type: 'text' as const,
                text: `Analysera denna annons för ${channel}.${copyContext}

Ge detaljerad feedback på:
1. Visuell kvalitet och komposition
2. Brand fit med Nordea
3. Compliance (finansiella regler)
4. Hur bild och eventuell text fungerar tillsammans
5. Konkreta förbättringsförslag`,
              },
            ],
          },
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return NextResponse.json(result);
        }
      }
    }

    // Fallback to mock
    console.log('[CreativeIQ] Image analysis fallback till mockdata');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return NextResponse.json(mockAnalysis);
  } catch (error) {
    console.error('[CreativeIQ] Analyze-image error:', error);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return NextResponse.json(mockAnalysis);
  }
}
