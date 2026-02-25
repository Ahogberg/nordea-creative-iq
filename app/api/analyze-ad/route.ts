import { NextResponse } from 'next/server';
import { getClaudeClient, getComplianceContext } from '@/lib/claude';
import { NORDEA_SYSTEM_PROMPT } from '@/lib/nordea-brand-guidelines';
import { detectProductFromText } from '@/lib/product-detection';

export async function POST(request: Request) {
  try {
    const { headline, body, cta, channel, imageDescription } = await request.json();

    const product = detectProductFromText(headline || '', body || '', cta || '');
    const complianceContext = getComplianceContext(product.category);

    const anthropic = getClaudeClient();
    if (anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1500,
        system: NORDEA_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Analysera denna kompletta Nordea-annons:

KANAL: ${channel}

RUBRIK: "${headline}"
BRÖDTEXT: "${body}"
CTA: "${cta}"
${imageDescription ? `BILDBESKRIVNING: ${imageDescription}` : ''}

${complianceContext}

Ge en holistisk analys av annonsen.

Svara ENDAST med JSON:
{
  "score": 0-100,
  "summary": "En mening som sammanfattar analysen",
  "issues": [
    { "severity": "high|medium|low", "message": "Problem att åtgärda" }
  ],
  "scores": {
    "visual": 0-100,
    "copy": 0-100,
    "overall": 0-100
  },
  "feedback": {
    "visual": [
      { "status": "pass|warning|fail", "message": "Feedback" }
    ],
    "copy": [
      { "status": "pass|warning|fail", "message": "Feedback" }
    ]
  },
  "suggestions": ["Förbättringsförslag 1", "..."],
  "productCategory": "${product.category}"
}`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return NextResponse.json(JSON.parse(jsonMatch[0]));
        }
      }
    }

    // Fallback mock
    console.log('[CreativeIQ] Analyze-ad fallback till mockdata');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return NextResponse.json({
      score: 79,
      summary: 'Bra visuellt intryck. CTA kan stärkas och disclaimer bör läggas till.',
      issues: [
        { severity: 'high', message: 'Disclaimer saknas för finansiell produkt' },
        { severity: 'medium', message: 'CTA bör vara mer handlingsorienterad' },
      ],
      scores: { visual: 82, copy: 75, overall: 79 },
      feedback: {
        visual: [
          { status: 'pass', message: 'Bildkvalitet är god' },
          { status: 'pass', message: 'Nordea-branding synlig' },
        ],
        copy: [
          { status: 'pass', message: 'Tone of Voice stämmer med riktlinjer' },
          { status: 'fail', message: 'Disclaimer saknas för finansiell produkt' },
        ],
      },
      suggestions: [
        'Lägg till obligatorisk disclaimer',
        'Stärk CTA med mer konkret handlingsuppmaning',
      ],
      productCategory: product.category,
    });
  } catch (error) {
    console.error('[CreativeIQ] Analyze-ad error:', error);
    return NextResponse.json({ error: 'Failed to analyze ad' }, { status: 500 });
  }
}
