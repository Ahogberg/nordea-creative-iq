import { nordicMarkets } from '@/lib/constants/markets';

export const localizationPrompt = (sourceMarket: string, targetMarket: string, content: { headline: string; body: string; cta: string }) => `
Du är expert på nordisk marknadsföring och lokalisering för Nordea.

UPPGIFT:
Lokalisera följande marknadsföringsinnehåll från ${sourceMarket} till ${targetMarket}.

KÄLLINNEHÅLL:
Rubrik: ${content.headline}
Brödtext: ${content.body}
CTA: ${content.cta}

MÅLMARKNADSINFO:
${JSON.stringify(nordicMarkets.find(m => m.id === targetMarket), null, 2)}

INSTRUKTIONER:
1. Översätt och anpassa kulturellt - inte bara ordagrant
2. Behåll Nordeas Tone of Voice
3. Anpassa till lokala marknadsföringsregler
4. Justera ton enligt marknadens preferenser
5. Använd lokala uttryck och referenspunkter där lämpligt

DOKUMENTERA:
- Alla anpassningar du gör och varför
- Quality scores för språk, kultur och juridik
- 2-3 alternativa rubriker

Svara i JSON-format:
{
  "headline": string,
  "body": string,
  "cta": string,
  "scores": {
    "linguistic": number,
    "cultural": number,
    "legal": number
  },
  "adaptations": [
    {
      "type": "cultural" | "linguistic" | "legal" | "tone",
      "original": string,
      "adapted": string,
      "reason": string
    }
  ],
  "alternativeHeadlines": [
    {"text": string, "confidence": number}
  ]
}
`;
