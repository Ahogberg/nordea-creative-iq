import { NextResponse } from 'next/server';
import { getClaudeClient, getChannelContext, getComplianceContext } from '@/lib/claude';
import { NORDEA_SYSTEM_PROMPT } from '@/lib/nordea-brand-guidelines';
import { detectProductFromText } from '@/lib/product-detection';

export async function POST(request: Request) {
  try {
    const { headline, body, cta, channel } = await request.json();

    const fullText = `${headline} ${body} ${cta}`;
    const product = detectProductFromText(headline || '', body || '', cta || '');
    const channelContext = getChannelContext(channel);
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
            content: `Analysera denna Nordea-annons:

RUBRIK: "${headline}"
BRÖDTEXT: "${body}"
CTA: "${cta}"

${channelContext}
${complianceContext}

Analysera enligt Nordeas Tone of Voice (personliga, experter, ansvarsfulla) och compliance-regler.

Svara ENDAST med JSON:
{
  "scores": {
    "overall": 0-100,
    "toneOfVoice": 0-100,
    "clarity": 0-100,
    "compliance": 0-100
  },
  "feedback": [
    { "status": "pass|warning|fail", "category": "tov|compliance|clarity", "message": "..." }
  ],
  "improved": {
    "headline": "Förbättrad rubrik",
    "body": "Förbättrad brödtext",
    "cta": "Förbättrad CTA",
    "disclaimer": "Om disclaimer behövs, annars null"
  },
  "suggestions": ["Konkret förbättringsförslag 1", "..."]
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
    console.log('[CreativeIQ] Analyze-copy fallback till mockdata');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return NextResponse.json({
      scores: { overall: 72, toneOfVoice: 68, clarity: 78, compliance: 70 },
      feedback: [
        { status: 'warning', category: 'tov', message: 'Tonen kan vara varmare och mer personlig' },
        { status: 'warning', category: 'clarity', message: 'Meningarna kan kortas ner' },
        { status: 'pass', category: 'compliance', message: 'Grundläggande compliance uppfyllt' },
      ],
      improved: {
        headline: headline || 'Förbättrad rubrik',
        body: body || 'Förbättrad brödtext',
        cta: cta || 'Läs mer',
        disclaimer: null,
      },
      suggestions: [
        'Använd "du" istället för formellt tilltal',
        'Korta ner meningarna för bättre läsbarhet',
      ],
    });
  } catch (error) {
    console.error('[CreativeIQ] Analyze-copy error:', error);
    return NextResponse.json({ error: 'Failed to analyze copy' }, { status: 500 });
  }
}
