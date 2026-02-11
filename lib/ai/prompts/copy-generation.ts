import { nordeaToneOfVoice } from '@/lib/constants/tone-of-voice';
import { copyChannels } from '@/lib/constants/channels';

function getChannelRequirements(channel: string): string {
  const channelConfig = copyChannels.find(c => c.id === channel);
  if (!channelConfig) return 'Inga specifika krav.';

  return `Max rubrik: ${channelConfig.maxLength.headline} tecken
Max brödtext: ${channelConfig.maxLength.body} tecken
Kanal: ${channelConfig.label}`;
}

export const copyGenerationPrompt = (channel: string, objective: string, topic: string) => `
Du är en senior copywriter på Nordeas interna marknadsteam.

${nordeaToneOfVoice}

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
    "humanWarm": number,
    "clearSimple": number,
    "confidentHumble": number,
    "forwardLooking": number
  }
}
`;
