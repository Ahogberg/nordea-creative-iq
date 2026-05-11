import { NextRequest, NextResponse } from "next/server";
import type { VideoConfig } from "@/lib/remotion/types";

export const runtime = "nodejs";
// Rendering Chromium + encoding MP4 takes time — be generous.
export const maxDuration = 300;

// Rendering backend selection:
//   - RENDER_BACKEND=local   → use Chromium + local disk (self-hosted/dev only)
//   - RENDER_BACKEND=lambda  → use Remotion Lambda (AWS; requires deploy + env)
//   - RENDER_BACKEND=disabled or unset on Vercel → return 501 with instructions
//
// On Vercel the read-only filesystem means local rendering cannot work; set
// RENDER_BACKEND=lambda and the AWS vars (see DEPLOYMENT.md) to enable it.
const RENDER_BACKEND = (process.env.RENDER_BACKEND || "local").toLowerCase();
const IS_VERCEL = !!process.env.VERCEL;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config = body.config as VideoConfig;

    if (!config || !Array.isArray(config.scenes) || config.scenes.length === 0) {
      return NextResponse.json(
        { error: "Ogiltig video-konfiguration" },
        { status: 400 }
      );
    }

    // On Vercel, local rendering cannot work (read-only FS + no Chromium).
    // Gate behind explicit backend selection so deploys don't crash at import.
    if (IS_VERCEL && RENDER_BACKEND === "local") {
      return NextResponse.json(
        {
          error:
            "Rendering är inte konfigurerad för detta miljö. Sätt RENDER_BACKEND=lambda och AWS-env-variabler, se DEPLOYMENT.md.",
        },
        { status: 501 }
      );
    }

    if (RENDER_BACKEND === "disabled") {
      return NextResponse.json(
        {
          error:
            "Rendering är avaktiverad (RENDER_BACKEND=disabled). Förhandsvisningen är tillgänglig men ingen MP4 kan exporteras här.",
        },
        { status: 501 }
      );
    }

    if (RENDER_BACKEND === "lambda") {
      // Lambda path is dynamically imported so the AWS SDK isn't bundled into
      // non-Lambda builds. See lib/remotion/render-lambda.ts for setup.
      const { renderViaLambda } = await import("@/lib/remotion/render-lambda");
      const startedAt = Date.now();
      const { record } = await renderViaLambda(config);
      return NextResponse.json({ record, elapsedMs: Date.now() - startedAt });
    }

    // Default: local Chromium rendering (self-hosted / dev).
    const { renderVideoConfig } = await import("@/lib/remotion/render");
    const startedAt = Date.now();
    const { record } = await renderVideoConfig(config);
    return NextResponse.json({ record, elapsedMs: Date.now() - startedAt });
  } catch (error) {
    console.error("Motion render error:", error);
    const message = error instanceof Error ? error.message : "Renderingsfel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
