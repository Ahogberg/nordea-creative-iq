import { NextResponse } from 'next/server';
import { getClaudeClient, COMPLIANCE_RULES } from '@/lib/claude';
import { NORDEA_SYSTEM_PROMPT } from '@/lib/nordea-brand-guidelines';

interface AnalyzeVideoRequest {
  frames: Array<{
    timestamp: number;
    base64: string;
    mediaType: string;
  }>;
  duration: number;
  headline?: string;
  bodyText?: string;
  cta?: string;
  channel: string;
}

// Mock fallback
const mockVideoAnalysis = {
  scores: {
    hook: 85,
    pacing: 68,
    branding: 75,
    ctaTiming: 60,
    compliance: 70,
    overall: 72,
  },
  hookAnalysis: {
    score: 85,
    feedback: 'Videon öppnar med en stark visuell hook som fångar uppmärksamheten.',
    attentionGrabber: 'Texten i stor font fångar ögat direkt.',
    improvement: 'Överväg att börja med en fråga för ännu starkare hook.',
  },
  pacingAnalysis: {
    score: 68,
    feedback: 'Tempot är ojämnt – starkt i början men tappar i mitten.',
    slowSections: 'Mittensektionen (5-9 sek) saknar visuell variation.',
    improvement: 'Lägg till textanimationer eller scenbyten var 2-3 sekund.',
  },
  brandingAnalysis: {
    score: 75,
    logoVisibility: 'Logotypen syns i slutet men inte i början.',
    brandColors: 'Nordea Blue (#0000A0) används konsekvent i text och grafik.',
    brandFit: 'Videon matchar Nordeas profil men kunde vara mer premium.',
  },
  ctaAnalysis: {
    score: 60,
    timing: 'CTA visas vid 12 sekunder av 15.',
    visibility: 'CTA-texten är läsbar men inte framträdande.',
    recommendation: 'Flytta CTA till 6-8 sekunder och gör den mer visuellt dominant.',
  },
  complianceIssues: [
    {
      severity: 'high' as const,
      issue: 'Disclaimer saknas',
      timestamp: 'Hela videon',
      recommendation: 'Lägg till standarddisclaimer i slutrutan.',
    },
  ],
  silentViewability: {
    score: 72,
    feedback: 'Videon fungerar delvis utan ljud tack vare textöverlägg.',
    textOverlays: 'Text finns men är för liten på mobil.',
    recommendation: 'Öka textstorleken och lägg till undertexter.',
  },
  suggestions: [
    'Flytta CTA till tidigare i videon (inom 8 sekunder)',
    'Lägg till undertexter för ljudlös visning',
    'Öka tempot i mittensektionen',
    'Visa Nordea-logotyp i första 3 sekunderna',
  ],
  summary:
    'Videon har en stark hook men tappar tempo i mitten. CTA kommer för sent och disclaimer saknas.',
};

export async function POST(request: Request) {
  try {
    const body: AnalyzeVideoRequest = await request.json();
    const { frames, duration, headline, bodyText, cta, channel } = body;

    const selectedFrames = frames.slice(0, 5);

    const copyContext =
      headline || bodyText || cta
        ? `\nTILLHÖRANDE COPY:\nRubrik: ${headline || 'Ej angiven'}\nBrödtext: ${bodyText || 'Ej angiven'}\nCTA: ${cta || 'Ej angiven'}`
        : '';

    const anthropic = getClaudeClient();
    if (anthropic) {
      const messageContent: Array<
        | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } }
        | { type: 'text'; text: string }
      > = [];

      selectedFrames.forEach((frame, index) => {
        messageContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: frame.base64,
          },
        });
        messageContent.push({
          type: 'text',
          text: `[Frame ${index + 1} - ${frame.timestamp.toFixed(1)}s]`,
        });
      });

      messageContent.push({
        type: 'text',
        text: `Analysera denna videoannons för ${channel}.

VIDEO-INFO:
- Längd: ${duration.toFixed(1)} sekunder
- Antal frames analyserade: ${selectedFrames.length}
${copyContext}

Ge detaljerad analys av:
1. HOOK (0-3 sek): Fångar videon uppmärksamhet direkt?
2. PACING: Är tempot rätt?
3. BRANDING: Syns Nordea tydligt?
4. CTA TIMING: När visas call-to-action?
5. COMPLIANCE: Finns nödvändiga disclaimers?
6. HELHET: Fungerar videon utan ljud?`,
      });

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 3000,
        system: `${NORDEA_SYSTEM_PROMPT}

${COMPLIANCE_RULES}

Du är en expert på att analysera videoannonser för sociala medier, särskilt för banker.

VIKTIGT FÖR VIDEO:
- De flesta ser video UTAN ljud på Meta/Instagram
- Hook (första 3 sek) är avgörande
- CTA bör komma inom 8 sekunder
- Textöverlägg måste vara läsbara på mobil
- Logotyp bör synas tidigt OCH sent

Svara ENDAST i följande JSON-format:
{
  "scores": {
    "hook": 0-100,
    "pacing": 0-100,
    "branding": 0-100,
    "ctaTiming": 0-100,
    "compliance": 0-100,
    "overall": 0-100
  },
  "hookAnalysis": {
    "score": 0-100,
    "feedback": "...",
    "attentionGrabber": "...",
    "improvement": "..."
  },
  "pacingAnalysis": {
    "score": 0-100,
    "feedback": "...",
    "slowSections": "...",
    "improvement": "..."
  },
  "brandingAnalysis": {
    "score": 0-100,
    "logoVisibility": "...",
    "brandColors": "...",
    "brandFit": "..."
  },
  "ctaAnalysis": {
    "score": 0-100,
    "timing": "...",
    "visibility": "...",
    "recommendation": "..."
  },
  "complianceIssues": [
    { "severity": "high"|"medium"|"low", "issue": "...", "timestamp": "...", "recommendation": "..." }
  ],
  "silentViewability": {
    "score": 0-100,
    "feedback": "...",
    "textOverlays": "...",
    "recommendation": "..."
  },
  "suggestions": ["..."],
  "summary": "..."
}`,
        messages: [
          {
            role: 'user',
            content: messageContent,
          },
        ],
      });

      const responseContent = response.content[0];
      if (responseContent.type === 'text') {
        const jsonMatch = responseContent.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return NextResponse.json(result);
        }
      }
    }

    // Fallback to mock
    console.log('[CreativeIQ] Video analysis fallback till mockdata');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return NextResponse.json(mockVideoAnalysis);
  } catch (error) {
    console.error('[CreativeIQ] Analyze-video error:', error);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return NextResponse.json(mockVideoAnalysis);
  }
}
