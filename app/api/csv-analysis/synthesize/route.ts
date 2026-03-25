import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLLMClient } from '@/lib/llm';
import { buildSynthesisPrompt } from '@/lib/llm/csv-prompts';
import type { LLMProvider } from '@/types/workshop';
import type { AnalysisCluster, FinalAnalysis } from '@/types/csv-analysis';

export const maxDuration = 300;

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

  const clusters: AnalysisCluster[] = session.step_3_clusters;
  if (!clusters?.length) {
    return NextResponse.json(
      { error: 'No clusters available. Run clustering first.' },
      { status: 400 }
    );
  }

  await admin
    .from('csv_analysis_sessions')
    .update({ status: 'synthesizing', current_step: 4 })
    .eq('id', session_id);

  try {
    const client = getLLMClient(session.model_used as LLMProvider);
    const synthesizedClusters: AnalysisCluster[] = [];

    for (const cluster of clusters) {
      const prompt = buildSynthesisPrompt(cluster);
      const raw = await client.analyze(prompt);
      const json = extractJSON(raw);

      try {
        const synthesis = JSON.parse(json);
        const updatedTags = cluster.normalized_tags.map((tag) => ({
          ...tag,
          summary: synthesis.tag_summaries?.[tag.label] || '',
        }));

        synthesizedClusters.push({
          ...cluster,
          normalized_tags: updatedTags,
          summary: synthesis.cluster_summary || '',
        });
      } catch (parseErr) {
        console.error(
          `[CSV Synthesize] Failed to parse for cluster "${cluster.title}":`,
          parseErr
        );
        synthesizedClusters.push(cluster);
      }
    }

    const allParticipants = new Set(
      synthesizedClusters.flatMap((c) => c.unique_participants)
    );
    const totalQuintuplets = synthesizedClusters.reduce(
      (sum, c) =>
        sum +
        c.normalized_tags.reduce(
          (s, nt) => s + nt.quintuplets.length,
          0
        ),
      0
    );

    const globalSummaryParts = synthesizedClusters
      .map((c) => `${c.title} : ${c.summary}`)
      .join('\n');

    const globalPrompt = `Tu es un expert en analyse qualitative. Rédige un résumé exécutif global (4-6 phrases) basé sur ces synthèses de clusters :

${globalSummaryParts}

Total : ${totalQuintuplets} verbatims analysés, ${allParticipants.size} participants, ${synthesizedClusters.length} grands thèmes.

Réponds UNIQUEMENT avec le texte du résumé, sans JSON ni balises.`;

    const globalSummary = await client.analyze(globalPrompt);

    const finalAnalysis: FinalAnalysis = {
      clusters: synthesizedClusters,
      global_summary: globalSummary.trim(),
      total_quintuplets: totalQuintuplets,
      total_participants: allParticipants.size,
      total_clusters: synthesizedClusters.length,
    };

    await admin
      .from('csv_analysis_sessions')
      .update({
        step_3_clusters: synthesizedClusters,
        step_5_final: finalAnalysis,
        status: 'complete',
        current_step: 5,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    return NextResponse.json({ analysis: finalAnalysis });
  } catch (e) {
    console.error('[CSV Synthesize] Failed:', e);
    await admin
      .from('csv_analysis_sessions')
      .update({
        status: 'error',
        error_message: e instanceof Error ? e.message : 'Synthesis failed',
      })
      .eq('id', session_id);

    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Synthesis failed' },
      { status: 500 }
    );
  }
}
