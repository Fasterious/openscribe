import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('csv_analysis_sessions')
    .select('id, filename, status, current_step, model_used, created_at, updated_at')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { filename, parsed_data, model } = await request.json();

  if (!filename || !parsed_data) {
    return NextResponse.json(
      { error: 'filename and parsed_data are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('csv_analysis_sessions')
    .insert({
      creator_id: user.id,
      filename: filename.trim(),
      status: 'parsing',
      current_step: 1,
      model_used: model || 'gemini',
      step_1_parsed: parsed_data,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data }, { status: 201 });
}
