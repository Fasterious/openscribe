import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLLMClient } from '@/lib/llm';
import { buildExtractionPrompt } from '@/lib/llm/csv-prompts';
import type { LLMProvider } from '@/types/workshop';
import type { ParsedCsvData, Quintuplet } from '@/types/csv-analysis';

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

  const parsed: ParsedCsvData = session.step_1_parsed;
  if (!parsed || !parsed.participants?.length) {
    return NextResponse.json(
      { error: 'No parsed data available' },
      { status: 400 }
    );
  }

  await admin
    .from('csv_analysis_sessions')
    .update({ status: 'extracting', current_step: 2 })
    .eq('id', session_id);

  try {
    const client = getLLMClient(session.model_used as LLMProvider);
    const allQuintuplets: Quintuplet[] = [];
    let globalIdx = 0;

    for (const participant of parsed.participants) {
      const hasResponses = parsed.questions.some(
        (q) => participant.responses[q]?.trim()
      );
      if (!hasResponses) continue;

      const prompt = buildExtractionPrompt(participant, parsed.questions);
      const raw = await client.analyze(prompt);
      const json = extractJSON(raw);

      try {
        const extracted = JSON.parse(json);
        if (!Array.isArray(extracted)) continue;

        for (const item of extracted) {
          if (!item.tag || !item.verbatim || !item.sentiment) continue;

          allQuintuplets.push({
            id: `Q${String(globalIdx).padStart(4, '0')}`,
            tag: item.tag.trim(),
            verbatim: item.verbatim.trim(),
            sentiment: ['positive', 'negative', 'suggestion'].includes(item.sentiment)
              ? item.sentiment
              : 'suggestion',
            question: item.question?.trim() || '',
            participant_id: participant.id,
            participant_name: participant.name || '',
          });
          globalIdx++;
        }
      } catch (parseErr) {
        console.error(
          `[CSV Extract] Failed to parse response for ${participant.id}:`,
          parseErr
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
    await admin
      .from('csv_analysis_sessions')
      .update({
        status: 'error',
        error_message: e instanceof Error ? e.message : 'Extraction failed',
      })
      .eq('id', session_id);

    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Extraction failed' },
      { status: 500 }
    );
  }
}
