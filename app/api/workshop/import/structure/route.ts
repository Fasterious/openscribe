import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runStructureText } from '@/lib/llm';
import { getUserApiKey } from '@/lib/user-api-keys';
import { getProviderType } from '@/lib/llm/provider-utils';
import type { LLMProvider } from '@/types/workshop';
import { interpretLlmFailure } from '@/lib/llm/user-facing-error';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { raw_text, provider = 'gemini' } = await request.json();

  if (!raw_text || typeof raw_text !== 'string') {
    return NextResponse.json(
      { error: 'raw_text is required and must be a string' },
      { status: 400 }
    );
  }

  const trimmed = raw_text.trim();
  if (trimmed.length < 10) {
    return NextResponse.json(
      { error: 'Le texte est trop court pour être structuré' },
      { status: 400 }
    );
  }

  try {
    const apiProvider = getProviderType(provider as LLMProvider);
    const apiKey = await getUserApiKey(user.id, apiProvider);
    const keys = apiProvider === 'gemini'
      ? { geminiApiKey: apiKey }
      : { mistralApiKey: apiKey };

    const responses = await runStructureText(provider as LLMProvider, trimmed, keys);
    return NextResponse.json({ responses });
  } catch (e) {
    console.error('[Import] Structure failed:', e);
    const { message, status } = interpretLlmFailure(e);
    return NextResponse.json({ error: message }, { status });
  }
}
