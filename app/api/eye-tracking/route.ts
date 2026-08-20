import { NextResponse } from 'next/server';
import { getClaudeClient, CLAUDE_MODEL } from '@/lib/claude';
import {
  eyeTrackingPrompt,
  buildMockEyeTracking,
  type EyeTrackingResult,
} from '@/lib/ai/prompts/eye-tracking';

interface EyeTrackingRequest {
  imageBase64: string;
  mediaType: string;
  headline?: string;
  bodyText?: string;
  cta?: string;
  channel?: string;
}

const clamp01 = (n: unknown, fallback: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;

// Normalisera modellens svar så koordinater alltid är 0-1 och listor finns
function sanitize(parsed: Partial<EyeTrackingResult>): EyeTrackingResult {
  const fixations = (Array.isArray(parsed.fixations) ? parsed.fixations : [])
    .slice(0, 8)
    .map((f, i) => ({
      order: typeof f.order === 'number' ? f.order : i + 1,
      x: clamp01(f.x, 0.5),
      y: clamp01(f.y, 0.5),
      intensity: clamp01(f.intensity, 0.5),
      duration_ms: typeof f.duration_ms === 'number' ? f.duration_ms : 300,
      label: typeof f.label === 'string' ? f.label : `Fixation ${i + 1}`,
    }))
    .sort((a, b) => a.order - b.order);

  const regions = (Array.isArray(parsed.regions) ? parsed.regions : [])
    .slice(0, 10)
    .map((r, i) => ({
      x: clamp01(r.x, 0.25),
      y: clamp01(r.y, 0.25),
      width: clamp01(r.width, 0.3),
      height: clamp01(r.height, 0.15),
      intensity: clamp01(r.intensity, 0.5),
      label: typeof r.label === 'string' ? r.label : `Region ${i + 1}`,
      attention_pct:
        typeof r.attention_pct === 'number' ? Math.round(Math.min(100, Math.max(0, r.attention_pct))) : 0,
    }));

  return {
    attention_score:
      typeof parsed.attention_score === 'number'
        ? Math.round(Math.min(100, Math.max(0, parsed.attention_score)))
        : 70,
    fixations,
    regions,
    scan_path_summary:
      typeof parsed.scan_path_summary === 'string' ? parsed.scan_path_summary : '',
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.filter((w) => typeof w === 'string') : [],
  };
}

export async function POST(request: Request) {
  let body: EyeTrackingRequest | null = null;
  try {
    body = await request.json();
    const { imageBase64, mediaType, headline, bodyText, cta, channel } = body!;

    const copyContext =
      headline || bodyText || cta
        ? `\n\nTILLHÖRANDE COPY (hjälper dig identifiera elementen i bilden):\nRubrik: ${headline || 'Ej angiven'}\nBrödtext: ${bodyText || 'Ej angiven'}\nCTA: ${cta || 'Ej angiven'}`
        : '';

    const anthropic = getClaudeClient();
    if (anthropic && imageBase64) {
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2000,
        system: eyeTrackingPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: imageBase64,
                },
              },
              {
                type: 'text' as const,
                text: `Simulera eye-tracking för denna annons${channel ? ` (kanal: ${channel})` : ''}.${copyContext}`,
              },
            ],
          },
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = sanitize(JSON.parse(jsonMatch[0]));
          if (result.fixations.length > 0 || result.regions.length > 0) {
            return NextResponse.json(result);
          }
        }
      }
    }

    console.log('[CreativeIQ] Eye-tracking fallback till mockdata');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return NextResponse.json(
      buildMockEyeTracking({ headline, cta, hasBody: Boolean(bodyText) })
    );
  } catch (error) {
    console.error('[CreativeIQ] Eye-tracking error:', error);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return NextResponse.json(
      buildMockEyeTracking({
        headline: body?.headline,
        cta: body?.cta,
        hasBody: Boolean(body?.bodyText),
      })
    );
  }
}
