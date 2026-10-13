import { NextResponse } from "next/server";
import { z } from "zod";
import { getClaudeClient } from "@/lib/claude";
import type { VideoConfig } from "@/lib/remotion/types";
import { PERSONA_LIBRARY } from "@/lib/persona-library";
import { identityFromProfile } from "@/lib/ai/prompts/persona-simulation";
import { compareSampled } from "@/lib/audience/react";
import { aggregateCompare } from "@/lib/audience/aggregate";
import { populationWeights } from "@/lib/audience/market-data";
import { calibrationStatus } from "@/lib/audience/calibration";
import type { AudienceCompareResponse, ComparePersonaResult } from "@/lib/audience/types";
import { videoStimulus } from "@/lib/audience/video-stimulus";
import { aiErrorMessage } from "@/lib/ai/error-message";

// A/B i Motion Studio: varje persona ser versionen före (A) och efter (B) en
// ändring och väljer — flera gånger, i slumpad ordning. Ett parvist val är
// stabilare än två fristående betyg.

export const runtime = "nodejs";
export const maxDuration = 120;

const SAMPLES = 3;

const config = z.custom<VideoConfig>((v) => !!v && Array.isArray((v as VideoConfig).scenes));
const RequestSchema = z.object({ a: config, b: config, personaIds: z.array(z.string()).optional() });

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltig begäran" }, { status: 400 });

  const client = getClaudeClient();
  if (!client) {
    return NextResponse.json(
      { error: "AI-nyckel saknas — jämförelsen kan inte köras utan den (inga exempelsiffror visas)." },
      { status: 503 }
    );
  }

  try {
    const { a, b, personaIds } = parsed.data;
    const profiles = personaIds?.length ? PERSONA_LIBRARY.filter((p) => personaIds.includes(p.id)) : PERSONA_LIBRARY;
    // Renderas i tur och ordning — samma webbläsare delas.
    const stimA = (await videoStimulus(a)).stimulus;
    const stimB = (await videoStimulus(b)).stimulus;

    const settled = await Promise.allSettled(
      profiles.map((p) => compareSampled(client, identityFromProfile(p), stimA, stimB, SAMPLES))
    );
    const personas: ComparePersonaResult[] = profiles.map((p, i) => {
      const base = { id: p.id, name: p.shortName, avatar: p.avatar };
      const r = settled[i];
      if (r.status === "rejected") return { ...base, error: aiErrorMessage(r.reason, "Personan kunde inte svara") };
      const votes = { A: 0, B: 0, ingen: 0 };
      for (const v of r.value.votes) votes[v.choice]++;
      return { ...base, preferB: r.value.preferB, votes, why: r.value.why };
    });

    const answered = personas.filter((p) => p.preferB !== undefined);
    if (answered.length === 0) {
      return NextResponse.json({ error: personas[0]?.error ?? "Ingen persona kunde svara" }, { status: 502 });
    }
    const { weights, source } = populationWeights(answered.map((p) => p.id));
    const summary = aggregateCompare(
      answered.map((p) => ({ personaId: p.id, preferB: p.preferB as number, n: SAMPLES })),
      weights
    );
    const body: AudienceCompareResponse = {
      personas,
      summary,
      weightSource: source,
      samples: SAMPLES,
      calibration: calibrationStatus(),
    };
    return NextResponse.json(body);
  } catch (error) {
    console.error("[studio:audience-compare] error:", error);
    return NextResponse.json({ error: aiErrorMessage(error, "Jämförelsen kunde inte köras") }, { status: 500 });
  }
}
