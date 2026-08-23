import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from('workshop_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const { data: responses } = await supabase
    .from('workshop_responses')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: true });

  const { data: analyses } = await supabase
    .from('workshop_analyses')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: false })
    .limit(1);

  return NextResponse.json({
    session,
    responses: responses ?? [],
    analysis: analyses?.[0] ?? null,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: session } = await supabase
    .from('workshop_sessions')
    .select('id, creator_id')
    .eq('id', id)
    .single();

  if (!session || session.creator_id !== user.id) {
    return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
  }

  const { error } = await supabase
    .from('workshop_sessions')
    .delete()
    .eq('id', id)
    .eq('creator_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Liste blanche : `.eq('creator_id', ...)` contraint le WHERE, pas le SET.
  // Passer le body brut à .update() laisserait un créateur réécrire creator_id
  // et transférer sa session à un tiers.
  const body = await request.json().catch(() => null);
  const patch: { status?: 'active' | 'closed' } = {};
  if (body?.status === 'active' || body?.status === 'closed') {
    patch.status = body.status;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: 'No updatable field provided' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('workshop_sessions')
    .update(patch)
    .eq('id', id)
    .eq('creator_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}
