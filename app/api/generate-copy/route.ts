import { NextResponse } from 'next/server';

const mockCopies: Record<string, Record<string, { headline: string; subheadline: string; bodyCopy: string; cta: string; hashtags: string | null; brandFitScore: number; toneScores: { humanWarm: number; clearSimple: number; confidentHumble: number; forwardLooking: number } }>> = {
  linkedin: {
    awareness: {
      headline: 'Ditt första boende börjar med en enkel kalkyl',
      subheadline: 'Vi hjälper dig förstå vad du har råd med – steg för steg',
      bodyCopy: 'Att köpa sin första bostad är stort. Vi vet att det kan kännas överväldigande med amorteringskrav, kontantinsats och räntebindning. Därför har vi gjort det enkelt. Med vår bolånekalkylator får du svar på några minuter – utan förpliktelser.',
      cta: 'Testa kalkylatorn',
      hashtags: '#Nordea #FörstaBostad #Bolån #TillsammansGörViDetMöjligt',
      brandFitScore: 87,
      toneScores: { humanWarm: 82, clearSimple: 91, confidentHumble: 78, forwardLooking: 85 },
    },
    consideration: {
      headline: 'Vad skiljer ett bra bolån från ett dåligt?',
      subheadline: 'Tre saker att kolla innan du bestämmer dig',
      bodyCopy: 'Räntan är viktig – men inte allt. Vi hjälper dig förstå helheten: amorteringstakt, bindningstid och flexibilitet. Så att du kan fatta ett beslut du känner dig trygg med.',
      cta: 'Jämför våra bolån',
      hashtags: '#Nordea #Bolån #Ekonomi',
      brandFitScore: 84,
      toneScores: { humanWarm: 78, clearSimple: 88, confidentHumble: 82, forwardLooking: 80 },
    },
    conversion: {
      headline: 'Ansök om bolån – svar inom 24 timmar',
      subheadline: 'Enkel digital ansökan, personlig rådgivning',
      bodyCopy: 'Du har hittat drömmen. Nu hjälper vi dig hela vägen. Fyll i vår digitala ansökan på 10 minuter så kontaktar en rådgivare dig inom 24 timmar. Inga konstigheter.',
      cta: 'Ansök nu',
      hashtags: '#Nordea #Bolåneansökan',
      brandFitScore: 82,
      toneScores: { humanWarm: 75, clearSimple: 90, confidentHumble: 72, forwardLooking: 88 },
    },
    retention: {
      headline: 'Tack för att du är kund hos oss',
      subheadline: 'Vi vill se till att du alltid har rätt villkor',
      bodyCopy: 'Marknaden förändras – och det bör dina villkor också göra. Boka ett kostnadsfritt rådgivningsmöte så går vi igenom ditt bolån tillsammans.',
      cta: 'Boka rådgivning',
      hashtags: '#Nordea #Kunderbjudande',
      brandFitScore: 89,
      toneScores: { humanWarm: 90, clearSimple: 85, confidentHumble: 88, forwardLooking: 82 },
    },
  },
};

export async function POST(request: Request) {
  const body = await request.json();
  const { channel, objective } = body;

  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.log('[CreativeIQ] Ingen API-nyckel konfigurerad – returnerar mockad copy');
  }

  const channelCopies = mockCopies[channel] || mockCopies.linkedin;
  const copy = channelCopies[objective] || channelCopies.awareness;

  return NextResponse.json(copy);
}
