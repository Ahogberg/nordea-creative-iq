import { NextResponse } from 'next/server';
import { requireDb } from "@/lib/supabase/db";

// GET - Single production job status (used for polling progress + zip_url)
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
      .from('production_jobs')
      .select('*')
      .eq("id", id)
      .eq("user_id", ownerId)
      .single();

    if (error) throw error;

    return NextResponse.json({ job: data });
  } catch (error) {
    console.error('[CreativeIQ] Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}
