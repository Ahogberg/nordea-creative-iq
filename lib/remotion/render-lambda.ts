// ── Remotion Lambda rendering backend ──
//
// Activated when RENDER_BACKEND=lambda. Requires a deployed Lambda function
// and a served bundle site. See DEPLOYMENT.md for the one-time setup:
//
//   1. npx remotion lambda functions deploy
//   2. npx remotion lambda sites create remotion/index.ts --site-name=nordea-creativeiq
//   3. Set env vars:
//        REMOTION_AWS_ACCESS_KEY_ID
//        REMOTION_AWS_SECRET_ACCESS_KEY
//        REMOTION_LAMBDA_FUNCTION_NAME
//        REMOTION_LAMBDA_SERVE_URL
//        REMOTION_LAMBDA_REGION        (default: eu-central-1)
//
// This file lazy-imports @remotion/lambda-client so the AWS SDK only gets
// bundled on builds that actually use Lambda rendering.

import type { VideoConfig } from "./types";
import type { RenderRecord, RenderResult } from "./render";

const REGION = process.env.REMOTION_LAMBDA_REGION || "eu-central-1";
const FUNCTION_NAME = process.env.REMOTION_LAMBDA_FUNCTION_NAME;
const SERVE_URL = process.env.REMOTION_LAMBDA_SERVE_URL;

export async function renderViaLambda(config: VideoConfig): Promise<RenderResult> {
  if (!FUNCTION_NAME || !SERVE_URL) {
    throw new Error(
      "Lambda-rendering är inte konfigurerad. Saknar REMOTION_LAMBDA_FUNCTION_NAME eller REMOTION_LAMBDA_SERVE_URL."
    );
  }

  // Dynamic import — @remotion/lambda-client is only needed when Lambda is
  // actually enabled. Typed loosely to avoid requiring the package during
  // non-Lambda builds.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lambdaModule: any;
  try {
    lambdaModule = await import(
      /* webpackIgnore: true */ "@remotion/lambda-client" as string
    );
  } catch {
    throw new Error(
      "Paketet @remotion/lambda-client är inte installerat. Kör: npm install @remotion/lambda-client"
    );
  }
  const { renderMediaOnLambda, getRenderProgress } = lambdaModule;

  const { renderId, bucketName } = await renderMediaOnLambda({
    region: REGION,
    functionName: FUNCTION_NAME,
    serveUrl: SERVE_URL,
    composition: "NordeaMotion",
    inputProps: { config },
    codec: "h264",
    imageFormat: "jpeg",
    maxRetries: 1,
    privacy: "public",
  });

  // Poll until the render finishes. With 4K/30 this typically takes 30-90s.
  let attempts = 0;
  const maxAttempts = 180; // ~6 min at 2s interval
  while (attempts < maxAttempts) {
    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName: FUNCTION_NAME,
      region: REGION,
    });
    if (progress.done) {
      const mp4Url = progress.outputFile ?? "";
      const record: RenderRecord = {
        id: renderId,
        title: config.title || "Namnlös",
        format: config.format,
        durationSeconds: config.totalDurationSeconds,
        fileName: `${renderId}.mp4`,
        fileSize: progress.outputSizeInBytes ?? 0,
        createdAt: new Date().toISOString(),
        mp4Url,
      };
      return { record, mp4Path: mp4Url };
    }
    if (progress.fatalErrorEncountered) {
      throw new Error(
        `Lambda-rendering misslyckades: ${progress.errors?.[0]?.message || "okänt fel"}`
      );
    }
    await new Promise((r) => setTimeout(r, 2000));
    attempts++;
  }
  throw new Error("Lambda-rendering timeout (över 6 min).");
}
