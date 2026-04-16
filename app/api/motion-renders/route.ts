import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { listRenders, RENDERS_DIR } from "@/lib/remotion/render";

export const runtime = "nodejs";

export async function GET() {
  try {
    const records = await listRenders();
    return NextResponse.json({ records });
  } catch (error) {
    console.error("List renders error:", error);
    return NextResponse.json({ records: [] });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: "Ogiltigt id" }, { status: 400 });
    }

    const mp4 = path.join(RENDERS_DIR, `${id}.mp4`);
    const meta = path.join(RENDERS_DIR, `${id}.json`);
    await Promise.allSettled([fs.unlink(mp4), fs.unlink(meta)]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete render error:", error);
    return NextResponse.json({ error: "Kunde inte ta bort" }, { status: 500 });
  }
}
