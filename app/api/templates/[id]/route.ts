import { NextResponse } from 'next/server';
import { requireDb } from '@/lib/supabase/db';

// Mallbiblioteket delas: alla inloggade läser, bara ägaren ändrar och tar bort.

// GET - Get single template
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await requireDb();
    if ('response' in db) return db.response;

    const { data, error } = await db.supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('[CreativeIQ] Error fetching template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PATCH - Update template
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await requireDb();
    if ('response' in db) return db.response;
    // Id och ägare ändras aldrig via PATCH.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, user_id: _owner, created_at: _created, ...updates } = (await request.json()) ?? {};

    const { data, error } = await db.supabase
      .from('templates')
      .update(updates)
      .eq('id', id)
      .eq('user_id', db.ownerId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('[CreativeIQ] Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE - Delete template
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await requireDb();
    if ('response' in db) return db.response;

    const { error } = await db.supabase
      .from('templates')
      .delete()
      .eq('id', id)
      .eq('user_id', db.ownerId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CreativeIQ] Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
