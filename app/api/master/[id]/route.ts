import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PutSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  master_config: z.any().optional(),
  format_overrides: z.record(z.string(), z.any()).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("master_creatives")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ master: data });
  } catch (error) {
    console.error("[master] get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch master" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = PutSchema.parse(body);

    const supabase = await createClient();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.name !== undefined) updates.name = parsed.name;
    if (parsed.master_config !== undefined)
      updates.master_config = parsed.master_config;
    if (parsed.format_overrides !== undefined)
      updates.format_overrides = parsed.format_overrides;

    const { data, error } = await supabase
      .from("master_creatives")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ master: data });
  } catch (error) {
    console.error("[master] update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update master",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { error } = await supabase
      .from("master_creatives")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[master] delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete master" },
      { status: 500 }
    );
  }
}
