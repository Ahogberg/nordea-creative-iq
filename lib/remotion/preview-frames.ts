// ── Förhandsbilder för självgranskningen ──
//
// Renderar en stillbild per scen (när texten tonat in) så att AI:n kan titta
// på resultatet. Samma backendval som exporten (RENDER_BACKEND):
//   local  → Chromium + bundle lokalt (dev/self-hosted)
//   lambda → renderStillOnLambda (kräver REMOTION_LAMBDA_* och @remotion/lambda-client)
//   annars eller på Vercel utan Lambda → null (granskningen blir bara regelkontroll)

import type { VideoConfig } from "./types";

const FPS = 30;
const MAX_FRAMES = 4;

export interface PreviewFrame {
  sceneIndex: number;
  seconds: number;
  /** JPEG, base64 utan data:-prefix. */
  jpegBase64: string;
}

/** Tidpunkter att granska: 65 % in i varje scen (efter intoningen), högst fyra. */
export function reviewTimestamps(config: VideoConfig): Array<{ sceneIndex: number; frame: number }> {
  let start = 0;
  const all = config.scenes.map((scene, i) => {
    const frame = Math.round((start + scene.durationSeconds * 0.65) * FPS);
    start += scene.durationSeconds;
    return { sceneIndex: i, frame };
  });
  if (all.length <= MAX_FRAMES) return all;
  // Första, andra, näst sista och sista scenen.
  return [all[0], all[1], all[all.length - 2], all[all.length - 1]];
}

export function previewBackend(): "local" | "lambda" | null {
  const backend = (process.env.RENDER_BACKEND || "local").toLowerCase();
  if (backend === "disabled") return null;
  if (backend === "lambda") return process.env.REMOTION_LAMBDA_FUNCTION_NAME && process.env.REMOTION_LAMBDA_SERVE_URL ? "lambda" : null;
  if (process.env.VERCEL) return null; // läsbart filsystem saknas, ingen Chromium
  return "local";
}

// Återanvänd webbläsaren mellan granskningar (lokalt).
let browserPromise: Promise<unknown> | null = null;

async function renderLocal(config: VideoConfig, points: Array<{ sceneIndex: number; frame: number }>): Promise<PreviewFrame[]> {
  const { getBundle } = await import("./render");
  const { renderStill, selectComposition, openBrowser, ensureBrowser } = await import("@remotion/renderer");
  await ensureBrowser();
  const serveUrl = await getBundle();
  if (!browserPromise) browserPromise = openBrowser("chrome");
  const browser = (await browserPromise) as Awaited<ReturnType<typeof openBrowser>>;

  const inputProps = { config };
  const composition = await selectComposition({ serveUrl, id: "NordeaMotion", inputProps, puppeteerInstance: browser });
  const frames: PreviewFrame[] = [];
  for (const p of points) {
    const { buffer } = await renderStill({
      composition,
      serveUrl,
      inputProps,
      frame: Math.min(p.frame, composition.durationInFrames - 1),
      imageFormat: "jpeg",
      jpegQuality: 80,
      scale: 0.5,
      puppeteerInstance: browser,
    });
    if (buffer) frames.push({ sceneIndex: p.sceneIndex, seconds: p.frame / FPS, jpegBase64: Buffer.from(buffer).toString("base64") });
  }
  return frames;
}

async function renderLambda(config: VideoConfig, points: Array<{ sceneIndex: number; frame: number }>): Promise<PreviewFrame[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lambda: any = await import(/* webpackIgnore: true */ "@remotion/lambda-client" as string);
  const frames: PreviewFrame[] = [];
  for (const p of points) {
    const res = await lambda.renderStillOnLambda({
      region: process.env.REMOTION_LAMBDA_REGION || "eu-central-1",
      functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME,
      serveUrl: process.env.REMOTION_LAMBDA_SERVE_URL,
      composition: "NordeaMotion",
      inputProps: { config },
      frame: p.frame,
      imageFormat: "jpeg",
      jpegQuality: 80,
      scale: 0.5,
      privacy: "public",
    });
    const img = await fetch(res.url);
    frames.push({ sceneIndex: p.sceneIndex, seconds: p.frame / FPS, jpegBase64: Buffer.from(await img.arrayBuffer()).toString("base64") });
  }
  return frames;
}

/** Renderar förhandsbilder, eller null om ingen renderare finns i miljön. */
export async function renderPreviewFrames(config: VideoConfig): Promise<PreviewFrame[] | null> {
  const backend = previewBackend();
  if (!backend || config.scenes.length === 0) return null;
  const points = reviewTimestamps(config);
  try {
    return backend === "lambda" ? await renderLambda(config, points) : await renderLocal(config, points);
  } catch (err) {
    console.error("[preview-frames] rendering misslyckades:", err);
    browserPromise = null;
    return null;
  }
}
