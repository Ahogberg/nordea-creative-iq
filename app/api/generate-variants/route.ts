import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(request: Request) {
  try {
    const { template, productDescription, channel, tone, count = 5 } = await request.json();

    // Extract context from template
    const existingTexts = template.default_texts || [];
    const existingHeadline = existingTexts.find((t: { placeholder: string; text: string }) => t.placeholder === 'headline')?.text || '';
    const existingBody = existingTexts.find((t: { placeholder: string; text: string }) => t.placeholder === 'body')?.text || '';
    const existingCta = existingTexts.find((t: { placeholder: string; text: string }) => t.placeholder === 'cta')?.text || '';

    const prompt = `Du är en copywriter för Nordea Bank. Analysera följande annonstext och skapa ${count} varianter.

BEFINTLIG ANNONS:
- Rubrik: "${existingHeadline}"
- Brödtext: "${existingBody}"
- CTA: "${existingCta}"

KAMPANJBESKRIVNING:
${productDescription || 'Ingen beskrivning given - basera på befintlig annons'}

KANAL: ${channel || 'Meta/Instagram'}
TON: ${tone || 'Samma som befintlig'}

REGLER:
- Behåll Nordeas tonalitet: tydlig, varm, professionell
- Rubriker: Max 8 ord, fånga uppmärksamhet
- Brödtext: Max 15 ord, konkret värde
- CTA: Max 3 ord, handlingsorienterad
- Variera vinklarna: emotionell, rationell, brådskande, trygg

Svara ENDAST med JSON i detta format:
{
  "headlines": ["rubrik1", "rubrik2", ...],
  "bodies": ["brödtext1", "brödtext2", ...],
  "ctas": ["cta1", "cta2", ...]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const variants = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      variants,
      context: {
        originalHeadline: existingHeadline,
        originalBody: existingBody,
        originalCta: existingCta,
      },
    });
  } catch (error) {
    console.error('[CreativeIQ] Error generating variants:', error);
    return NextResponse.json(
      { error: 'Failed to generate variants' },
      { status: 500 }
    );
  }
}
