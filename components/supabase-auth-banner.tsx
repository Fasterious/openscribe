'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

interface SupabaseAuthBannerProps {
  show: boolean;
}

export function SupabaseAuthBanner({ show }: SupabaseAuthBannerProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return null;

  return (
    <div
      role="alert"
      className="bg-amber-500/95 text-amber-950 px-4 py-3 text-center text-sm font-medium"
    >
      <span className="mr-4">{t('supabase.unavailable')}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="underline hover:no-underline font-semibold"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
