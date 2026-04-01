import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/encryption';

export type ApiProvider = 'mistral' | 'gemini';

/**
 * Retrieves and decrypts a user's API key for the given provider.
 * Throws if the key is not configured.
 */
export async function getUserApiKey(
  userId: string,
  provider: ApiProvider
): Promise<string> {
  const admin = createAdminClient();

  const column = `${provider}_api_key_encrypted`;
  const { data, error } = await admin
    .from('user_api_keys')
    .select(column)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error(`No API key configured for ${provider}`);
  }

  const encrypted = (data as unknown as Record<string, string | null>)[column];
  if (!encrypted) {
    throw new Error(`No API key configured for ${provider}`);
  }

  return decrypt(encrypted);
}

/**
 * Returns the configuration status of both provider keys for a user.
 */
export async function getUserApiKeyStatus(
  userId: string
): Promise<{ mistral: boolean; gemini: boolean }> {
  const admin = createAdminClient();

  const { data } = await admin
    .from('user_api_keys')
    .select('mistral_key_configured, gemini_key_configured')
    .eq('user_id', userId)
    .single();

  return {
    mistral: data?.mistral_key_configured ?? false,
    gemini: data?.gemini_key_configured ?? false,
  };
}
