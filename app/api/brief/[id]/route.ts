import { NextResponse } from "next/server";
import { requireDb } from "@/lib/supabase/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await requireDb();
    if ("response" in db) return db.response;
    const { supabase, ownerId } = db;
    const { data, error } = await supabase
      .from("creative_briefs")
      .select("*")
      .eq("id", id)
      .eq("created_by", ownerId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ brief: data });
  } catch (error) {
    console.error("[brief] get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch brief" },
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
    // Id och ägare ändras aldrig via PUT.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, created_by: _owner, created_at: _created, ...updates } = body ?? {};

    const db = await requireDb();
    if ("response" in db) return db.response;
    const { supabase, ownerId } = db;
    const { data, error } = await supabase
      .from("creative_briefs")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("created_by", ownerId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ brief: data });
  } catch (error) {
    console.error("[brief] update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update brief",
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
    const db = await requireDb();
    if ("response" in db) return db.response;
    const { supabase, ownerId } = db;
    const { error } = await supabase
      .from("creative_briefs")
      .delete()
      .eq("id", id)
      .eq("created_by", ownerId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[brief] delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete brief" },
      { status: 500 }
    );
  }
}
