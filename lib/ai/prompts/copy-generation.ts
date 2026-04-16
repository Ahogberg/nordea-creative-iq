import { NORDEA_SYSTEM_PROMPT, CHANNEL_SPECS, NORDEA_AD_COPY_RULES } from '@/lib/nordea-brand-guidelines';

function getChannelRequirements(channel: string): string {
  const spec = CHANNEL_SPECS[channel as keyof typeof CHANNEL_SPECS];
  if (!spec) return 'Inga specifika krav.';

  return `Kanal: ${spec.name}
Max rubrik: ${spec.headline.max} tecken (idealiskt ${spec.headline.ideal})
Max brödtext: ${spec.body.max} tecken (idealiskt ${spec.body.ideal})
Föreslagna CTA:er: ${spec.cta.join(', ')}
Tips: ${spec.tips.join('; ')}`;
}

function getForbiddenTerms(): string {
  return NORDEA_AD_COPY_RULES.forbidden
    .map(r => `- ALDRIG "${r.term}" → skriv "${r.replaceWith}" (${r.reason})`)
    .join('\n');
}

export const copyGenerationPrompt = (channel: string, objective: string, topic: string) => `
Du är en senior copywriter på Nordeas interna marknadsteam.

${NORDEA_SYSTEM_PROMPT}

FÖRBJUDNA ORD/FRASER:
${getForbiddenTerms()}

CTA-PRINCIP: ${NORDEA_AD_COPY_RULES.principle}

UPPDRAG:
Skriv marknadsföringscopy för ${channel} med mål: ${objective}

ÄMNE/BRIEF:
${topic}

KANALSPECIFIKA KRAV FÖR ${channel.toUpperCase()}:
${getChannelRequirements(channel)}

GENERERA:
1. Headline (rubrik)
2. Subheadline (underrubrik)
3. Body copy (brödtext)
4. CTA (call-to-action)
5. Hashtags (om relevant för kanalen)

ANALYSERA också hur väl texten följer Nordeas Tone of Voice (0-100 per dimension).

Svara i JSON-format:
{
  "headline": string,
  "subheadline": string,
  "bodyCopy": string,
  "cta": string,
  "hashtags": string | null,
  "brandFitScore": number,
  "toneScores": {
    "personliga": number,
    "experter": number,
    "ansvarsfulla": number
  }
}
`;
