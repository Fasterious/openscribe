import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLLMClient } from '@/lib/llm';
import { getUserApiKey } from '@/lib/user-api-keys';
import { getProviderType } from '@/lib/llm/provider-utils';
import {
  buildWorkshopExtractionPrompt,
  buildClusteringPrompt,
  buildSynthesisPrompt,
} from '@/lib/llm/workshop-prompts';
import type { LLMProvider } from '@/types/workshop';
import type { Quintuplet, AnalysisCluster } from '@/types/csv-analysis';
import type { Cluster, ClusterExcerpt, AnalysisResult } from '@/types/workshop';
import { interpretLlmFailure } from '@/lib/llm/user-facing-error';

export const maxDuration = 300;

const EXTRACTION_BATCH_SIZE = 15;

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

function extractPlainText(text: string): string {
  let cleaned = text.trim();
  const fenced = cleaned.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  if (fenced) cleaned = fenced[1].trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null) {
      const values = Object.values(parsed).filter((v) => typeof v === 'string');
      if (values.length > 0) return (values as string[]).join('\n\n');
    }
    if (typeof parsed === 'string') return parsed;
  } catch {
    // Not JSON — return as-is
  }
  return cleaned;
}

/**
 * Convert rich AnalysisCluster[] (CSV-style) to workshop Cluster[] + AnalysisResult
 * for backward-compatible UI rendering.
 */
