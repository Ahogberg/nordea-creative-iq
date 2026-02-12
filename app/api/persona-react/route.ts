import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/ai/anthropic';

interface PersonaReactionRequest {
  personaId: string;
  personaName: string;
  personaTraits: string[];
  personaPainPoints: string[];
  personaSystemPrompt: string;
  responseStyle: string;
  copy: {
    headline: string;
    body: string;
    cta: string;
  };
  channel: string;
}

const mockReactions: Record<string, {
  firstImpression: string;
  wouldClick: number;
  objections: string[];
}> = {
  'Ung Förstagångsköpare': {
    firstImpression: 'Okej, det här känns faktiskt relevant för mig. Jag gillar att det inte trycker på "ansök nu" direkt. Men jag vill veta mer om de faktiska kostnaderna innan jag klickar.',
    wouldClick: 75,
    objections: [
      'Vad är den faktiska räntan?',
      'Finns det dolda avgifter?',
      'Hur lång tid tar processen?',
    ],
  },
  'Spararen': {
    firstImpression: 'Lite för vagt för min smak. "Enkel kalkyl" säger mig ingenting. Jag vill se siffror, jämförelser, konkret data.',
    wouldClick: 45,
    objections: [
      'Hur jämför sig era räntor med andra banker?',
      'Vilka avgifter tillkommer?',
      'Var är den konkreta informationen?',
    ],
  },
  'Familjeföräldern': {
    firstImpression: 'Bra att det är enkelt och inte kräver mycket tid. "Steg för steg" låter bra när man har tusen andra saker att tänka på.',
    wouldClick: 80,
    objections: [
      'Hur lång tid tar det egentligen?',
      'Kan min partner också se kalkylen?',
    ],
  },
  'Pensionsspararen': {
    firstImpression: 'Känns lite för digitalt för mig. "Testa kalkylatorn" – jag vill hellre prata med någon som kan förklara.',
    wouldClick: 35,
    objections: [
      'Kan jag ringa någon istället?',
      'Finns det ett kontor jag kan besöka?',
      'Jag litar inte riktigt på att göra detta själv online',
    ],
  },
};

export async function POST(request: Request) {
  try {
    const body: PersonaReactionRequest = await request.json();

    const systemPrompt = `Du är ${body.personaName}, en fiktiv Nordea-kund med följande egenskaper:
- Karaktärsdrag: ${body.personaTraits?.join(', ') || 'N/A'}
- Smärtpunkter: ${body.personaPainPoints?.join(', ') || 'N/A'}
- Responsstil: ${body.responseStyle}
${body.personaSystemPrompt ? `\nInstruktioner: ${body.personaSystemPrompt}` : ''}

Du ska reagera på annonstext och svara i JSON-format (och INGET annat) med exakt dessa fält:
{
  "firstImpression": "Din första tanke om annonsen, i jag-form, 2-3 meningar",
  "wouldClick": <siffra 0-100 som anger sannolikheten att du klickar>,
  "objections": ["invändning 1", "invändning 2", "invändning 3"]
}

Svara PÅ SVENSKA och i karaktär.`;

    const userMessage = `Reagera på följande annonstext för ${body.channel || 'digital'}-kanalen:

RUBRIK: ${body.copy.headline}
BRÖDTEXT: ${body.copy.body}
CTA: ${body.copy.cta}`;

    const result = await callClaude(systemPrompt, userMessage, { maxTokens: 512, temperature: 0.8 });

    if (result) {
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({
            firstImpression: parsed.firstImpression || 'Intressant annons.',
            wouldClick: typeof parsed.wouldClick === 'number' ? parsed.wouldClick : 50,
            objections: Array.isArray(parsed.objections) ? parsed.objections : [],
          });
        }
      } catch {
        // JSON parse failed, fall through to mock
      }
    }

    // Fallback to mock
    console.log('[CreativeIQ] Persona-react fallback till mockdata');
    await new Promise((resolve) => setTimeout(resolve, 800));
    const reaction = mockReactions[body.personaName] || mockReactions['Spararen'];

    return NextResponse.json({
      firstImpression: reaction.firstImpression,
      wouldClick: reaction.wouldClick,
      objections: reaction.objections,
    });
  } catch (error) {
    console.error('[CreativeIQ] Persona-react error:', error);
    return NextResponse.json({
      firstImpression: 'Jag kunde inte analysera den här annonsen just nu.',
      wouldClick: 50,
      objections: ['Tekniskt fel uppstod'],
    });
  }
}
