import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List all templates
export async function GET() {
  try {
    const supabase = await createClient();

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

// POST - Create new template
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('templates')
      .insert({
        user_id: 'default-user',
        name: body.name,
        description: body.description,
        duration_frames: body.duration_frames,
        fps: body.fps,
        background: body.background,
        logo: body.logo,
        text_structure: body.text_structure,
        default_texts: body.default_texts,
        formats: body.formats,
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
