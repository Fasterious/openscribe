import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { session_id, participant_name, participant_token, response_text } = body;

  if (!session_id || !participant_name || !response_text) {
    return NextResponse.json(
      { error: 'session_id, participant_name, and response_text are required' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Check session exists and is active
  const { data: session } = await supabase
    .from('workshop_sessions')
    .select('id, status')
    .eq('id', session_id)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.status === 'closed') {
    return NextResponse.json(
      { error: 'Session is closed' },
      { status: 403 }
    );
  }

  // If participant_token provided, try to update existing response
  if (participant_token) {
    const { data: existing } = await supabase
      .from('workshop_responses')
      .select('id')
      .eq('session_id', session_id)
      .eq('participant_token', participant_token)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('workshop_responses')
        .update({
          response_text: response_text.trim(),
          participant_name: participant_name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ response: data });
    }
  }

  // Create new response
  const token = participant_token || crypto.randomUUID();
  const { data, error } = await supabase
    .from('workshop_responses')
    .insert({
      session_id,
      participant_name: participant_name.trim(),
      participant_token: token,
      response_text: response_text.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ response: data, participant_token: token }, { status: 201 });
}
