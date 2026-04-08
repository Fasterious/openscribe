import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserApiKey } from '@/lib/user-api-keys';
import { getLLMClient } from '@/lib/llm';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { headers, sample_rows } = await request.json();

  if (!headers || !sample_rows) {
    return NextResponse.json(
      { error: 'headers and sample_rows are required' },
      { status: 400 }
    );
  }

  try {
    const geminiKey = await getUserApiKey(user.id, 'gemini');

    if (!geminiKey) {
      // Fallback: heuristic-based detection
      const recommended = detectLikertColumnsHeuristic(headers, sample_rows);
      return NextResponse.json({ recommended_indices: recommended, method: 'heuristic' });
    }

    const client = getLLMClient('gemini', { geminiApiKey: geminiKey });

    const sampleStr = sample_rows
      .slice(0, 3)
      .map((row: Record<string, string>) =>
        headers.map((h: string) => `${h}: ${row[h]}`).join(', ')
      )
      .join('\n');

    const prompt = `You are a data analyst. Given these CSV column headers and sample data, identify which columns contain Likert scale responses (numeric scales like 1-5, 1-7, 1-10, used in surveys/questionnaires).

Headers: ${JSON.stringify(headers)}

Sample data:
${sampleStr}

Return ONLY a JSON array of column indices (0-based) that contain Likert scale data. Example: [2, 3, 4, 5]
Do NOT include ID columns, timestamp columns, open-text columns, or demographic columns.
Return ONLY the JSON array, no explanation.`;

    const raw = await client.analyze(prompt);
    const match = raw.match(/\[[\d,\s]+\]/);
    if (match) {
      const indices: number[] = JSON.parse(match[0]);
      const valid = indices.filter((i) => i >= 0 && i < headers.length);
      return NextResponse.json({ recommended_indices: valid, method: 'llm' });
    }

    const recommended = detectLikertColumnsHeuristic(headers, sample_rows);
    return NextResponse.json({ recommended_indices: recommended, method: 'heuristic' });
  } catch (e) {
    const recommended = detectLikertColumnsHeuristic(headers, sample_rows);
    return NextResponse.json({
      recommended_indices: recommended,
      method: 'heuristic',
      warning: e instanceof Error ? e.message : 'LLM unavailable, using heuristic',
    });
  }
}

function detectLikertColumnsHeuristic(
  headers: string[],
  sampleRows: Record<string, string>[]
): number[] {
  const indices: number[] = [];

  headers.forEach((header, i) => {
    const lowerHeader = header.toLowerCase();
    // Skip obvious non-Likert columns
    if (/^(id|timestamp|date|email|nom|name|prenom|firstname|lastname)$/i.test(lowerHeader)) return;
    if (/horodateur|timestamp|date/i.test(lowerHeader)) return;

    const values = sampleRows.map((r) => r[header]).filter((v) => v !== '' && v !== undefined);
    const numericValues = values.filter((v) => !isNaN(Number(v)));

    if (numericValues.length < values.length * 0.7) return;

    const nums = numericValues.map(Number);
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const uniqueCount = new Set(nums).size;

    // Likert scales: small range, integer-like, bounded
    if (min >= 0 && max <= 10 && uniqueCount <= 11 && nums.every((n) => Number.isInteger(n))) {
      indices.push(i);
    }
  });

  return indices;
}
