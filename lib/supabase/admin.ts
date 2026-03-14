import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase Admin avec Service Role.
 * Bypass RLS - utilisé uniquement côté serveur pour les opérations backend.
 * Ne jamais exposer ce client au client (browser).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for admin operations. Add it to your .env.local'
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
