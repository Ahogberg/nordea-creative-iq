import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateTotalVideos } from '@/lib/video-types';

// GET - List production jobs
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('production_jobs')
      .select('*, templates(name)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ jobs: data });
  } catch (error) {
    console.error('[CreativeIQ] Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

// POST - Create production job
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const totalVideos = calculateTotalVideos(body.variants, body.formats);

    const { data, error } = await supabase
      .from('production_jobs')
      .insert({
        user_id: 'default-user',
        template_id: body.template_id,
        name: body.name,
        variants: body.variants,
        formats: body.formats,
        total_videos: totalVideos,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Trigger actual video rendering job here
    // For now, we'll simulate with a status update

    return NextResponse.json({ job: data, totalVideos });
  } catch (error) {
    console.error('[CreativeIQ] Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
