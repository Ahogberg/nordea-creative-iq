import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';

// GET - List all templates
export async function GET() {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('is_favorite', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ templates: data });
  } catch (error) {
    console.error('[CreativeIQ] Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST - Create new template. Body shape matches videoConfigToTemplate output:
// { name, description, config, is_favorite }
export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;
    const body = await request.json();

    if (!body?.name || !body?.config) {
      return NextResponse.json(
        { error: 'name and config are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('templates')
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description ?? null,
        config: body.config,
        is_favorite: body.is_favorite ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('[CreativeIQ] Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
