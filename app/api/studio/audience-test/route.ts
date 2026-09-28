import { NextResponse } from "next/server";
import { z } from "zod";
import { getClaudeClient } from "@/lib/claude";
import type { VideoConfig } from "@/lib/remotion/types";
import { PERSONA_LIBRARY } from "@/lib/persona-library";
import { identityFromProfile } from "@/lib/ai/prompts/persona-simulation";
import { reactSampled } from "@/lib/audience/react";
import { aggregatePanel, type Spread } from "@/lib/audience/aggregate";
import { populationWeights, segmentData } from "@/lib/audience/market-data";
import { calibrationStatus } from "@/lib/audience/calibration";
import type { AudiencePersonaResult, AudienceTestResponse } from "@/lib/audience/types";
import { videoStimulus } from "@/lib/audience/video-stimulus";
import { aiErrorMessage } from "@/lib/ai/error-message";

// Fokusgruppstest av videon i Motion Studio: alla standardpersonor tittar på
// bildrutor + manus och svarar flera gånger var. Fel räknas aldrig som svar.

export const runtime = "nodejs";
export const maxDuration = 120;

const SAMPLES = 3;

const RequestSchema = z.object({
  config: z.custom<VideoConfig>((v) => !!v && Array.isArray((v as VideoConfig).scenes)),
  personaIds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltig begäran" }, { status: 400 });

  const client = getClaudeClient();
  if (!client) {
    console.log("[CreativeIQ] audience-test: ANTHROPIC_API_KEY saknas — inget test körs");
    return NextResponse.json(
      { error: "AI-nyckel saknas — fokusgruppen kan inte köras utan den (inga exempelsiffror visas)." },
      { status: 503 }
    );
  }

  try {
    const { config, personaIds } = parsed.data;
    const profiles = personaIds?.length ? PERSONA_LIBRARY.filter((p) => personaIds.includes(p.id)) : PERSONA_LIBRARY;
    const { stimulus, frameCount } = await videoStimulus(config);

    const settled = await Promise.allSettled(
      profiles.map((p) => reactSampled(client, identityFromProfile(p), stimulus, SAMPLES))
    );

    const personas: AudiencePersonaResult[] = profiles.map((p, i) => {
      const pop = segmentData(p.id)?.population;
      const base = {
        id: p.id,
        name: p.shortName,
        avatar: p.avatar,
        population: pop ? `${pop.value.toLocaleString("sv-SE")} ${pop.unit} (${pop.source} ${pop.year})` : null,
      };
      const r = settled[i];
      if (r.status === "rejected") return { ...base, error: aiErrorMessage(r.reason, "Personan kunde inte svara") };
      const v = r.value;
      return {
        ...base,
        wouldClick: v.wouldClick,
        quote: v.reaction.firstImpression,
        objections: v.objections.slice(0, 3),
        suggestion: v.reaction.suggestion,
        firstNoticed: v.reaction.firstNoticed,
        dropOff: v.reaction.videoSpecific?.dropOffReason ?? null,
      };
    });

    const answered = personas.filter((p) => p.wouldClick);
    if (answered.length === 0) {
      return NextResponse.json({ error: personas[0]?.error ?? "Ingen persona kunde svara" }, { status: 502 });
    }
    const { weights, source } = populationWeights(answered.map((p) => p.id));
    const summary = aggregatePanel(
      answered.map((p) => ({ personaId: p.id, wouldClick: p.wouldClick as Spread })),
      weights
    );

    const body: AudienceTestResponse = {
      personas,
      summary,
      weightSource: source,
      samples: SAMPLES,
      frameCount,
      calibration: calibrationStatus(),
    };
    return NextResponse.json(body);
  } catch (error) {
    console.error("[studio:audience-test] error:", error);
    return NextResponse.json({ error: aiErrorMessage(error, "Fokusgruppen kunde inte köras") }, { status: 500 });
  }
}
