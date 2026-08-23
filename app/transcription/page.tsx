'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { UploadZone } from '@/components/transcription/upload-zone';
import { TranscriptionLanguageSelect } from '@/components/transcription/transcription-language-select';
import { ProgressTracker } from '@/components/transcription/progress-tracker';
import { TranscriptViewer } from '@/components/transcription/transcript-viewer';
import { AuthModal } from '@/components/auth/auth-modal';
import { ApiKeyStatusProvider, ApiKeyBanner, useApiKeyStatus } from '@/components/auth/require-api-key';
import { FeedbackButton } from '@/components/feedback/feedback-button';
import { Header } from '@/components/layout/header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WaveformAnimation } from '@/components/ui/waveform-animation';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import type { TranscriptionState, TranscriptionResult } from '@/types';
import type { User } from '@supabase/supabase-js';

export default function TranscriptionPage() {
  return (
    <ApiKeyStatusProvider>
      <TranscriptionPageInner />
    </ApiKeyStatusProvider>
  );
}

function TranscriptionPageInner() {
  const { t } = useTranslation();
  const { mistral: mistralConfigured, loading: keysLoading } = useApiKeyStatus();
  const [state, setState] = useState<TranscriptionState>({
    status: 'idle',
    progress: 0,
    result: null,
    error: null,
  });
  const [fileName, setFileName] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [speakerLanguage, setSpeakerLanguage] = useState('');

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleReset = useCallback(() => {
    setState({ status: 'idle', progress: 0, result: null, error: null });
    setFileName('');
  }, []);

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          user={null}
          loading={false}
          onSignIn={() => setAuthModalOpen(true)}
          manageAuth={false}
        />
        <main className="container mx-auto px-4 py-10">
          <div className="max-w-md mx-auto text-center space-y-6 py-20">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('hero.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('hero.subtitle')}
            </p>
            <Button onClick={() => setAuthModalOpen(true)}>
              {t('header.signIn')}
            </Button>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-card rounded-xl border border-border p-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{t('features.speakers.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('features.speakers.description')}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{t('features.languages.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('features.languages.description')}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{t('features.fast.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('features.fast.description')}</p>
            </div>
          </div>
        </main>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setAuthModalOpen(false)}
          redirectTo="/transcription"
        />
      </div>
    );
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleFileSelect = async (file: File) => {
    setFileName(file.name);
    setState({ status: 'uploading', progress: 0, result: null, error: null });

    const uploadStartMs = Date.now();

    try {
      const urlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || 'audio/mpeg',
          fileSize: file.size,
        }),
      });

      if (!urlResponse.ok) {
        const error = await urlResponse.json();
        throw new Error(error.error || 'Failed to get upload URL');
      }

      const { uploadUrl, fileUrl, fileKey } = await urlResponse.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 70);
            setState(prev => ({ ...prev, progress: percent }));
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        });
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg');
        xhr.send(file);
      });

      const uploadEndMs = Date.now();
      const audioUrl = fileUrl;

      const fileSizeMB = file.size / (1024 * 1024);
      const estimatedAudioDurationSeconds = fileSizeMB * 60;
      const estimatedTranscriptionSeconds = Math.max(5, Math.ceil(estimatedAudioDurationSeconds / 146));
      setEstimatedTimeRemaining(estimatedTranscriptionSeconds);

      const startTime = Date.now();
      const startProgress = 70;
      const endProgress = 95;

      progressIntervalRef.current = setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const progressRatio = Math.min(elapsedSeconds / estimatedTranscriptionSeconds, 0.95);
        const currentProgress = startProgress + (endProgress - startProgress) * progressRatio;
        const remainingTime = Math.max(0, estimatedTranscriptionSeconds - elapsedSeconds);
        setState(prev => ({ ...prev, status: 'processing', progress: Math.round(currentProgress) }));
        setEstimatedTimeRemaining(Math.round(remainingTime));
      }, 500);

      setState(prev => ({ ...prev, status: 'processing', progress: startProgress }));

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl,
          fileKey,
          language: speakerLanguage.trim() || null,
          metrics: { uploadStartMs, uploadEndMs, fileSizeBytes: file.size },
        }),
      });

      if (!transcribeResponse.ok) {
        const errorText = await transcribeResponse.text();
        let errorMessage = 'Failed to transcribe';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const responseText = await transcribeResponse.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}`);
      }

      const { result } = responseData;

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setEstimatedTimeRemaining(0);

      setState({ status: 'completed', progress: 100, result: result as TranscriptionResult, error: null });
    } catch (error) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setEstimatedTimeRemaining(0);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        user={user}
        loading={loading}
        onSignOut={handleSignOut}
        onSignIn={() => setAuthModalOpen(true)}
        manageAuth={false}
      />

      <main className="flex-1 container mx-auto px-4 py-10">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Banner when Mistral key is missing */}
            {!keysLoading && user && !mistralConfigured && (
              <ApiKeyBanner
                provider="mistral"
                message="Configurez votre clé API Mistral pour démarrer une transcription."
              />
            )}

            {/* Hero */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {t('hero.title')}
              </h1>
              <p className="text-base text-muted-foreground max-w-lg mx-auto">
                {t('hero.subtitle')}
              </p>
            </div>

            {/* Upload or Progress */}
            {state.status === 'idle' && (
              <>
                <TranscriptionLanguageSelect
                  value={speakerLanguage}
                  onChange={setSpeakerLanguage}
                />
                <UploadZone onFileSelect={handleFileSelect} disabled={!mistralConfigured || !user} />
                <Alert variant="default" className="items-start text-xs">
                  <svg className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <AlertDescription className="text-xs [&_p]:leading-normal">
                    {t('privacy.notice')}
                  </AlertDescription>
                </Alert>
              </>
            )}

            {(state.status === 'uploading' || state.status === 'processing') && (
              <div className="space-y-4">
                <ProgressTracker
                  status={state.status}
                  progress={state.progress}
                  fileName={fileName}
                  estimatedTimeRemaining={state.status === 'processing' ? estimatedTimeRemaining : undefined}
                  speakerLanguageCode={speakerLanguage}
                />
                {state.status === 'processing' && (
                  <p className="text-center text-sm text-muted-foreground">
                    {t('progress.transcribing')}
                  </p>
                )}
              </div>
            )}

            {state.status === 'error' && (
              <div className="space-y-4">
                <Alert variant="destructive" className="flex-col items-center text-center sm:flex-row sm:text-left sm:items-start py-8">
                  <svg className="h-7 w-7 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
                    <AlertTitle className="text-lg">{t('error.title')}</AlertTitle>
                    <AlertDescription className="text-sm text-muted-foreground">
                      {state.error}
                    </AlertDescription>
                  </div>
                </Alert>
                <div className="flex justify-center">
                  <Button onClick={handleReset} variant="outline">{t('error.tryAgain')}</Button>
                </div>
              </div>
            )}

            {state.status === 'completed' && state.result && (
              <div className="space-y-4">
                <TranscriptViewer
                  result={state.result}
                  isAuthenticated={true}
                  onSignUpClick={() => {}}
                />
                <div className="flex justify-center">
                  <Button onClick={handleReset} variant="outline">
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('actions.transcribeAnother')}
                  </Button>
                </div>
              </div>
            )}

            {/* Feature cards */}
            {state.status === 'idle' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                <div className="feature-card bg-card rounded-xl border border-border p-5 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{t('features.speakers.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('features.speakers.description')}</p>
                </div>
                <div className="feature-card bg-card rounded-xl border border-border p-5 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{t('features.languages.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('features.languages.description')}</p>
                </div>
                <div className="feature-card bg-card rounded-xl border border-border p-5 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{t('features.fast.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('features.fast.description')}</p>
                </div>
              </div>
            )}
          </div>
      </main>

      <div className="mt-auto">
        <WaveformAnimation className="opacity-80" />
      </div>

      <footer className="bg-card/50 backdrop-blur-sm border-t border-border/30">
        <div className="container mx-auto px-4 py-5">
          <p className="text-center text-sm text-muted-foreground">{t('footer.text')}</p>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
        redirectTo="/transcription"
      />

      <FeedbackButton />
    </div>
  );
}
