'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n/context';

interface ProviderConfig {
  provider: 'mistral' | 'gemini';
  title: string;
  description: string;
  consoleUrl: string;
  consoleName: string;
}

function ProviderKeyCard({
  config,
  configured,
  onSaved,
  onRemoved,
}: {
  config: ProviderConfig;
  configured: boolean;
  onSaved: () => void;
  onRemoved: () => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSave = async () => {
    if (!keyInput.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: config.provider, apiKey: keyInput.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t('settings.apiKeys.invalidKey'));
        return;
      }

      setKeyInput('');
      setEditing(false);
      setSuccess(t('settings.apiKeys.saved'));
      onSaved();
    } catch {
      setError(t('settings.apiKeys.invalidKey'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setError(null);

    try {
      await fetch('/api/user/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: config.provider }),
      });
      setSuccess(t('settings.apiKeys.removed'));
      onRemoved();
    } catch {
      setError('Failed to remove key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground">{config.title}</h3>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
        <div className="flex-shrink-0">
          {configured ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('settings.apiKeys.configured')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {t('settings.apiKeys.notConfigured')}
            </span>
          )}
        </div>
      </div>

      {configured && !editing ? (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} disabled={loading}>
            {t('settings.apiKeys.modify')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRemove} disabled={loading} className="text-destructive hover:text-destructive">
            {t('settings.apiKeys.remove')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <a
            href={config.consoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {t('settings.apiKeys.getKey')} ({config.consoleName})
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          <div className="flex gap-2">
            <Input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={t('settings.apiKeys.placeholder')}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Button size="sm" onClick={handleSave} disabled={loading || !keyInput.trim()}>
              {loading ? t('settings.apiKeys.validating') : t('settings.apiKeys.validate')}
            </Button>
          </div>

          {editing && (
            <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setKeyInput(''); setError(null); }}>
              Annuler
            </Button>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-success bg-success/10 rounded-lg px-3 py-2">{success}</p>
      )}
    </div>
  );
}

interface ApiKeysSetupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeysSetup({ isOpen, onClose }: ApiKeysSetupProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState({ mistral: false, gemini: false });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/user/api-keys');
      if (res.ok) {
        const data = await res.json();
        setStatus({ mistral: data.mistral, gemini: data.gemini });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => {
      void fetchStatus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [isOpen, fetchStatus]);

  const providers: ProviderConfig[] = [
    {
      provider: 'mistral',
      title: t('settings.apiKeys.mistral.title'),
      description: t('settings.apiKeys.mistral.description'),
      consoleUrl: 'https://console.mistral.ai/api-keys',
      consoleName: 'console.mistral.ai',
    },
    {
      provider: 'gemini',
      title: t('settings.apiKeys.gemini.title'),
      description: t('settings.apiKeys.gemini.description'),
      consoleUrl: 'https://aistudio.google.com/apikey',
      consoleName: 'aistudio.google.com',
    },
  ];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl sm:max-w-lg"
      >
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-muted-foreground"
            aria-label={t('settings.apiKeys.title')}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </DialogClose>

        <DialogHeader className="items-center text-center space-y-0">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <DialogTitle className="text-xl">{t('settings.apiKeys.title')}</DialogTitle>
          <DialogDescription className="mt-1">{t('settings.apiKeys.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {providers.map((config) => (
            <ProviderKeyCard
              key={config.provider}
              config={config}
              configured={status[config.provider]}
              onSaved={() => {
                setStatus((s) => ({ ...s, [config.provider]: true }));
              }}
              onRemoved={() => {
                setStatus((s) => ({ ...s, [config.provider]: false }));
              }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
