import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Single production job status (used for polling progress + zip_url)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('production_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ job: data });
  } catch (error) {
    console.error('[CreativeIQ] Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}
