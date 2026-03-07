import { headers } from 'next/headers';
import { SupabaseAuthBanner } from './supabase-auth-banner';

export async function SupabaseAuthBannerWrapper() {
  const headersList = await headers();
  const isUnavailable = headersList.get('x-supabase-auth-unavailable') === '1';

  return <SupabaseAuthBanner show={isUnavailable} />;
}
