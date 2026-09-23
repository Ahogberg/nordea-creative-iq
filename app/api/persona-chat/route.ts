import type Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getClaudeClient, CLAUDE_MODEL } from '@/lib/claude';
import { PRODUCT_LABELS, type ProductCategory } from '@/lib/product-detection';
import { toImageBlocks } from '@/lib/ai/image-input';
import {
  buildPersonaProfileBlock,
  buildVisualInstruction,
  resolvePersonaIdentity,
  type PersonaRequestFields,
} from '@/lib/ai/prompts/persona-simulation';

interface PersonaChatRequest extends PersonaRequestFields {
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
  /** Annonsen som bild, eller bildrutor ur en video: data-URL:er eller https-URL:er. */
  images?: string[];
  isVideo?: boolean;
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
    const { messages, adContent, adContext, newMessage } = body;

    const identity = resolvePersonaIdentity(body);
    const responseStyle = identity.responseStyle;
    const images = await toImageBlocks(body.images, body.isVideo ? 4 : 1);

    const adInfo = adContext
      ? `ANNONS SOM DISKUTERAS:\n- Rubrik: ${adContext.headline}\n- Brödtext: ${adContext.body}\n- CTA: ${adContext.cta}\n- Kanal: ${adContext.channel}`
      : adContent
        ? `ANNONS SOM DISKUTERAS:\n${adContent}`
        : '';

    const productContext = body.productCategory && body.productCategory !== 'general'
      ? `\nPRODUKTKATEGORI: ${PRODUCT_LABELS[body.productCategory]}\nTänk på hur denna produkt relaterar till dina mål och behov.`
      : '';

    const systemPrompt = `${buildPersonaProfileBlock(identity)}

Du pratar med någon från Nordeas marknadsteam${adInfo ? ' om en av deras annonser' : ''}.
${productContext}

${adInfo}
${images.length > 0 ? `\n${buildVisualInstruction(body.isVideo ? 'frames' : 'image')}\n` : ''}
INSTRUKTIONER:
- Svara som ${identity.speakerName} skulle svara
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

    // Klientens hälsningsfras ("Hej! Jag är …") ligger först — API:t vill att
    // konversationen börjar med användaren.
    while (chatMessages.length > 0 && chatMessages[0].role === 'assistant') {
      chatMessages.shift();
    }

    if (chatMessages.length === 0) {
      chatMessages.push({
        role: 'user',
        content: 'Hej! Vad tycker du om den här annonsen?',
      });
    }

    // Bilden följer med i första användarmeddelandet så att hela samtalet kan
    // referera till den.
    const firstUserIndex = chatMessages.findIndex((m) => m.role === 'user');
    const apiMessages: Anthropic.MessageParam[] = chatMessages.map((m, i) =>
      i === firstUserIndex && images.length > 0
        ? { role: m.role, content: [...images, { type: 'text', text: m.content }] }
        : m
    );

    const anthropic = getClaudeClient();
    if (anthropic) {
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 500,
        temperature: 0.9,
        system: systemPrompt,
        messages: apiMessages,
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
    const responses = mockResponses[identity.segmentName] || mockResponses['Spararen'];
    const messageIndex = (messages?.length || 0) % responses.length;
    return NextResponse.json({
      reply: responses[messageIndex],
      sentiment: identity.segmentName === 'Pensionsspararen' ? 'skeptical' : 'neutral',
    });
  } catch (error) {
    console.error('[CreativeIQ] Persona-chat error:', error);
    return NextResponse.json({
      reply: 'Jag förstår inte riktigt vad du menar. Kan du förklara lite mer?',
      sentiment: 'neutral',
    });
  }
}
