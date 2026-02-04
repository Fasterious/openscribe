'use client';

import { useState, useCallback } from 'react';
import { UploadZone } from '@/components/transcription/upload-zone';
import { ProgressTracker } from '@/components/transcription/progress-tracker';
import { TranscriptViewer } from '@/components/transcription/transcript-viewer';
import { Button } from '@/components/ui/button';
import type { TranscriptionState, TranscriptionResult, RunPodJobStatus } from '@/types';

const POLL_INTERVAL = 3000; // 3 seconds

export default function Home() {
  const [state, setState] = useState<TranscriptionState>({
    status: 'idle',
    progress: 0,
    result: null,
    error: null,
    jobId: null,
  });
  const [fileName, setFileName] = useState<string>('');

  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/transcribe/${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to get job status');
      }
      
      const status: RunPodJobStatus = await response.json();
      
      if (status.status === 'COMPLETED' && status.output) {
        setState(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          result: status.output as TranscriptionResult,
        }));
      } else if (status.status === 'FAILED') {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: status.error || 'Transcription failed',
        }));
      } else if (status.status === 'IN_QUEUE' || status.status === 'IN_PROGRESS') {
        // Continue polling
        setTimeout(() => pollJobStatus(jobId), POLL_INTERVAL);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to get job status',
      }));
    }
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setFileName(file.name);
    setState({
      status: 'uploading',
      progress: 0,
      result: null,
      error: null,
      jobId: null,
    });

    try {
      // Étape 1: Demander une URL signée pour l'upload
      const prepareResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileName: file.name,
          fileSize: file.size,
        }),
      });

      if (!prepareResponse.ok) {
        const error = await prepareResponse.json();
        throw new Error(error.error || 'Failed to prepare upload');
      }

      const { uploadUrl, filePath } = await prepareResponse.json();

      setState(prev => ({ ...prev, progress: 10 }));

      // Étape 2: Upload direct vers Supabase avec progression
      const xhr = new XMLHttpRequest();
      
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 80) + 10; // 10-90%
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
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      setState(prev => ({ ...prev, progress: 95 }));

      // Étape 3: Obtenir l'URL de téléchargement
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });

      if (!completeResponse.ok) {
        const error = await completeResponse.json();
        throw new Error(error.error || 'Failed to complete upload');
      }

      const { audioUrl } = await completeResponse.json();

      setState(prev => ({
        ...prev,
        status: 'processing',
        progress: 100,
      }));

      // Étape 4: Lancer la transcription (Voxtral - synchrone)
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl }),
      });

      if (!transcribeResponse.ok) {
        const error = await transcribeResponse.json();
        throw new Error(error.error || 'Failed to transcribe');
      }

      const transcribeData = await transcribeResponse.json();

      // Voxtral retourne le résultat directement (synchrone)
      if (transcribeData.result) {
        setState(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          result: transcribeData.result,
        }));
      } else if (transcribeData.jobId) {
        // Fallback pour compatibilité avec RunPod (asynchrone)
        setState(prev => ({
          ...prev,
          jobId: transcribeData.jobId,
        }));
        pollJobStatus(transcribeData.jobId);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  }, [pollJobStatus]);

  const handleReset = useCallback(() => {
    setState({
      status: 'idle',
      progress: 0,
      result: null,
      error: null,
      jobId: null,
    });
    setFileName('');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg 
              className="h-8 w-8 text-primary" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
              />
            </svg>
            <span className="text-xl font-semibold">OpenScribe</span>
          </div>
          <nav className="flex items-center gap-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Hero */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Transcribe your audio
            </h1>
            <p className="text-lg text-muted-foreground">
              Professional-quality transcription with speaker diarization, powered by Voxtral
            </p>
          </div>

          {/* Upload or Progress */}
          {state.status === 'idle' && (
            <UploadZone onFileSelect={handleFileSelect} />
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
                  This may take a few minutes depending on the audio length...
                </p>
              )}
            </div>
          )}

          {/* Error state */}
          {state.status === 'error' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                <svg 
                  className="mx-auto h-12 w-12 text-red-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-red-800">
                  Transcription failed
                </h3>
                <p className="mt-2 text-sm text-red-600">
                  {state.error}
                </p>
              </div>
              <div className="flex justify-center">
                <Button onClick={handleReset} variant="outline">
                  Try again
                </Button>
              </div>
            </div>
          )}

          {/* Result */}
          {state.status === 'completed' && state.result && (
            <div className="space-y-4">
              <TranscriptViewer result={state.result} />
              <div className="flex justify-center">
                <Button onClick={handleReset} variant="outline">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Transcribe another file
                </Button>
              </div>
            </div>
          )}

          {/* Features info */}
          {state.status === 'idle' && (
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-medium">Speaker Detection</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic speaker diarization
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <h3 className="font-medium">99+ Languages</h3>
                <p className="text-sm text-muted-foreground">
                  Auto language detection
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-medium">Fast & Accurate</h3>
                <p className="text-sm text-muted-foreground">
                  Powered by Voxtral
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            OpenScribe - Open source transcription for researchers
          </p>
        </div>
      </footer>
    </div>
  );
}
