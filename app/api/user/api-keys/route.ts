import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/encryption';

const PROVIDERS = ['mistral', 'gemini'] as const;
type Provider = (typeof PROVIDERS)[number];

function isProvider(v: unknown): v is Provider {
  return typeof v === 'string' && (PROVIDERS as readonly string[]).includes(v);
}

async function validateMistralKey(key: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.mistral.ai/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function validateGeminiKey(key: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function getAuthenticatedUser(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { user, supabase };
}

/**
 * GET /api/user/api-keys
 * Returns the configuration status of each provider key (never the actual key).
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await auth.supabase
    .from('user_api_keys')
    .select('mistral_key_configured, gemini_key_configured')
    .eq('user_id', auth.user.id)
    .single();

  return NextResponse.json({
    mistral: data?.mistral_key_configured ?? false,
    gemini: data?.gemini_key_configured ?? false,
  });
}

/**
 * POST /api/user/api-keys
 * Body: { provider: 'mistral' | 'gemini', apiKey: string }
 * Validates the key, encrypts it, and stores it.
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { provider, apiKey } = body as { provider: unknown; apiKey: unknown };

  if (!isProvider(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }
  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  const trimmedKey = apiKey.trim();

  // Validate the key with the provider
  const isValid =
    provider === 'mistral'
      ? await validateMistralKey(trimmedKey)
      : await validateGeminiKey(trimmedKey);

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid API key. Please check your key and try again.' },
      { status: 422 }
    );
  }

  const encryptedKey = encrypt(trimmedKey);
  const columnEncrypted = `${provider}_api_key_encrypted`;
  const columnConfigured = `${provider}_key_configured`;

  const { error } = await auth.supabase.from('user_api_keys').upsert(
    {
      user_id: auth.user.id,
      [columnEncrypted]: encryptedKey,
      [columnConfigured]: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('[API Keys] Supabase upsert error:', error);
    return NextResponse.json({ error: 'Failed to save key' }, { status: 500 });
  }

  return NextResponse.json({ success: true, provider });
}

/**
 * DELETE /api/user/api-keys
 * Body: { provider: 'mistral' | 'gemini' }
 */
export async function DELETE(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { provider } = body as { provider: unknown };

  if (!isProvider(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  const columnEncrypted = `${provider}_api_key_encrypted`;
  const columnConfigured = `${provider}_key_configured`;

  const { error } = await auth.supabase
    .from('user_api_keys')
    .update({
      [columnEncrypted]: null,
      [columnConfigured]: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', auth.user.id);

  if (error) {
    console.error('[API Keys] Supabase update error:', error);
    return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 });
  }

  return NextResponse.json({ success: true, provider });
}
