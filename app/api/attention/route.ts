import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getClaudeClient, CLAUDE_MODEL } from '@/lib/claude';
import { toImageBlock } from '@/lib/ai/image-input';

// Uppskattad visuell uppmärksamhet för en annonsbild.
//
// Claude tittar på bilden och bedömer var blicken hamnar och i vilken
// ordning. Det är en AI-uppskattning — inte eye-tracking och inte en
// kalibrerad saliency-modell — och UI:t säger det. Utan API-nyckel används
// en layoutbaserad uppskattning (source: 'estimate').

export const runtime = 'nodejs';
export const maxDuration = 60;

const RequestSchema = z.object({
  image: z.string().min(1),
  headline: z.string().optional(),
  cta: z.string().optional(),
});

const PointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  radius: z.number().min(0.02).max(0.6),
  weight: z.number().min(0).max(1),
  label: z.string(),
  order: z.number().int().min(1),
});

const ResultSchema = z.object({
  points: z.array(PointSchema).min(1).max(8),
  first_seen: z.string(),
  summary: z.string(),
  warnings: z.array(z.string()).default([]),
});

export type AttentionResult = z.infer<typeof ResultSchema> & { source: 'ai' | 'estimate' };

const PROMPT = `Du är expert på visuell uppmärksamhet i digital annonsering (eye-tracking-studier, saliency).

Titta på annonsbilden och uppskatta hur en person som scrollar förbi den i sociala medier fördelar blicken under de första 2–3 sekunderna.

Returnera ENDAST JSON:
{
  "points": [
    { "x": 0-1, "y": 0-1, "radius": 0.05-0.4, "weight": 0-1, "label": "kort etikett på svenska, t.ex. Rubrik, Ansikte, CTA-knapp, Logotyp", "order": 1 }
  ],
  "first_seen": "vad blicken fastnar på först (max 8 ord)",
  "summary": "1–2 meningar om hur blicken rör sig och om budskapet hinner fram",
  "warnings": ["max 3 konkreta problem, t.ex. att CTA:n eller logotypen knappt syns"]
}

Regler:
- x och y är mitten av området, som andel av bildens bredd och höjd (0,0 = övre vänstra hörnet).
- radius är ungefärlig storlek som andel av bildens bredd.
- weight är hur mycket uppmärksamhet området får (högst 1).
- order är ordningen blicken besöker områdena (1 = först).
- 3–6 områden. Ansikten, stor text och hög kontrast drar mest.`;

function estimate(): AttentionResult {
  return {
    source: 'estimate',
    points: [
      { x: 0.5, y: 0.34, radius: 0.28, weight: 1, label: 'Rubrik', order: 1 },
      { x: 0.55, y: 0.55, radius: 0.24, weight: 0.7, label: 'Bild', order: 2 },
      { x: 0.5, y: 0.8, radius: 0.16, weight: 0.5, label: 'CTA', order: 3 },
      { x: 0.5, y: 0.07, radius: 0.1, weight: 0.3, label: 'Logotyp', order: 4 },
    ],
    first_seen: 'Rubriken',
    summary: 'Uppskattning utifrån typisk annonslayout — koppla in en API-nyckel för en bedömning av just den här bilden.',
    warnings: [],
  };
}

export async function POST(request: Request) {
  try {
    const parsed = RequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ogiltig förfrågan' }, { status: 400 });
    }

    const client = getClaudeClient();
    const image = await toImageBlock(parsed.data.image);
    if (!client || !image) {
      if (!client) console.log('[CreativeIQ] Attention: ANTHROPIC_API_KEY saknas — layoutbaserad uppskattning');
      return NextResponse.json(estimate());
    }

    const context = [
      parsed.data.headline && `Avsedd rubrik: "${parsed.data.headline}"`,
      parsed.data.cta && `Avsedd CTA: "${parsed.data.cta}"`,
    ].filter(Boolean).join('\n');

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: [image, { type: 'text', text: context ? `${PROMPT}\n\n${context}` : PROMPT }],
        },
      ],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const json = text.match(/\{[\s\S]*\}/);
    const result = json ? ResultSchema.safeParse(JSON.parse(json[0])) : null;
    if (!result?.success) {
      console.warn('[CreativeIQ] Attention: kunde inte tolka svaret — uppskattning används');
      return NextResponse.json(estimate());
    }

    return NextResponse.json({ ...result.data, source: 'ai' } satisfies AttentionResult);
  } catch (error) {
    console.error('[CreativeIQ] Attention error:', error);
    return NextResponse.json(estimate());
  }
}
