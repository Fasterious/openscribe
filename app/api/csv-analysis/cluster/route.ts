import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLLMClient } from '@/lib/llm';
import { getUserApiKey } from '@/lib/user-api-keys';
import { getProviderType } from '@/lib/llm/provider-utils';
import { buildClusteringPrompt } from '@/lib/llm/csv-prompts';
import type { LLMProvider } from '@/types/workshop';
import type { Quintuplet, AnalysisCluster } from '@/types/csv-analysis';
import { interpretLlmFailure } from '@/lib/llm/user-facing-error';

export const maxDuration = 120;

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { session_id } = await request.json();

  if (!session_id) {
    return NextResponse.json(
      { error: 'session_id is required' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: session } = await admin
    .from('csv_analysis_sessions')
    .select('*')
    .eq('id', session_id)
    .single();

  if (!session || session.creator_id !== user.id) {
    return NextResponse.json(
      { error: 'Session not found or unauthorized' },
      { status: 404 }
    );
  }

  const quintuplets: Quintuplet[] = session.step_2_quintuplets;
  if (!quintuplets?.length) {
    return NextResponse.json(
      { error: 'No quintuplets available. Run extraction first.' },
      { status: 400 }
    );
  }

  await admin
    .from('csv_analysis_sessions')
    .update({ status: 'clustering', current_step: 3 })
    .eq('id', session_id);

  try {
    const apiProvider = getProviderType(session.model_used as LLMProvider);
    const apiKey = await getUserApiKey(user.id, apiProvider);
    const keys = apiProvider === 'gemini'
      ? { geminiApiKey: apiKey }
      : { mistralApiKey: apiKey };
    const client = getLLMClient(session.model_used as LLMProvider, keys);
    const prompt = buildClusteringPrompt(quintuplets);
    const raw = await client.analyze(prompt);
    const json = extractJSON(raw);
    const result = JSON.parse(json);

    if (!result.clusters || !Array.isArray(result.clusters)) {
      throw new Error('Invalid clustering response: missing clusters array');
    }

    const clusters: AnalysisCluster[] = result.clusters.map(
      (c: { title: string; normalized_tags: { label: string; original_tags: string[]; quintuplet_indices: number[] }[] }) => {
        const normalizedTags = c.normalized_tags.map((nt) => {
          const tagQuintuplets = (nt.quintuplet_indices || [])
            .filter((i: number) => i >= 0 && i < quintuplets.length)
            .map((i: number) => quintuplets[i]);

          const uniqueParticipants = [
            ...new Set(tagQuintuplets.map((q) => q.participant_id)),
          ];

          return {
            label: nt.label,
            original_tags: nt.original_tags || [],
            quintuplets: tagQuintuplets,
            positive_count: tagQuintuplets.filter((q) => q.sentiment === 'positive').length,
            negative_count: tagQuintuplets.filter((q) => q.sentiment === 'negative').length,
            suggestion_count: tagQuintuplets.filter((q) => q.sentiment === 'suggestion').length,
            unique_participants: uniqueParticipants,
            summary: '',
          };
        });

        const allClusterQuintuplets = normalizedTags.flatMap((nt) => nt.quintuplets);
        const clusterParticipants = [
          ...new Set(allClusterQuintuplets.map((q) => q.participant_id)),
        ];

        return {
          title: c.title,
          normalized_tags: normalizedTags,
          total_positive: normalizedTags.reduce((sum, nt) => sum + nt.positive_count, 0),
          total_negative: normalizedTags.reduce((sum, nt) => sum + nt.negative_count, 0),
          total_suggestion: normalizedTags.reduce((sum, nt) => sum + nt.suggestion_count, 0),
          unique_participants: clusterParticipants,
          summary: '',
        };
      }
    );

    await admin
      .from('csv_analysis_sessions')
      .update({
        step_3_clusters: clusters,
        status: 'clustering',
        current_step: 3,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    return NextResponse.json({ clusters });
  } catch (e) {
    console.error('[CSV Cluster] Failed:', e);
    const { message, status } = interpretLlmFailure(e);
    await admin
      .from('csv_analysis_sessions')
      .update({
        status: 'error',
        error_message: message,
      })
      .eq('id', session_id);

    return NextResponse.json({ error: message }, { status });
  }
}
