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

  const body = await request.json();

  const { data, error } = await supabase
    .from('workshop_sessions')
    .update(body)
    .eq('id', id)
    .eq('creator_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}
