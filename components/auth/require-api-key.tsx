'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { ApiKeysSetup } from '@/components/settings/api-keys-setup';
import { useTranslation } from '@/lib/i18n/context';

// ---------------------------------------------------------------------------
// Hook: useApiKeyStatus
// ---------------------------------------------------------------------------

export interface ApiKeyStatus {
  mistral: boolean;
  gemini: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ApiKeyStatusContext = createContext<ApiKeyStatus | null>(null);

/**
 * Provider that fetches API key status once and shares it across the tree.
 * Must wrap any component that uses `useApiKeyStatus`.
 */
export function ApiKeyStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<{ mistral: boolean; gemini: boolean }>({
    mistral: false,
    gemini: false,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/user/api-keys');
      if (res.ok) {
        const data = await res.json();
        setStatus({ mistral: data.mistral ?? false, gemini: data.gemini ?? false });
      }
    } catch {
      // keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ApiKeyStatusContext.Provider value={{ ...status, loading, refresh }}>
      {children}
    </ApiKeyStatusContext.Provider>
  );
}

/**
 * Returns the configuration status of the user's API keys.
 * Must be used inside an `ApiKeyStatusProvider`.
 */
export function useApiKeyStatus(): ApiKeyStatus {
  const ctx = useContext(ApiKeyStatusContext);
  if (!ctx) {
    throw new Error('useApiKeyStatus must be used within an ApiKeyStatusProvider');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Component: ApiKeyBanner
// ---------------------------------------------------------------------------

interface ApiKeyBannerProps {
  /** Which provider key is required for this module */
  provider: 'mistral' | 'gemini';
  /** Custom message override */
  message?: string;
}

/**
 * Non-blocking banner displayed at the top of a module when the required
 * API key is not configured. Includes a button to open the settings modal.
 */
export function ApiKeyBanner({ provider, message }: ApiKeyBannerProps) {
  const { t } = useTranslation();
  const { mistral, gemini, loading, refresh } = useApiKeyStatus();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (loading) return null;

  const configured = provider === 'mistral' ? mistral : gemini;
  if (configured) return null;

  const providerName = provider === 'mistral' ? 'Mistral' : 'Google Gemini';
  const text =
    message ||
    `${t('settings.apiKeys.required')} ${t('settings.apiKeys.settingsLink').toLowerCase()} : ${providerName}`;

  return (
    <>
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center gap-3 flex-wrap">
        <svg className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
        <p className="text-sm text-foreground flex-1">{text}</p>
        <button
          onClick={() => setSettingsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          {t('settings.apiKeys.title')}
        </button>
      </div>

      <ApiKeysSetup
        isOpen={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          refresh();
        }}
      />
    </>
  );
}
