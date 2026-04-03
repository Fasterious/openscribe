import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLLMClient } from '@/lib/llm';
import { getUserApiKey } from '@/lib/user-api-keys';
import { getProviderType } from '@/lib/llm/provider-utils';
import { buildExtractionPrompt } from '@/lib/llm/csv-prompts';
import type { LLMProvider } from '@/types/workshop';
import type { ParsedCsvData, Quintuplet } from '@/types/csv-analysis';
import { interpretLlmFailure } from '@/lib/llm/user-facing-error';

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

  const { session_id, selected_questions } = await request.json();

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

  const parsed: ParsedCsvData = session.step_1_parsed;
  if (!parsed || !parsed.participants?.length) {
    return NextResponse.json(
      { error: 'No parsed data available' },
      { status: 400 }
    );
  }

  const questionsToAnalyze: string[] =
    Array.isArray(selected_questions) && selected_questions.length > 0
      ? selected_questions
      : parsed.questions;

  // Persist the selection
  const updatedParsed = { ...parsed, selected_questions: questionsToAnalyze };
  await admin
    .from('csv_analysis_sessions')
    .update({
      status: 'extracting',
      current_step: 2,
      step_1_parsed: updatedParsed,
    })
    .eq('id', session_id);

  try {
    const apiProvider = getProviderType(session.model_used as LLMProvider);
    const apiKey = await getUserApiKey(user.id, apiProvider);
    const keys = apiProvider === 'gemini'
      ? { geminiApiKey: apiKey }
      : { mistralApiKey: apiKey };
    const client = getLLMClient(session.model_used as LLMProvider, keys);
    const allQuintuplets: Quintuplet[] = [];
    let globalIdx = 0;

    for (const participant of parsed.participants) {
      const hasResponses = questionsToAnalyze.some(
        (q) => participant.responses[q]?.trim()
      );
      if (!hasResponses) continue;

      const prompt = buildExtractionPrompt(participant, questionsToAnalyze);
      const raw = await client.analyze(prompt);
      const json = extractJSON(raw);

      try {
        const parsed = JSON.parse(json);

        // Mistral json_object mode may wrap the array in an object like { "quintuplets": [...] }
        let extracted: unknown[];
        if (Array.isArray(parsed)) {
          extracted = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
          const arrayValue = Object.values(parsed).find(Array.isArray);
          if (arrayValue) {
            extracted = arrayValue as unknown[];
          } else {
            console.warn(
              `[CSV Extract] ${participant.id}: response is an object with no array value, skipping. Keys: ${Object.keys(parsed).join(', ')}`
            );
            continue;
          }
        } else {
          console.warn(
            `[CSV Extract] ${participant.id}: unexpected response type: ${typeof parsed}`
          );
          continue;
        }

        let extractedCount = 0;
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
            question: entry.question ? String(entry.question).trim() : '',
            participant_id: participant.id,
            participant_name: participant.name || '',
          });
          globalIdx++;
          extractedCount++;
        }
        console.log(
          `[CSV Extract] ${participant.id}: ${extractedCount} quintuplets extracted`
        );
      } catch (parseErr) {
        console.error(
          `[CSV Extract] Failed to parse response for ${participant.id}:`,
          parseErr,
          '\nRaw response:',
          json.slice(0, 500)
        );
      }
    }

    await admin
      .from('csv_analysis_sessions')
      .update({
        step_2_quintuplets: allQuintuplets,
        status: 'extracting',
        current_step: 2,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    return NextResponse.json({
      quintuplets: allQuintuplets,
      count: allQuintuplets.length,
    });
  } catch (e) {
    console.error('[CSV Extract] Failed:', e);
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
