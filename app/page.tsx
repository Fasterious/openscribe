'use client';

import { useState, useCallback, useEffect } from 'react';
import { UploadZone } from '@/components/transcription/upload-zone';
import { ProgressTracker } from '@/components/transcription/progress-tracker';
import { TranscriptViewer } from '@/components/transcription/transcript-viewer';
import { AuthModal } from '@/components/auth/auth-modal';
import { FeedbackButton } from '@/components/feedback/feedback-button';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/ui/language-selector';
import { WaveformAnimation } from '@/components/ui/waveform-animation';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import type { TranscriptionState, TranscriptionResult } from '@/types';
import type { User } from '@supabase/supabase-js';

// Clés localStorage pour persister la transcription
const STORAGE_KEY_RESULT = 'openscribe_pending_result';
const STORAGE_KEY_FILENAME = 'openscribe_pending_filename';
const STORAGE_KEY_TRANSCRIPTION_ID = 'openscribe_pending_transcription_id';

export default function Home() {
  const { t } = useTranslation();
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
  // ID de transcription pour récupérer le résultat complet après auth
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);

  const supabase = createClient();

  // Vérifier l'état d'authentification et récupérer transcription en attente
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);

      // Si l'utilisateur vient de s'authentifier, récupérer la transcription en attente
      if (user) {
        const savedTranscriptionId = localStorage.getItem(STORAGE_KEY_TRANSCRIPTION_ID);
        const savedFileName = localStorage.getItem(STORAGE_KEY_FILENAME);
        
        // Priorité : récupérer le résultat complet via l'API si on a un ID
        if (savedTranscriptionId) {
          if (savedFileName) {
            setFileName(savedFileName);
          }
          await fetchFullTranscription(savedTranscriptionId);
          // Nettoyer le localStorage
          localStorage.removeItem(STORAGE_KEY_TRANSCRIPTION_ID);
          localStorage.removeItem(STORAGE_KEY_FILENAME);
          localStorage.removeItem(STORAGE_KEY_RESULT);
        } else {
          // Fallback : utiliser le résultat sauvegardé en localStorage
          const savedResult = localStorage.getItem(STORAGE_KEY_RESULT);
          if (savedResult) {
            try {
              const result = JSON.parse(savedResult) as TranscriptionResult;
              setState({
                status: 'completed',
                progress: 100,
                result,
                error: null,
              });
              if (savedFileName) {
                setFileName(savedFileName);
              }
              // Nettoyer le localStorage
              localStorage.removeItem(STORAGE_KEY_RESULT);
              localStorage.removeItem(STORAGE_KEY_FILENAME);
            } catch {
              // Ignorer les erreurs de parsing
            }
          }
        }
      }
    };

    checkUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        // Si l'utilisateur vient de se connecter, récupérer la transcription complète
        if (event === 'SIGNED_IN' && session?.user) {
          const savedTranscriptionId = localStorage.getItem(STORAGE_KEY_TRANSCRIPTION_ID);
          if (savedTranscriptionId) {
            const savedFileName = localStorage.getItem(STORAGE_KEY_FILENAME);
            if (savedFileName) {
              setFileName(savedFileName);
            }
            await fetchFullTranscription(savedTranscriptionId);
            // Nettoyer le localStorage
            localStorage.removeItem(STORAGE_KEY_TRANSCRIPTION_ID);
            localStorage.removeItem(STORAGE_KEY_FILENAME);
            localStorage.removeItem(STORAGE_KEY_RESULT);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Récupérer la transcription complète après authentification
  const fetchFullTranscription = async (id: string) => {
    try {
      const response = await fetch(`/api/transcribe/${id}`);
      if (response.ok) {
        const { result } = await response.json();
        setState({
          status: 'completed',
          progress: 100,
          result: result as TranscriptionResult,
          error: null,
        });
        setTranscriptionId(null);
      } else {
        // L'ID a peut-être expiré, utiliser le résultat partiel sauvegardé
        const savedResult = localStorage.getItem(STORAGE_KEY_RESULT);
        if (savedResult) {
          const result = JSON.parse(savedResult) as TranscriptionResult;
          setState({
            status: 'completed',
            progress: 100,
            result,
            error: null,
          });
        }
      }
    } catch {
      // En cas d'erreur, utiliser le résultat partiel sauvegardé
      const savedResult = localStorage.getItem(STORAGE_KEY_RESULT);
      if (savedResult) {
        try {
          const result = JSON.parse(savedResult) as TranscriptionResult;
          setState({
            status: 'completed',
            progress: 100,
            result,
            error: null,
          });
        } catch {
          // Ignorer les erreurs de parsing
        }
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSignUpClick = useCallback(() => {
    // Sauvegarder la transcription en cours dans localStorage avant d'ouvrir l'auth
    if (state.result) {
      localStorage.setItem(STORAGE_KEY_RESULT, JSON.stringify(state.result));
      localStorage.setItem(STORAGE_KEY_FILENAME, fileName);
    }
    // Sauvegarder l'ID de transcription pour récupérer le résultat complet après auth
    if (transcriptionId) {
      localStorage.setItem(STORAGE_KEY_TRANSCRIPTION_ID, transcriptionId);
    }
    setAuthModalOpen(true);
  }, [state.result, fileName, transcriptionId]);

  const handleFileSelect = useCallback(async (file: File) => {
    setFileName(file.name);
    setState({
      status: 'uploading',
      progress: 0,
      result: null,
      error: null,
    });

    try {
      // Étape 1: Obtenir une URL d'upload presignée depuis R2
      const urlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || 'audio/mpeg',
        }),
      });

      if (!urlResponse.ok) {
        const error = await urlResponse.json();
        throw new Error(error.error || 'Failed to get upload URL');
      }

      const { uploadUrl, fileUrl, fileKey } = await urlResponse.json();

      // Étape 2: Upload direct vers R2 avec progression (pas de limite Vercel !)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 70); // 0-70%
            setState(prev => ({ ...prev, progress: percent }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg');
        xhr.send(file);
      });

      const audioUrl = fileUrl;

      setState(prev => ({
        ...prev,
        status: 'processing',
        progress: 80,
      }));

      // Étape 3: Transcription via Voxtral (synchrone)
      // On passe fileKey pour que le serveur puisse supprimer le fichier R2 après transcription
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl, fileKey }),
      });

      if (!transcribeResponse.ok) {
        // Essayer de parser comme JSON, sinon utiliser le texte brut
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
      
      const { result, transcriptionId: tId, isPreview } = responseData;

      // Sauvegarder l'ID pour récupérer le résultat complet après auth
      if (isPreview && tId) {
        setTranscriptionId(tId);
      }

      setState({
        status: 'completed',
        progress: 100,
        result: result as TranscriptionResult,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  }, []);

  const handleReset = useCallback(() => {
    setState({
      status: 'idle',
      progress: 0,
      result: null,
      error: null,
    });
    setFileName('');
    setTranscriptionId(null);
    // Nettoyer le localStorage
    localStorage.removeItem(STORAGE_KEY_RESULT);
    localStorage.removeItem(STORAGE_KEY_FILENAME);
    localStorage.removeItem(STORAGE_KEY_TRANSCRIPTION_ID);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Logo */}
            <img 
              src="/logo.svg" 
              alt="OpenScribe logo" 
              className="h-8 w-auto"
            />
            <span className="text-xl font-semibold text-foreground">OpenScribe</span>
          </div>
          <nav className="flex items-center gap-3">
            <LanguageSelector />
            {!loading && (
              user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {user.email}
                  </span>
                  <Button variant="default" size="sm" onClick={handleSignOut}>
                    {t('header.signOut')}
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setAuthModalOpen(true)}>
                  {t('header.signIn')}
                </Button>
              )
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto space-y-8">
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
              <UploadZone onFileSelect={handleFileSelect} />
              
              {/* Privacy notice */}
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 border border-border/50 px-4 py-3 text-xs text-muted-foreground">
                <svg className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{t('privacy.notice')}</p>
              </div>
            </>
          )}

          {(state.status === 'uploading' || state.status === 'processing') && (
            <div className="space-y-4">
              <ProgressTracker 
                status={state.status} 
                progress={state.progress}
                fileName={fileName}
              />
              {state.status === 'processing' && (
                <p className="text-center text-sm text-muted-foreground">
                  {t('progress.transcribing')}
                </p>
              )}
            </div>
          )}

          {/* Error state */}
          {state.status === 'error' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <svg 
                    className="h-7 w-7 text-destructive" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t('error.title')}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {state.error}
                </p>
              </div>
              <div className="flex justify-center">
                <Button onClick={handleReset} variant="outline">
                  {t('error.tryAgain')}
                </Button>
              </div>
            </div>
          )}

          {/* Result */}
          {state.status === 'completed' && state.result && (
            <div className="space-y-4">
              <TranscriptViewer 
                result={state.result} 
                isAuthenticated={!!user}
                onSignUpClick={handleSignUpClick}
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

          {/* Features info - Cards */}
          {state.status === 'idle' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              {/* Speaker Detection */}
              <div className="feature-card bg-card rounded-xl border border-border p-5 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{t('features.speakers.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('features.speakers.description')}
                </p>
              </div>
              
              {/* Languages */}
              <div className="feature-card bg-card rounded-xl border border-border p-5 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{t('features.languages.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('features.languages.description')}
                </p>
              </div>
              
              {/* Fast & Accurate */}
              <div className="feature-card bg-card rounded-xl border border-border p-5 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{t('features.fast.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('features.fast.description')}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Waveform animation */}
      <div className="mt-auto">
        <WaveformAnimation className="opacity-80" />
      </div>

      {/* Footer */}
      <footer className="bg-card/50 backdrop-blur-sm border-t border-border/30">
        <div className="container mx-auto px-4 py-5">
          <p className="text-center text-sm text-muted-foreground">
            {t('footer.text')}
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />

      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  );
}
