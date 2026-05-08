import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateTotalVideos } from '@/lib/video-types';
import { doProduction } from '@/lib/production/worker';

// Producer-worker kicks Chromium for every video — the request returns as
// soon as the row is inserted, but the worker keeps running in-process.
export const runtime = 'nodejs';
export const maxDuration = 60;

// GET - List recent production jobs
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

// POST - Create production job and kick off the worker. Returns the job row
// immediately; clients poll /api/production/[id] for status + zip_url.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body?.template_id) {
      return NextResponse.json(
        { error: 'template_id is required' },
        { status: 400 }
      );
    }

    const totalVideos = calculateTotalVideos(body.variants, body.formats);

    const { data: job, error } = await supabase
      .from('production_jobs')
      .insert({
        user_id: 'default-user',
        template_id: body.template_id,
        name: body.name || `Production ${new Date().toISOString()}`,
        variants: body.variants,
        formats: body.formats,
        total_videos: totalVideos,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Fire-and-forget: worker runs after the response is sent. setImmediate
    // detaches the promise from the request lifetime so the response isn't
    // held open while the renders complete.
    setImmediate(() => {
      doProduction(job.id).catch((err) => {
        console.error('[producer] uncaught worker error:', err);
      });
    });

    return NextResponse.json({ job, totalVideos }, { status: 202 });
  } catch (error) {
    console.error('[CreativeIQ] Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
