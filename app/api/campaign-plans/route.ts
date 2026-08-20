import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/campaign-plans — list saved scenarios
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('campaign_plans')
      .select('id, name, budget, duration_days, channel_mix, audience, forecast, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json({ plans: data ?? [] });
  } catch (error) {
    console.error('[campaign-plans] list error:', error);
    return NextResponse.json({ plans: [] });
  }
}

// POST /api/campaign-plans — save a scenario
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // campaign_plans.user_id kräver en riktig auth-användare;
      // klienten faller tillbaka till lokal lagring.
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('campaign_plans')
      .insert({
        user_id: user.id,
        name: body.name || 'Namnlöst scenario',
        budget: body.budget ?? 0,
        duration_days: body.duration_days ?? null,
        channel_mix: body.channel_mix ?? [],
        audience: body.audience ?? {},
        forecast: body.forecast ?? null,
        status: 'draft',
      })
      .select('id, name, budget, duration_days, channel_mix, audience, forecast, created_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ plan: data });
  } catch (error) {
    console.error('[campaign-plans] save error:', error);
    return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 });
  }
}
