import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { parseDisplaySet } from "@/lib/display/schema";
import { renderDisplaySet, DisplayRenderUnavailable } from "@/lib/display/render";

// Renderar displaypaketet till bilder och returnerar dem som data-URL:er med
// vikt, maxvikt och regelkontroll per format.

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { set?: unknown; formats?: string[] } | null;
    const set = parseDisplaySet(body?.set);
    const banners = await renderDisplaySet(set, body?.formats);
    return NextResponse.json({
      banners: banners.map((b) => ({
        formatId: b.formatId,
        fileName: b.fileName,
        mime: b.mime,
        bytes: b.bytes,
        maxKb: b.spec.maxKb,
        withinLimit: b.withinLimit,
        issues: b.issues,
        src: `data:${b.mime};base64,${b.buffer.toString("base64")}`,
      })),
    });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Ogiltigt displaypaket" }, { status: 400 });
    if (error instanceof DisplayRenderUnavailable) return NextResponse.json({ error: error.message }, { status: 503 });
    console.error("[display:render] error:", error);
    return NextResponse.json({ error: "Kunde inte rendera displaybanners" }, { status: 500 });
  }
}
