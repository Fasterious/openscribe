import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runClustering } from '@/lib/llm';
import { getUserApiKey } from '@/lib/user-api-keys';
import { getProviderType } from '@/lib/llm/provider-utils';
import type { LLMProvider } from '@/types/workshop';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { session_id, provider = 'gemini' } = await request.json();

  if (!session_id) {
    return NextResponse.json(
      { error: 'session_id is required' },
      { status: 400 }
    );
  }

  // Verify ownership
  const { data: session } = await supabase
    .from('workshop_sessions')
    .select('id, question, creator_id')
    .eq('id', session_id)
    .single();

  if (!session || session.creator_id !== user.id) {
    return NextResponse.json(
      { error: 'Session not found or unauthorized' },
      { status: 404 }
    );
  }

  // Fetch responses
  const admin = createAdminClient();
  const { data: responses } = await admin
    .from('workshop_responses')
    .select('id, participant_name, response_text')
    .eq('session_id', session_id)
    .order('created_at', { ascending: true });

  if (!responses || responses.length === 0) {
    return NextResponse.json(
      { error: 'No responses to analyze' },
      { status: 400 }
    );
  }

  try {
    const apiProvider = getProviderType(provider as LLMProvider);
    const apiKey = await getUserApiKey(user.id, apiProvider);
    const keys = apiProvider === 'gemini'
      ? { geminiApiKey: apiKey }
      : { mistralApiKey: apiKey };

    const result = await runClustering(provider as LLMProvider, {
      question: session.question,
      responses: responses.map((r) => ({
        id: r.id,
        participant_name: r.participant_name,
        text: r.response_text,
      })),
    }, keys);

    // Store analysis
    const { data: analysis, error } = await admin
      .from('workshop_analyses')
      .insert({
        session_id,
        model_used: provider,
        clusters: result,
      })
      .select()
      .single();

    if (error) {
      console.error('[Workshop] Failed to store analysis:', error);
      return NextResponse.json({ result });
    }

    return NextResponse.json({ analysis });
  } catch (e) {
    console.error('[Workshop] Clustering failed:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Clustering failed' },
      { status: 500 }
    );
  }
}
