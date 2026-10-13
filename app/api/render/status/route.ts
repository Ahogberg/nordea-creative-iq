import { NextResponse } from "next/server";
import { videoExportAvailability } from "@/lib/render/availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Om videoexport fungerar på den här servern — exportdialogerna frågar här först. */
export async function GET() {
  return NextResponse.json({ video: videoExportAvailability() });
}
