import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/ai/anthropic";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logGeneration } from "@/lib/ai/providers/cost-tracker";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  text: z.string().min(20).max(20000),
});

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const PARSE_PROMPT = `Du är seniör creative strateg på Nordeas marknadsteam. Användaren laddar upp en brief eller kampanjbeskrivning och vill att du extraherar den till strukturerade strategi-fält.

Briefen kan vara formell eller informell, kort eller lång. Din uppgift är att tolka och normalisera innehållet till följande JSON-schema:

{
  "title": "Kort namn på kampanjen (max 60 tecken)",
  "problem": "Vad är utmaningen eller möjligheten? (1-3 meningar)",
  "audience_description": "Vem är målgruppen? (1-3 meningar)",
  "current_perception": "Hur tänker målgruppen idag? (1-2 meningar, kan vara tom om okänt)",
  "desired_action": "Vad ska målgruppen göra? (1-2 meningar)",
  "key_message": "Kärnan i budskapet (1-2 meningar)",
  "unique_value": "Vad gör Nordea bättre i detta sammanhang? (1-2 meningar, kan vara tom om okänt)"
}

Om något fält saknas i briefen — lämna det som tom sträng, hitta inte på. Bevara originaltextens nyanser. Översätt EJ till annat språk — om briefen är på engelska, behåll engelska.

Returnera ENDAST JSON, inga förklaringar eller markdown.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = RequestSchema.parse(body);

    const startTime = Date.now();

    let parsed: Record<string, string>;

    if (!client) {
      parsed = getMockParsed(text);
    } else {
      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2000,
        system: PARSE_PROMPT,
        messages: [{ role: "user", content: text }],
      });

      const responseText =
        response.content[0]?.type === "text" ? response.content[0].text : "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in Claude response");

      parsed = JSON.parse(jsonMatch[0]);

      await logGeneration({
        user_id: "default-user",
        kind: "video",
        provider: "claude",
        model: CLAUDE_MODEL,
        prompt: "brief_parse",
        params: { text_length: text.length },
        cost_usd: 0.01,
        latency_ms: Date.now() - startTime,
        status: "success",
      });
    }

    // Persist the parsed brief immediately so the upload flow lands the
    // user on /review with a real id, mirroring the wizard's auto-save UX.
    const supabase = await createClient();
    const { data: brief, error } = await supabase
      .from("creative_briefs")
      .insert({
        source: "upload",
        title: parsed.title?.slice(0, 200) || "Uppladdad brief",
        problem: parsed.problem || null,
        audience_description: parsed.audience_description || null,
        current_perception: parsed.current_perception || null,
        desired_action: parsed.desired_action || null,
        key_message: parsed.key_message || null,
        unique_value: parsed.unique_value || null,
        status: "draft",
        created_by: "default-user",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ brief, parsed });
  } catch (error) {
    console.error("[brief:parse] error:", error);
    return NextResponse.json(
      {
        error: "Failed to parse brief",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

function getMockParsed(text: string): Record<string, string> {
  // Cheap heuristic for offline dev: first sentence → title, full text → problem.
  const firstSentence = text.split(/[.!?\n]/)[0].trim();
  return {
    title: firstSentence.slice(0, 60) || "Uppladdad brief",
    problem: text.slice(0, 300),
    audience_description: "",
    current_perception: "",
    desired_action: "",
    key_message: "",
    unique_value: "",
  };
}
