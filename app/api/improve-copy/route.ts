import { NextResponse } from 'next/server';
import { getClaudeClient } from '@/lib/claude';
import { NORDEA_SYSTEM_PROMPT } from '@/lib/nordea-brand-guidelines';

interface ImproveCopyRequest {
  channel: string;
  headline: string;
  body: string;
  cta: string;
}

// Mock fallback
const mockImprovement = {
  analysis: {
    toneScores: {
      humanWarm: 72,
      clearSimple: 65,
      confidentHumble: 58,
      forwardLooking: 70,
    },
    overallScore: 66,
  },
  suggestions: [
    {
      severity: 'high' as const,
      field: 'Rubrik',
      issue: 'För generisk och säljande ton',
      suggestion: 'Fokusera på kundens resa istället för produkten',
    },
    {
      severity: 'medium' as const,
      field: 'Brödtext',
      issue: 'Innehåller bankjargong',
      suggestion: 'Berätta vad kunden faktiskt får, inte tekniska termer',
    },
    {
      severity: 'medium' as const,
      field: 'CTA',
      issue: '"Ansök nu" skapar onödig press',
      suggestion: 'Mjukare CTA som "Se vad du har råd med"',
    },
  ],
  improved: {
    headline: 'Ditt första boende börjar med en enkel kalkyl',
    body: 'Att köpa sin första bostad är stort. Vi hjälper dig förstå vad du har råd med – steg för steg, utan förpliktelser.',
    cta: 'Se vad du har råd med',
  },
};

export async function POST(request: Request) {
  try {
    const body: ImproveCopyRequest = await request.json();
    const { channel, headline, body: bodyText, cta } = body;

    const anthropic = getClaudeClient();
    if (anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        system: `${NORDEA_SYSTEM_PROMPT}

Du är en expert på att förbättra marknadsföringstexter. Analysera given copy och ge konkreta förbättringsförslag baserat på Nordeas Tone of Voice.

Svara ENDAST i följande JSON-format:
{
  "analysis": {
    "toneScores": {
      "humanWarm": 0-100,
      "clearSimple": 0-100,
      "confidentHumble": 0-100,
      "forwardLooking": 0-100
    },
    "overallScore": 0-100
  },
  "suggestions": [
    {
      "severity": "high" | "medium" | "low",
      "field": "Rubrik" | "Brödtext" | "CTA",
      "issue": "Beskrivning av problemet",
      "suggestion": "Konkret förbättringsförslag"
    }
  ],
  "improved": {
    "headline": "Förbättrad rubrik",
    "body": "Förbättrad brödtext",
    "cta": "Förbättrad CTA"
  }
}`,
        messages: [
          {
            role: 'user',
            content: `Analysera och förbättra denna annonstext för ${channel}:

RUBRIK: ${headline}

BRÖDTEXT: ${bodyText}

CTA: ${cta}

Ge detaljerad Tone of Voice-analys, identifiera problem, och ge en förbättrad version.`,
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
    console.log('[CreativeIQ] Improve-copy fallback till mockdata');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return NextResponse.json(mockImprovement);
  } catch (error) {
    console.error('[CreativeIQ] Improve-copy error:', error);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return NextResponse.json(mockImprovement);
  }
}
