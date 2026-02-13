import { NextResponse } from 'next/server';
import { getClaudeClient } from '@/lib/claude';
import { PRODUCT_LABELS, type ProductCategory } from '@/lib/product-detection';

interface PersonaReactRequest {
  personaName: string;
  personaDescription?: string;
  personaTraits: string[];
  personaPainPoints: string[];
  personaAge?: { min: number; max: number };
  personaDigitalMaturity?: string;
  personaSystemPrompt?: string;
  responseStyle: string;
  copy: {
    headline: string;
    body: string;
    cta: string;
  };
  channel: string;
  imageDescription?: string;
  isVideo?: boolean;
  productCategory?: ProductCategory;
}

const mockReactions: Record<
  string,
  { firstImpression: string; wouldClick: number; objections: string[]; relevance?: { score: number }; whatWorked?: string; suggestion?: string }
> = {
  'Ung Förstagångsköpare': {
    firstImpression:
      'Okej, det här känns faktiskt relevant för mig. Jag gillar att det inte trycker på "ansök nu" direkt. Men jag vill veta mer om de faktiska kostnaderna innan jag klickar.',
    wouldClick: 75,
    objections: [
      'Vad är den faktiska räntan?',
      'Finns det dolda avgifter?',
      'Hur lång tid tar processen?',
    ],
    relevance: { score: 80 },
    whatWorked: 'Tydligt budskap utan övertydligt säljtryck',
    suggestion: 'Visa ett konkret prisexempel eller räntesats',
  },
  Spararen: {
    firstImpression:
      'Lite för vagt för min smak. "Enkel kalkyl" säger mig ingenting. Jag vill se siffror, jämförelser, konkret data.',
    wouldClick: 45,
    objections: [
      'Hur jämför sig era räntor med andra banker?',
      'Vilka avgifter tillkommer?',
      'Var är den konkreta informationen?',
    ],
    relevance: { score: 55 },
    whatWorked: 'Professionellt intryck',
    suggestion: 'Lägg till jämförande data eller konkreta siffror',
  },
  Familjeföräldern: {
    firstImpression:
      'Bra att det är enkelt och inte kräver mycket tid. "Steg för steg" låter bra när man har tusen andra saker att tänka på.',
    wouldClick: 80,
    objections: ['Hur lång tid tar det egentligen?', 'Kan min partner också se kalkylen?'],
    relevance: { score: 75 },
    whatWorked: 'Kort, kärnfullt och respekterar min tid',
    suggestion: 'Nämn att det går att göra snabbt i appen',
  },
  Pensionsspararen: {
    firstImpression:
      'Känns lite för digitalt för mig. "Testa kalkylatorn" – jag vill hellre prata med någon som kan förklara.',
    wouldClick: 35,
    objections: [
      'Kan jag ringa någon istället?',
      'Finns det ett kontor jag kan besöka?',
      'Jag litar inte riktigt på att göra detta själv online',
    ],
    relevance: { score: 40 },
    whatWorked: 'Ämnet pension är relevant för mig',
    suggestion: 'Erbjud möjlighet att boka ett personligt rådgivningsmöte',
  },
};

export async function POST(request: Request) {
  try {
    const body: PersonaReactRequest = await request.json();

    const ageContext = body.personaAge
      ? `${body.personaAge.min}-${body.personaAge.max} år gammal`
      : '';

    const visualContext = body.imageDescription
      ? `\nVISUELLT MATERIAL: ${body.imageDescription}`
      : '';

    const mediaType = body.isVideo ? 'videoannons' : 'annons';

    const productContext = body.productCategory && body.productCategory !== 'general'
      ? `\nPRODUKTKATEGORI: ${PRODUCT_LABELS[body.productCategory]}
Tänk på hur relevant denna produktkategori är för dig utifrån din livssituation och dina behov.`
      : '';

    const systemPrompt = `Du är "${body.personaName}", en fiktiv persona som ska reagera på en bankannons från Nordea.

DIN PROFIL:
- Namn: ${body.personaName}
${ageContext ? `- Ålder: ${ageContext}` : ''}
${body.personaDescription ? `- Beskrivning: ${body.personaDescription}` : ''}
${body.personaDigitalMaturity ? `- Digital mognad: ${body.personaDigitalMaturity}` : ''}
- Karaktärsdrag: ${body.personaTraits?.join(', ') || 'N/A'}
- Smärtpunkter/utmaningar: ${body.personaPainPoints?.join(', ') || 'N/A'}
- Responsstil: ${body.responseStyle}
${body.personaSystemPrompt ? `\nInstruktioner: ${body.personaSystemPrompt}` : ''}
${productContext}

INSTRUKTIONER:
- Reagera som denna persona skulle reagera i verkligheten
- Var ärlig och autentisk – om annonsen inte tilltalar dig, säg det
- Tänk på dina specifika smärtpunkter och hur annonsen adresserar (eller missar) dem
- Bedöm relevansen utifrån din specifika livssituation och behov

Svara ENDAST i följande JSON-format:
{
  "firstImpression": "Din spontana reaktion (2-4 meningar, skriv i jag-form)",
  "wouldClick": 0-100,
  "emotionalResponse": "Vilka känslor väcker annonsen?",
  "objections": ["Invändning 1", "Invändning 2", "Invändning 3"],
  "relevance": {
    "score": 0-100,
    "explanation": "Hur relevant känns detta för din livssituation?"
  },
  "trustLevel": {
    "score": 0-100,
    "explanation": "Hur trovärdig känns annonsen?"
  },
  "whatWorked": "Vad i annonsen fungerade bra för dig? (1 mening)",
  "missingInfo": "Vad saknar du för att ta nästa steg?"${
    body.isVideo
      ? `,
  "videoSpecific": {
    "hookReaction": "Reaktion på första 3 sekunderna",
    "watchTime": "Hur länge skulle du titta?",
    "dropOffReason": "Om du skulle scrolla vidare – varför?"
  }`
      : ''
  },
  "suggestion": "Ett konkret förslag på hur annonsen kunde tilltala dig bättre"
}

Svara PÅ SVENSKA och i karaktär.`;

    const userMessage = `Reagera på denna ${mediaType} på ${body.channel || 'digital'}:

RUBRIK: ${body.copy.headline}
BRÖDTEXT: ${body.copy.body}
CTA: ${body.copy.cta}
${visualContext}

Ge din ärliga reaktion som ${body.personaName}.`;

    const anthropic = getClaudeClient();
    if (anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1500,
        temperature: 0.8,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({
            firstImpression: parsed.firstImpression || 'Intressant annons.',
            wouldClick: typeof parsed.wouldClick === 'number' ? parsed.wouldClick : 50,
            emotionalResponse: parsed.emotionalResponse || null,
            objections: Array.isArray(parsed.objections) ? parsed.objections : [],
            relevance: parsed.relevance || null,
            trustLevel: parsed.trustLevel || null,
            whatWorked: parsed.whatWorked || null,
            missingInfo: parsed.missingInfo || null,
            videoSpecific: parsed.videoSpecific || null,
            suggestion: parsed.suggestion || null,
          });
        }
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
      relevance: reaction.relevance || null,
      whatWorked: reaction.whatWorked || null,
      suggestion: reaction.suggestion || null,
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
