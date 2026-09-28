import { NextResponse } from "next/server";
import { z } from "zod";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/claude";
import type { VideoConfig } from "@/lib/remotion/types";
import { compileCanvasScenes, stripCompiledCanvas } from "@/lib/remotion/compile";
import { applyPatch, type PatchOp } from "@/lib/remotion/json-patch";
import { renderPreviewFrames, type PreviewFrame } from "@/lib/remotion/preview-frames";
import { withMotionCapabilities } from "@/lib/remotion/prompt-capabilities";
import { withVisualGrammar } from "@/lib/brand/visual-grammar";
import { lintVideoConfig } from "@/lib/studio/video-lint";
import { aiErrorMessage } from "@/lib/ai/error-message";

// Självgranskning efter varje AI-ändring i Motion Studio:
//  1. regelkontroll (deterministisk) — entydiga rättningar tillämpas direkt
//  2. förhandsbilder renderas (om en renderare finns i miljön)
//  3. AI:n tittar på bilderna mot Nordeas grammatik och svarar med en minimal
//     patch för tydliga fel — aldrig en ny kreativ riktning

export const runtime = "nodejs";
export const maxDuration = 120;

const RequestSchema = z.object({
  config: z.custom<VideoConfig>((v) => !!v && Array.isArray((v as VideoConfig).scenes)),
  request: z.string().max(4000).optional(),
});

export interface ReviewIssue {
  severity: "error" | "warning" | "info";
  message: string;
  fixed: boolean;
  source: "regel" | "visuell";
}

const REVIEW_PROMPT = `Du är art director på Nordea och granskar en animerad annons som en kollega (en AI) just gjort i Motion Studio. Du får stillbilder från varje scen (efter att texten tonat in), videons konfiguration och vad användaren bad om.

Leta efter TYDLIGA fel som syns i bilderna eller bryter mot Nordeas fasta ramar:
- text eller viktiga objekt som krockar med loggan överst eller ligger i den fria marginalen nertill, eller skärs av i kanten
- text som är svårläst (för liten, låg kontrast, ligger över illustrationen)
- element som överlappar varandra fel, tomma eller trasiga illustrationer, felplacerade objekt
- färger utanför paletten, turkos där den inte hör hemma, saknad fetstil på ett självklart nyckelord
- juridik som saknas (villkor, varningsband, riskrad)

Ändra INTE den kreativa idén, copyns innebörd, tonen eller sådant som är en smaksak. Rätta bara det som är fel. Hitta inga fel om det ser bra ut — det är ett bra utfall.

Svara ENBART med JSON:
{
  "issues": [ { "severity": "error" | "warning" | "info", "message": "<kort, konkret, på svenska>", "fixed": true | false } ],
  "patch": [ <JSON Patch (RFC 6902) mot konfigurationen som rättar de fel du markerat fixed: true> ]
}
Tom lista och tom patch om allt ser bra ut. Patchen ska vara minimal: rätta t.ex. rubrikens längd, illustrationHeightPercent, headlineColor, en koordinat i tsxCode (ersätt då hela "/scenes/N/tsxCode"), en scenlängd.`;

export async function POST(req: Request) {
  try {
    const { config: input, request } = RequestSchema.parse(await req.json());

    // 1. Regelkontroll + entydiga rättningar.
    const lint = lintVideoConfig(input);
    const lintFixes = lint.flatMap((i) => i.fix ?? []);
    let config: VideoConfig = stripCompiledCanvas(input);
    if (lintFixes.length > 0) config = applyPatch(config, lintFixes);
    const issues: ReviewIssue[] = lint.map((i) => ({
      severity: i.severity,
      message: i.message,
      fixed: !!i.fix,
      source: "regel",
    }));

    // 2. Förhandsbilder — koden kompileras om på servern, klientens
    //    compiledJs körs aldrig här.
    config = await compileCanvasScenes(config);
    const frames = await renderPreviewFrames(config);

    // 3. Visuell granskning.
    const client = getClaudeClient();
    let visualDone = false;
    let visualError: string | null = null;
    const ai = client && frames && frames.length > 0
      ? await visualReview(client, config, frames, request, lint.map((i) => i.message)).catch((err) => {
          // Regelkontrollen och bilderna är fortfarande användbara.
          visualError = aiErrorMessage(err, "Den visuella granskningen misslyckades");
          return null;
        })
      : null;
    if (ai) {
      visualDone = true;
      issues.push(...ai.issues.map((i) => ({ ...i, source: "visuell" as const })));
      if (ai.patch.length > 0) {
        try {
          config = await compileCanvasScenes(applyPatch(config, ai.patch));
        } catch (err) {
          console.error("[review] AI-patch kunde inte tillämpas:", err);
          for (const i of issues) if (i.source === "visuell") i.fixed = false;
        }
      }
    }

    const changed = JSON.stringify(stripCompiledCanvas(config)) !== JSON.stringify(stripCompiledCanvas(input));
    return NextResponse.json({
      issues,
      fixedConfig: changed ? config : null,
      visual: visualDone,
      visualError,
      renderer: frames ? "ok" : "saknas",
      frames: (frames ?? []).map((f) => ({ sceneIndex: f.sceneIndex, seconds: f.seconds, src: `data:image/jpeg;base64,${f.jpegBase64}` })),
    });
  } catch (error) {
    console.error("[studio:review] error:", error);
    return NextResponse.json({ error: aiErrorMessage(error, "Granskningen misslyckades") }, { status: 500 });
  }
}

async function visualReview(
  client: NonNullable<ReturnType<typeof getClaudeClient>>,
  config: VideoConfig,
  frames: PreviewFrame[],
  request: string | undefined,
  lintMessages: string[]
): Promise<{ issues: Array<Omit<ReviewIssue, "source">>; patch: PatchOp[] }> {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } }
  > = [];
  for (const f of frames) {
    content.push({ type: "text", text: `Scen ${f.sceneIndex + 1} vid ${f.seconds.toFixed(1)} s:` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: f.jpegBase64 } });
  }
  content.push({
    type: "text",
    text: [
      request ? `Användaren bad om: ${request}` : "",
      lintMessages.length ? `Regelkontrollen hittade redan (behöver inte upprepas):\n- ${lintMessages.join("\n- ")}` : "",
      `Konfiguration:\n${JSON.stringify(config, null, 2)}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    system: withVisualGrammar(withMotionCapabilities(REVIEW_PROMPT)),
    messages: [{ role: "user", content }],
  });
  const text = response.content[0]?.type === "text" ? response.content[0].text : "";
  const json = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
  try {
    const parsed = JSON.parse(json) as { issues?: Array<Omit<ReviewIssue, "source">>; patch?: PatchOp[] };
    return {
      issues: (parsed.issues ?? []).filter((i) => i && typeof i.message === "string"),
      patch: Array.isArray(parsed.patch) ? parsed.patch : [],
    };
  } catch {
    console.error("[review] kunde inte tolka svaret:", text.slice(0, 1000));
    return { issues: [], patch: [] };
  }
}
