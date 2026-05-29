import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { logGeneration } from "@/lib/ai/providers/cost-tracker";
import {
  NORDEA_BRAND_CONTEXT,
  NORDEA_COPY_EXAMPLES,
} from "@/lib/brand/nordea-context";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  field: z.string(),
  currentValue: z.any(),
  briefContext: z.any(),
  instruction: z.string().min(1),
});

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const SYSTEM = `${NORDEA_BRAND_CONTEXT}

REFERENS — Bra Nordea-copy:
${NORDEA_COPY_EXAMPLES.map(
  (ex) => `[${ex.context}] "${ex.headline}" — ${ex.why_good}`
).join("\n")}

Du är AI-assistent som justerar specifika delar av en kampanjbrief enligt användarens önskemål.

VIKTIGT: Behåll EXAKT samma datatyp som "currentValue".
- Om currentValue är en sträng → returnera sträng
- Om currentValue är en array av objekt → returnera array av objekt med samma fält
- Om currentValue är ett objekt → returnera objekt med samma fält

Returnera ENDAST JSON: { "suggestion": <new_value_in_same_format_as_current> }`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { field, currentValue, briefContext, instruction } =
      RequestSchema.parse(body);

    const startTime = Date.now();

    if (!client) {
      // Mock: smart-ish fallback that preserves shape
      const mock =
        typeof currentValue === "string"
          ? `${currentValue} (justerat: ${instruction})`
          : currentValue;
      return NextResponse.json({ suggestion: mock, mock: true });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `FIELD: ${field}\n\nNUVARANDE VÄRDE:\n${JSON.stringify(
            currentValue,
            null,
            2
          )}\n\nBREDARE BRIEF-KONTEXT:\n${JSON.stringify(
            briefContext,
            null,
            2
          )}\n\nANVÄNDARENS ÖNSKEMÅL:\n${instruction}\n\nJustera värdet och returnera i exakt samma format.`,
        },
      ],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Claude response");

    const parsed = JSON.parse(jsonMatch[0]);

    await logGeneration({
      user_id: "default-user",
      kind: "video",
      provider: "claude",
      model: "claude-sonnet-4-5-20250929",
      prompt: "brief_refine",
      params: { field },
      cost_usd: 0.008,
      latency_ms: Date.now() - startTime,
      status: "success",
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[brief:refine] error:", error);
    return NextResponse.json(
      {
        error: "Refinement failed",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
