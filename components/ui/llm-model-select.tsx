'use client';

import { useState } from 'react';
import { LLM_MODELS } from '@/types/workshop';
import type { LLMProvider } from '@/types/workshop';
import { useApiKeyStatus } from '@/components/auth/require-api-key';
import { ApiKeysSetup } from '@/components/settings/api-keys-setup';

function getBaseProvider(key: LLMProvider): 'mistral' | 'gemini' {
  if (key === 'gemini' || key === 'gemini-pro') return 'gemini';
  return 'mistral';
}

interface LlmModelSelectProps {
  value: LLMProvider;
  onChange: (value: LLMProvider) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Drop-in replacement for the raw <select> used to pick an LLM model.
 * Shows which models are available (API key configured) and which are not,
 * with a contextual CTA to configure the missing key.
 */
export function LlmModelSelect({ value, onChange, className, disabled }: LlmModelSelectProps) {
  const { mistral, gemini, loading, refresh } = useApiKeyStatus();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isConfigured = (key: LLMProvider) => {
    const base = getBaseProvider(key);
    return base === 'mistral' ? mistral : gemini;
  };

  const selectedConfigured = isConfigured(value);
  const selectedBase = getBaseProvider(value);
  const providerName = selectedBase === 'mistral' ? 'Mistral' : 'Google Gemini';

  return (
    <div className="inline-flex flex-col gap-1.5">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as LLMProvider)}
        disabled={disabled || loading}
        className={
          className ||
          'text-sm rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
        }
      >
        {(Object.entries(LLM_MODELS) as [LLMProvider, { label: string }][]).map(
          ([key, { label }]) => {
            const configured = isConfigured(key);
            return (
              <option key={key} value={key}>
                {configured ? '✓ ' : '⚠ '}{label}
              </option>
            );
          }
        )}
      </select>

      {!loading && !selectedConfigured && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Clé {providerName} non configurée</span>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
          >
            Configurer
          </button>
        </div>
      )}

      <ApiKeysSetup
        isOpen={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          refresh();
        }}
      />
    </div>
  );
}