function toWorkshopResult(
  analysisClusters: AnalysisCluster[],
  globalSummary: string,
  totalResponses: number
): AnalysisResult {
  const allParticipants = new Set<string>();

  const clusters: Cluster[] = analysisClusters.map((ac) => {
    const excerptsPros: ClusterExcerpt[] = [];
    const excerptsCons: ClusterExcerpt[] = [];

    for (const nt of ac.normalized_tags) {
      for (const q of nt.quintuplets) {
        allParticipants.add(q.participant_id);
        const excerpt: ClusterExcerpt = {
          participant_name: q.participant_name || q.participant_id,
          response_id: q.participant_id,
          excerpt: q.verbatim,
        };
        if (q.sentiment === 'positive') {
          excerptsPros.push(excerpt);
        } else {
          excerptsCons.push(excerpt);
        }
      }
    }

    return {
      label: ac.title,
      summary: ac.summary,
      participant_count: ac.unique_participants.length,
      excerpts_pros: excerptsPros,
      excerpts_cons: excerptsCons,
    };
  });

  return {
    clusters,
    global_summary: globalSummary,
    total_responses: totalResponses,
    total_participants: allParticipants.size,
  };
}

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
    const client = getLLMClient(provider as LLMProvider, keys);

    // ──────────── STEP 1: Extraction atomique ────────────
    const allQuintuplets: Quintuplet[] = [];
    let globalIdx = 0;

    const batches: typeof responses[] = [];
    for (let i = 0; i < responses.length; i += EXTRACTION_BATCH_SIZE) {
      batches.push(responses.slice(i, i + EXTRACTION_BATCH_SIZE));
    }

    for (const batch of batches) {
      const prompt = buildWorkshopExtractionPrompt(
        session.question,
        batch.map((r) => ({
          id: r.id,
          participant_name: r.participant_name,
          text: r.response_text,
        }))
      );

      const raw = await client.analyze(prompt);
      const json = extractJSON(raw);

      try {
        const parsed = JSON.parse(json);
        let extracted: unknown[];
        if (Array.isArray(parsed)) {
          extracted = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
          const arrayValue = Object.values(parsed).find(Array.isArray);
          extracted = arrayValue ? (arrayValue as unknown[]) : [];
        } else {
          continue;
        }

        for (const item of extracted) {
          if (!item || typeof item !== 'object') continue;
          const entry = item as Record<string, unknown>;
          if (!entry.tag || !entry.verbatim || !entry.sentiment) continue;

          allQuintuplets.push({
            id: `Q${String(globalIdx).padStart(4, '0')}`,
            tag: String(entry.tag).trim(),
            verbatim: String(entry.verbatim).trim(),
            sentiment: ['positive', 'negative', 'suggestion'].includes(String(entry.sentiment))
              ? (String(entry.sentiment) as 'positive' | 'negative' | 'suggestion')
              : 'suggestion',
            question: session.question,
            participant_id: entry.participant_id ? String(entry.participant_id).trim() : '',
            participant_name: entry.participant_name ? String(entry.participant_name).trim() : '',
          });
          globalIdx++;
        }
      } catch (parseErr) {
        console.error('[Workshop Extract] Failed to parse batch:', parseErr);
      }
    }

    if (allQuintuplets.length === 0) {
      return NextResponse.json(
        { error: 'Extraction produced no results' },
        { status: 500 }
      );
    }

    console.log(`[Workshop] Extraction: ${allQuintuplets.length} quintuplets from ${responses.length} responses`);

    // ──────────── STEP 2: Normalisation & Clustering ────────────
    const clusteringPrompt = buildClusteringPrompt(allQuintuplets);
    const clusteringRaw = await client.analyze(clusteringPrompt);
    const clusteringJson = extractJSON(clusteringRaw);
    const clusteringResult = JSON.parse(clusteringJson);

    if (!clusteringResult.clusters || !Array.isArray(clusteringResult.clusters)) {
      throw new Error('Invalid clustering response: missing clusters array');
    }

    const analysisClusters: AnalysisCluster[] = clusteringResult.clusters.map(
      (c: { title: string; normalized_tags: { label: string; original_tags: string[]; quintuplet_indices: number[] }[] }) => {
        const normalizedTags = c.normalized_tags.map((nt) => {
          const tagQuintuplets = (nt.quintuplet_indices || [])
            .filter((i: number) => i >= 0 && i < allQuintuplets.length)
            .map((i: number) => allQuintuplets[i]);

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

    console.log(`[Workshop] Clustering: ${analysisClusters.length} clusters`);

    // ──────────── STEP 3: Synthèse ────────────
    const synthesizedClusters: AnalysisCluster[] = [];

    for (const cluster of analysisClusters) {
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
        console.error(`[Workshop Synthesize] Failed for cluster "${cluster.title}":`, parseErr);
        synthesizedClusters.push(cluster);
      }
    }

    // Global executive summary
    const totalQuintuplets = synthesizedClusters.reduce(
      (sum, c) => sum + c.normalized_tags.reduce((s, nt) => s + nt.quintuplets.length, 0),
      0
    );
    const allParticipants = new Set(synthesizedClusters.flatMap((c) => c.unique_participants));

    const globalSummaryParts = synthesizedClusters
      .map((c) => `${c.title} : ${c.summary}`)
      .join('\n');

    const globalPrompt = `Tu es un expert en analyse qualitative. Rédige un résumé exécutif global (4-6 phrases) basé sur ces synthèses de clusters issus de réponses à la question "${session.question}" :

${globalSummaryParts}

Total : ${totalQuintuplets} verbatims analysés, ${allParticipants.size} participants, ${synthesizedClusters.length} grands thèmes.

Réponds UNIQUEMENT avec le texte du résumé, sans JSON ni balises.`;

    const globalSummaryRaw = await client.analyze(globalPrompt);
    const globalSummary = extractPlainText(globalSummaryRaw);

    console.log(`[Workshop] Synthesis complete: ${synthesizedClusters.length} clusters, ${totalQuintuplets} quintuplets`);

    // ──────────── Convert to workshop format & store ────────────
    const workshopResult = toWorkshopResult(synthesizedClusters, globalSummary, responses.length);

    const { data: analysis, error } = await admin
      .from('workshop_analyses')
      .insert({
        session_id,
        model_used: provider,
        clusters: workshopResult,
      })
      .select()
      .single();

    if (error) {
      console.error('[Workshop] Failed to store analysis:', error);
      return NextResponse.json({ result: workshopResult });
    }

    return NextResponse.json({ analysis });
  } catch (e) {
    console.error('[Workshop] Analysis pipeline failed:', e);
    const { message, status } = interpretLlmFailure(e);
    return NextResponse.json({ error: message }, { status });
  }
}
