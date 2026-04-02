import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { session_id, responses } = body as {
    session_id: string;
    responses: { participant_name: string; response_text: string }[];
  };

  if (!session_id || !Array.isArray(responses) || responses.length === 0) {
    return NextResponse.json(
      { error: 'session_id and non-empty responses array are required' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify session exists and user is creator
  const { data: session } = await admin
    .from('workshop_sessions')
    .select('id, status, creator_id')
    .eq('id', session_id)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.creator_id !== user.id) {
    return NextResponse.json(
      { error: 'Unauthorized: you are not the session creator' },
      { status: 403 }
    );
  }

  if (session.status === 'closed') {
    return NextResponse.json(
      { error: 'Session is closed, cannot import' },
      { status: 403 }
    );
  }

  const rows = responses
    .filter(
      (r) =>
        r &&
        typeof r.participant_name === 'string' &&
        typeof r.response_text === 'string' &&
        r.participant_name.trim() &&
        r.response_text.trim()
    )
    .map((r) => ({
      session_id,
      participant_name: r.participant_name.trim(),
      participant_token: crypto.randomUUID(),
      response_text: r.response_text.trim(),
    }));

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'No valid responses to import' },
      { status: 400 }
    );
  }

  const { data, error } = await admin
    .from('workshop_responses')
    .insert(rows)
    .select('id, participant_name, response_text, created_at');

  if (error) {
    console.error('[Workshop] Batch import failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    imported: data?.length ?? 0,
    responses: data,
  });
}
