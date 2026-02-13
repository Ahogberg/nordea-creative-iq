import { NextResponse } from 'next/server';
import { getClaudeClient } from '@/lib/claude';
import { NORDEA_SYSTEM_PROMPT } from '@/lib/nordea-brand-guidelines';

interface GenerateCopyRequest {
  channel: 'meta' | 'tiktok' | 'display' | 'email';
  objective: 'awareness' | 'consideration' | 'conversion' | 'retention';
  topic: string;
  product?: string;
}

const CHANNEL_SPECS: Record<string, { maxHeadline: number; maxBody: number; style: string }> = {
  meta: {
    maxHeadline: 40,
    maxBody: 125,
    style: 'Kort, punchy, scroll-stopping. Emoji OK men sparsamt.',
  },
  tiktok: {
    maxHeadline: 30,
    maxBody: 100,
    style: 'Ungdomligt, autentiskt, trendigt. Undvik att låta som en bank.',
  },
  display: {
    maxHeadline: 30,
    maxBody: 90,
    style: 'Extremt kortfattat. Budskapet måste fungera i en snabb blick.',
  },
  email: {
    maxHeadline: 60,
    maxBody: 500,
    style: 'Personligt, informativt, tydlig CTA. Kan vara längre och mer detaljerat.',
  },
};

const OBJECTIVE_CONTEXT: Record<string, string> = {
  awareness: 'Målet är att skapa kännedom. Fokusera på att väcka intresse och nyfikenhet, inte sälja.',
  consideration: 'Målet är att få målgruppen att överväga Nordea. Lyft fördelar och differentiering.',
  conversion: 'Målet är att driva handling. Tydlig CTA, skapa urgency utan att vara pushig.',
  retention: 'Målet är att behålla befintliga kunder. Fokusera på värde och uppskattning.',
};

// Mock fallback data
const mockVariants = [
  {
    id: '1',
    angle: 'Emotionell',
    headline: 'Ditt första hem väntar på dig',
    subheadline: 'Vi hjälper dig hela vägen – från dröm till nyckel',
    bodyCopy:
      'Att köpa sin första bostad är en av livets största milstolpar. Vi förstår att det kan kännas överväldigande. Därför finns vi här för att guida dig genom varje steg.',
    cta: 'Börja din resa',
    hashtags: '#Nordea #FörstaBostad #Bolån',
    brandFitScore: 87,
    reasoning: 'Emotionell vinkel som talar till drömmen om ett eget hem.',
  },
  {
    id: '2',
    angle: 'Rationell',
    headline: 'Räkna ut vad du har råd med på 2 minuter',
    subheadline: 'Vår bolånekalkyl ger dig svar direkt',
    bodyCopy:
      'Kontantinsats, amortering, räntebindning – det finns mycket att hålla koll på. Vår kalkylator hjälper dig få en tydlig bild av din ekonomi.',
    cta: 'Testa kalkylatorn',
    hashtags: '#Nordea #Bolånekalkyl',
    brandFitScore: 82,
    reasoning: 'Rationell vinkel med konkret verktyg som nytta.',
  },
  {
    id: '3',
    angle: 'Handlingsfokuserad',
    headline: 'Starta din bostadsresa idag',
    subheadline: 'Tre enkla steg till ditt bolånebesked',
    bodyCopy:
      'Sluta fundera, börja agera. Fyll i vår snabba kalkyl, få ett preliminärt besked, och boka ett möte med en rådgivare.',
    cta: 'Kom igång nu',
    hashtags: '#Nordea #Bolån',
    brandFitScore: 79,
    reasoning: 'Handlingsfokuserad med tydliga steg.',
  },
];

export async function POST(request: Request) {
  try {
    const body: GenerateCopyRequest = await request.json();
    const { channel, objective, topic, product } = body;

    const channelSpec = CHANNEL_SPECS[channel] || CHANNEL_SPECS.meta;
    const objectiveContext = OBJECTIVE_CONTEXT[objective] || OBJECTIVE_CONTEXT.awareness;

    const anthropic = getClaudeClient();
    if (anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        system: `${NORDEA_SYSTEM_PROMPT}

Du ska generera annonstext för Nordea. Generera ALLTID 3 varianter med olika vinklar:
1. Emotionell - Fokuserar på känslor, drömmar, livsmål
2. Rationell - Fokuserar på fakta, fördelar, konkret nytta
3. Handlingsfokuserad - Fokuserar på att ta nästa steg, urgency

Svara ENDAST i följande JSON-format, inget annat:
{
  "variants": [
    {
      "id": "1",
      "angle": "Emotionell",
      "headline": "...",
      "subheadline": "...",
      "bodyCopy": "...",
      "cta": "...",
      "hashtags": "..." eller null,
      "brandFitScore": 0-100,
      "reasoning": "Kort förklaring av varför denna copy fungerar"
    }
  ]
}`,
        messages: [
          {
            role: 'user',
            content: `Skapa annonstext för Nordea.

KANAL: ${channel} (${channelSpec.style})
- Max rubrik: ${channelSpec.maxHeadline} tecken
- Max brödtext: ${channelSpec.maxBody} tecken

MÅL: ${objectiveContext}

ÄMNE/PRODUKT: ${topic || 'Bolåneerbjudande för nya kunder'}
${product ? `SPECIFIK PRODUKT: ${product}` : ''}

Generera 3 varianter (emotionell, rationell, handlingsfokuserad).`,
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
    console.log('[CreativeIQ] Copy-generering fallback till mockdata');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return NextResponse.json({ variants: mockVariants });
  } catch (error) {
    console.error('[CreativeIQ] Generate-copy error:', error);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return NextResponse.json({ variants: mockVariants });
  }
}
