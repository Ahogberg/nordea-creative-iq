import { NextRequest, NextResponse } from "next/server";
import { renderVideoConfig } from "@/lib/remotion/render";
import type { VideoConfig } from "@/lib/remotion/types";

export const runtime = "nodejs";
// Rendering Chromium + encoding MP4 takes time — be generous.
export const maxDuration = 300;

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

    const startedAt = Date.now();
    const { record } = await renderVideoConfig(config);
    const elapsedMs = Date.now() - startedAt;

    return NextResponse.json({ record, elapsedMs });
  } catch (error) {
    console.error("Motion render error:", error);
    const message = error instanceof Error ? error.message : "Renderingsfel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
