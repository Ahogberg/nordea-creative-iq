import { NextResponse } from 'next/server';
import { callClaudeChat } from '@/lib/ai/anthropic';
import { personaSimulationPrompt } from '@/lib/ai/prompts/persona-simulation';
import { defaultPersonas } from '@/lib/constants/personas';
import type { Persona } from '@/types/database';

const mockResponses: Record<string, string[]> = {
  'Ung Förstagångsköpare': [
    'Hmm, det låter intressant men jag undrar... vad är den faktiska totalkostnaden? Jag har läst att det finns en massa dolda avgifter som bankerna inte alltid är tydliga med.',
    'Okej, men hur jämför det sig med andra banker? Jag har kollat runt lite och det verkar som att det finns billigare alternativ. Kan ni matcha det?',
    'Jag uppskattar att ni försöker förklara, men kan ni vara mer specifika? Typ, exakt hur mycket behöver jag ha i kontantinsats för en tvåa i Stockholm?',
    'Det där med "enkel digital ansökan" – hur enkel är den egentligen? Förra gången jag försökte göra något digitalt hos en bank tog det typ en timme...',
    'Jag gillar att ni är transparenta med kostnaderna. Det är precis vad jag letar efter. Men kan jag verkligen lita på att det inte tillkommer något extra sen?',
  ],
  'Spararen': [
    'Intressant, men vad är den faktiska avgiften? Jag har sett att många fonder har dolda avgifter som äter upp avkastningen.',
    'Hur ser den historiska avkastningen ut jämfört med en vanlig indexfond? Jag vill se siffror, inte bara löften.',
    'Jag förstår att ni rekommenderar det här, men jag vill gärna jämföra med andra alternativ först. Har ni någon jämförelsetjänst?',
    'Vad händer om marknaden går ner? Hur skyddade är mina pengar egentligen?',
    'Det låter rimligt. Men jag vill tänka på det ett tag innan jag bestämmer mig. Kan ni skicka mer info?',
  ],
  'Familjeföräldern': [
    'Det låter bra men jag har inte så mycket tid att sätta mig in i det. Kan ni göra det enkelt för mig? Typ, vad behöver jag faktiskt göra?',
    'Vi har pratat om att börja spara till barnen, men det finns så många alternativ. Vad rekommenderar ni om man inte vill behöva tänka på det hela tiden?',
    'Okej, men kostar det något extra? Vi har redan ganska höga utgifter varje månad med bolån och dagis.',
    'Det viktigaste för mig är att det är tryggt och enkelt. Jag vill inte sitta och flytta pengar hela tiden.',
    'Tack, det var tydligt! Kan min partner också få tillgång till kontot så vi kan kolla tillsammans?',
  ],
  'Pensionsspararen': [
    'Jag vet inte riktigt om jag litar på de här digitala lösningarna. Kan jag inte prata med någon istället? En riktig person som kan förklara?',
    'Hur vet jag att mina pengar är säkra? Jag har jobbat hela livet för det här och vill inte riskera att förlora det.',
    'Det där med pension är så förvirrande. Allmän pension, tjänstepension, privat pension... kan ni inte bara säga rakt ut om jag har tillräckligt?',
    'Min kompis gick till en annan bank och fick mycket bättre villkor. Varför ska jag stanna hos er?',
    'Jag uppskattar att ni tar er tid att förklara. Det är inte alla som gör det. Men jag vill gärna ha det på papper också.',
  ],
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { personaName, messages, adContent } = body;

    // Find persona data
    const persona = defaultPersonas.find(p => p.name === personaName);
    if (!persona) {
      return NextResponse.json({ reply: 'Persona hittades inte.', sentiment: 'neutral' });
    }

    const systemPrompt = personaSimulationPrompt(persona as unknown as Persona);

    // Build conversation history for Claude
    const chatMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (messages && messages.length > 0) {
      for (const msg of messages) {
        chatMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    } else {
      chatMessages.push({
        role: 'user',
        content: adContent || 'Hej! Vad tycker du om den här annonsen?',
      });
    }

    const result = await callClaudeChat(systemPrompt, chatMessages, {
      maxTokens: 512,
      temperature: 0.9,
    });

    if (result) {
      const sentiment = persona.response_style === 'skeptical' ? 'skeptical'
        : persona.response_style === 'curious' ? 'neutral'
        : 'neutral';
      return NextResponse.json({ reply: result, sentiment });
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
    await new Promise((resolve) => setTimeout(resolve, 800));
    return NextResponse.json({
      reply: 'Jag förstår inte riktigt vad du menar. Kan du förklara lite mer?',
      sentiment: 'neutral',
    });
  }
}
