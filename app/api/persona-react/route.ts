import { NextResponse } from 'next/server';
import { getClaudeClient } from '@/lib/claude';
import type { ProductCategory } from '@/lib/product-detection';
import { toImageBlocks } from '@/lib/ai/image-input';
import { resolvePersonaIdentity, type PersonaRequestFields } from '@/lib/ai/prompts/persona-simulation';
import { reactSampled } from '@/lib/audience/react';
import { summarize } from '@/lib/audience/aggregate';
import { aiErrorMessage } from '@/lib/ai/error-message';

export const maxDuration = 60;

interface PersonaReactRequest extends PersonaRequestFields {
  copy: {
    headline: string;
    body: string;
    cta: string;
  };
  channel: string;
  /** Annonsen som bild, eller bildrutor ur en video: data-URL:er eller https-URL:er. */
  images?: string[];
  imageDescription?: string;
  isVideo?: boolean;
  productCategory?: ProductCategory;
  /** Antal oberoende svar från personan (1–5). Fler svar visar spridningen. */
  samples?: number;
}

// Exempelsvar när ANTHROPIC_API_KEY saknas (utvecklingsläge). Märks alltid
// med simulation: "mock" så att de aldrig räknas som riktiga svar.
const mockReactions: Record<
  string,
  { firstImpression: string; wouldClick: number; objections: string[]; relevance?: { score: number }; whatWorked?: string; suggestion?: string }
> = {
  'Ung Förstagångsköpare': {
    firstImpression:
      'Okej, det här känns faktiskt relevant för mig. Jag gillar att det inte trycker på "ansök nu" direkt. Men jag vill veta mer om de faktiska kostnaderna innan jag klickar.',
    wouldClick: 75,
    objections: ['Vad är den faktiska räntan?', 'Finns det dolda avgifter?', 'Hur lång tid tar processen?'],
    relevance: { score: 80 },
    whatWorked: 'Tydligt budskap utan övertydligt säljtryck',
    suggestion: 'Visa ett konkret prisexempel eller räntesats',
  },
  Spararen: {
    firstImpression:
      'Lite för vagt för min smak. "Enkel kalkyl" säger mig ingenting. Jag vill se siffror, jämförelser, konkret data.',
    wouldClick: 45,
    objections: ['Hur jämför sig era räntor med andra banker?', 'Vilka avgifter tillkommer?', 'Var är den konkreta informationen?'],
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
    objections: ['Kan jag ringa någon istället?', 'Finns det ett kontor jag kan besöka?', 'Jag litar inte riktigt på att göra detta själv online'],
    relevance: { score: 40 },
    whatWorked: 'Ämnet pension är relevant för mig',
    suggestion: 'Erbjud möjlighet att boka ett personligt rådgivningsmöte',
  },
  Företagaren: {
    firstImpression:
      'Det här pratar till privatpersoner, inte till mig som driver företag. Jag ser inte vad det sparar mig i tid eller pengar.',
    wouldClick: 30,
    objections: ['Gäller det här företagskunder?', 'Får jag en egen kontaktperson?', 'Hur snabbt får jag besked?'],
    relevance: { score: 35 },
    whatWorked: 'Lugn och saklig ton',
    suggestion: 'Säg tydligt vad företaget vinner — tid, likviditet eller en kontaktperson',
  },
  Studenten: {
    firstImpression:
      'Ser snyggt ut och är lätt att förstå. Men jag vet inte om det här är för någon som mig med CSN och extrajobb.',
    wouldClick: 58,
    objections: ['Kostar det något?', 'Kan jag börja med små belopp?'],
    relevance: { score: 60 },
    whatWorked: 'Enkelt språk utan bankjargong',
    suggestion: 'Visa att man kan börja med några hundralappar i månaden',
  },
};

export async function POST(request: Request) {
  let body: PersonaReactRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ogiltig begäran' }, { status: 400 });
  }

  const identity = resolvePersonaIdentity(body);
  const samples = Math.max(1, Math.min(5, Math.round(body.samples ?? 1)));

  const anthropic = getClaudeClient();
  if (!anthropic) {
    console.log('[CreativeIQ] Persona-react: ANTHROPIC_API_KEY saknas — exempelsvar (simulation: "mock")');
    await new Promise((resolve) => setTimeout(resolve, 800));
    const reaction = mockReactions[identity.segmentName] || mockReactions['Spararen'];
    return NextResponse.json({
      firstImpression: reaction.firstImpression,
      wouldClick: reaction.wouldClick,
      spread: summarize([reaction.wouldClick]),
      samples: 1,
      objections: reaction.objections,
      relevance: reaction.relevance || null,
      whatWorked: reaction.whatWorked || null,
      suggestion: reaction.suggestion || null,
      simulation: 'mock',
    });
  }

  try {
    const images = await toImageBlocks(body.images, body.isVideo ? 4 : 1);
    const result = await reactSampled(
      anthropic,
      identity,
      {
        copy: body.copy,
        channel: body.channel,
        images,
        isVideo: !!body.isVideo,
        description: images.length === 0 ? body.imageDescription : undefined,
        productCategory: body.productCategory,
      },
      samples
    );
    return NextResponse.json({
      ...result.reaction,
      wouldClick: result.wouldClick.mean,
      spread: result.wouldClick,
      relevanceSpread: result.relevance,
      trustSpread: result.trust,
      objections: result.objections,
      samples: result.samples,
      simulation: 'ai',
    });
  } catch (error) {
    // Ett fel är aldrig en röst: svara med fel så att det inte räknas in.
    console.error('[CreativeIQ] Persona-react error:', error);
    return NextResponse.json({ error: aiErrorMessage(error, 'Personan kunde inte svara') }, { status: 502 });
  }
}
