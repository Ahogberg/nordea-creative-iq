import { NextResponse } from "next/server";
import { getProviderStatus } from "@/lib/ai/providers/provider-router";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getProviderStatus());
}
