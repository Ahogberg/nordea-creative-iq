import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PostSchema = z.object({
  source: z.enum(["wizard", "upload", "manual"]),
  title: z.string().min(1).max(200),
  problem: z.string().optional(),
  audience_description: z.string().optional(),
  audience_personas: z.array(z.string()).optional(),
  current_perception: z.string().optional(),
  desired_action: z.string().optional(),
  key_message: z.string().optional(),
  unique_value: z.string().optional(),
  insight: z.string().optional(),
  tension: z.string().optional(),
  big_idea: z.string().optional(),
  key_messages: z.any().optional(),
  value_props: z.any().optional(),
  tone_of_voice: z.string().optional(),
  recommended_formats: z.array(z.string()).optional(),
  recommended_channels: z.array(z.string()).optional(),
  recommended_kpis: z.any().optional(),
  wizard_state: z.any().optional(),
  status: z.enum(["draft", "approved", "used"]).optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("creative_briefs")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ briefs: data ?? [] });
  } catch (error) {
    console.error("[brief] list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch briefs" },
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
      .from("creative_briefs")
      .insert({
        ...parsed,
        created_by: "default-user",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ brief: data });
  } catch (error) {
    console.error("[brief] create error:", error);
    return NextResponse.json(
      {
        error: "Failed to create brief",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
