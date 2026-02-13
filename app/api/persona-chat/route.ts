import { NextResponse } from 'next/server';
import { getClaudeClient } from '@/lib/claude';
import { defaultPersonas } from '@/lib/constants/personas';
import { PRODUCT_LABELS, type ProductCategory } from '@/lib/product-detection';

interface PersonaChatRequest {
  personaName: string;
  personaDescription?: string;
  personaTraits?: string[];
  personaPainPoints?: string[];
  personaAge?: { min: number; max: number };
  responseStyle?: string;
  adContext?: {
    headline: string;
    body: string;
    cta: string;
    channel: string;
  };
  messages: Array<{
    role: 'user' | 'persona' | 'assistant';
    content: string;
  }>;
  adContent?: string;
  newMessage?: string;
  productCategory?: ProductCategory;
}

const mockResponses: Record<string, string[]> = {
  'Ung Förstagångsköpare': [
    'Hmm, det låter intressant men jag undrar... vad är den faktiska totalkostnaden?',
    'Okej, men hur jämför det sig med andra banker?',
    'Jag uppskattar att ni försöker förklara, men kan ni vara mer specifika?',
    'Det där med "enkel digital ansökan" – hur enkel är den egentligen?',
  ],
  Spararen: [
    'Intressant, men vad är den faktiska avgiften?',
    'Hur ser den historiska avkastningen ut jämfört med en indexfond?',
    'Jag vill gärna jämföra med andra alternativ först.',
    'Vad händer om marknaden går ner?',
  ],
  Familjeföräldern: [
    'Det låter bra men jag har inte så mycket tid. Kan ni göra det enkelt?',
    'Vi har pratat om att börja spara till barnen, men det finns så många alternativ.',
    'Okej, men kostar det något extra?',
    'Det viktigaste för mig är att det är tryggt och enkelt.',
  ],
  Pensionsspararen: [
    'Jag vet inte riktigt om jag litar på de här digitala lösningarna.',
    'Hur vet jag att mina pengar är säkra?',
    'Det där med pension är så förvirrande.',
    'Min kompis gick till en annan bank och fick bättre villkor.',
  ],
};

export async function POST(request: Request) {
  try {
    const body: PersonaChatRequest = await request.json();
    const { personaName, messages, adContent, adContext, newMessage } = body;

    // Find persona data
    const persona = defaultPersonas.find((p) => p.name === personaName);
    const traits = body.personaTraits || persona?.traits || [];
    const painPoints = body.personaPainPoints || persona?.pain_points || [];
    const ageContext = body.personaAge
      ? `${body.personaAge.min}-${body.personaAge.max} år`
      : persona
        ? `${persona.age_min}-${persona.age_max} år`
        : '';
    const responseStyle = body.responseStyle || persona?.response_style || 'neutral';
    const description = body.personaDescription || persona?.description || '';
    const goals = persona?.goals || [];
    const systemPromptExtra = persona?.system_prompt || '';

    const adInfo = adContext
      ? `ANNONS SOM DISKUTERAS:\n- Rubrik: ${adContext.headline}\n- Brödtext: ${adContext.body}\n- CTA: ${adContext.cta}\n- Kanal: ${adContext.channel}`
      : adContent
        ? `ANNONS SOM DISKUTERAS:\n${adContent}`
        : '';

    const productContext = body.productCategory && body.productCategory !== 'general'
      ? `\nPRODUKTKATEGORI: ${PRODUCT_LABELS[body.productCategory]}\nTänk på hur denna produkt relaterar till dina mål och behov.`
      : '';

    const goalsContext = goals.length > 0
      ? `- Mål: ${goals.join(', ')}`
      : '';

    const systemPrompt = `Du är "${personaName}", en fiktiv persona som diskuterar en bankannons från Nordea.

DIN PROFIL:
${ageContext ? `- Ålder: ${ageContext}` : ''}
- Beskrivning: ${description}
- Karaktärsdrag: ${traits.join(', ')}
- Smärtpunkter: ${painPoints.join(', ')}
${goalsContext}
- Responsstil: ${responseStyle}
${productContext}

${adInfo}

${systemPromptExtra}

INSTRUKTIONER:
- Svara som ${personaName} skulle svara
- Håll dig i karaktär hela tiden
- Ge korta, naturliga svar (1-3 meningar)
- Var ärlig och autentisk
- Om frågan är om annonsen, relatera till dina egna behov och smärtpunkter
- Relatera dina svar till dina personliga mål och livssituation`;

    // Build conversation history
    const chatMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (messages && messages.length > 0) {
      for (const msg of messages) {
        chatMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }

    if (newMessage) {
      chatMessages.push({ role: 'user', content: newMessage });
    }

    if (chatMessages.length === 0) {
      chatMessages.push({
        role: 'user',
        content: 'Hej! Vad tycker du om den här annonsen?',
      });
    }

    const anthropic = getClaudeClient();
    if (anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        temperature: 0.9,
        system: systemPrompt,
        messages: chatMessages,
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const sentiment =
          responseStyle === 'skeptical'
            ? 'skeptical'
            : responseStyle === 'curious'
              ? 'curious'
              : 'neutral';
        return NextResponse.json({ reply: content.text, sentiment });
      }
    }

    // Fallback to mock
    console.log('[CreativeIQ] Persona-chat fallback till mockdata');
    await new Promise((resolve) => setTimeout(resolve, 800));
    const responses = mockResponses[personaName] || mockResponses['Spararen'];
    const messageIndex = (messages?.length || 0) % responses.length;
    return NextResponse.json({
      reply: responses[messageIndex],
      sentiment: personaName === 'Pensionsspararen' ? 'skeptical' : 'neutral',
    });
  } catch (error) {
    console.error('[CreativeIQ] Persona-chat error:', error);
    return NextResponse.json({
      reply: 'Jag förstår inte riktigt vad du menar. Kan du förklara lite mer?',
      sentiment: 'neutral',
    });
  }
}
