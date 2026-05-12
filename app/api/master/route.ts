import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const FORMAT = z.enum(["story", "feed", "landscape", "vertical"]);

const PostSchema = z.object({
  name: z.string().min(1).max(200),
  source_format: FORMAT,
  master_config: z.any(),
  format_overrides: z.record(z.string(), z.any()).optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("master_creatives")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ masters: data ?? [] });
  } catch (error) {
    console.error("[master] list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch masters" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = PostSchema.parse(body);

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("master_creatives")
      .insert({
        name: parsed.name,
        source_format: parsed.source_format,
        master_config: parsed.master_config,
        format_overrides: parsed.format_overrides ?? {},
        created_by: "default-user",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ master: data });
  } catch (error) {
    console.error("[master] create error:", error);
    return NextResponse.json(
      {
        error: "Failed to create master",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
