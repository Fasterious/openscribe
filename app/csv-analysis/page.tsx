'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { Header } from '@/components/layout/header';
import { AuthModal } from '@/components/auth/auth-modal';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { LLMProvider } from '@/types/workshop';
import type { User } from '@supabase/supabase-js';
import type { CsvAnalysisSession, ParsedCsvData } from '@/types/csv-analysis';
import { ApiKeyStatusProvider } from '@/components/auth/require-api-key';
import { LlmModelSelect } from '@/components/ui/llm-model-select';

export default function CsvAnalysisDashboardWrapper() {
  return (
    <ApiKeyStatusProvider>
      <CsvAnalysisDashboard />
    </ApiKeyStatusProvider>
  );
}

function CsvAnalysisDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<CsvAnalysisSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LLMProvider>('gemini');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setAuthModalOpen(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoadingSessions(true);
    fetch('/api/csv-analysis/sessions')
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .finally(() => setLoadingSessions(false));
  }, [user]);

  const parseCsvFile = useCallback(
    (file: File) => {
      if (!user && process.env.NODE_ENV !== 'development') {
        setAuthModalOpen(true);
        return;
      }

      setUploading(true);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const headers = results.meta.fields || [];
            if (headers.length === 0) {
              alert('Le fichier CSV est vide ou mal formaté.');
              setUploading(false);
              return;
            }

            const timestampCols = headers.filter(
              (h) =>
                h.toLowerCase().includes('horodateur') ||
                h.toLowerCase().includes('timestamp') ||
                h.toLowerCase().includes('date')
            );
            const questions = headers.filter((h) => !timestampCols.includes(h));

            const participants: ParsedCsvData['participants'] = (
              results.data as Record<string, string>[]
            ).map((row, idx) => {
              const responses: Record<string, string> = {};
              for (const q of questions) {
                responses[q] = (row[q] || '').trim();
              }
              return {
                id: `P${idx + 1}`,
                name: '',
                responses,
              };
            });

            const parsedData: ParsedCsvData = {
              questions,
              participants,
              total_participants: participants.length,
              total_questions: questions.length,
            };

            const res = await fetch('/api/csv-analysis/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                filename: file.name,
                parsed_data: parsedData,
                model: selectedModel,
              }),
            });

            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || 'Failed to create session');
            }

            const { session } = await res.json();
            router.push(`/csv-analysis/${session.id}`);
          } catch (e) {
            console.error('Failed to parse CSV:', e);
            alert(
              `Erreur: ${e instanceof Error ? e.message : 'Impossible de parser le fichier'}`
            );
            setUploading(false);
          }
        },
        error: (err) => {
          console.error('CSV parse error:', err);
          alert('Erreur de parsing CSV: ' + err.message);
          setUploading(false);
        },
      });
    },
    [user, selectedModel, router]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseCsvFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      parseCsvFile(file);
    }
  };

  const isDevMode = process.env.NODE_ENV === 'development';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-10">
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!user && !isDevMode) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-10">
          <div className="max-w-md mx-auto text-center space-y-6 py-20">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Analyse CSV — Google Forms
            </h1>
            <p className="text-muted-foreground">
              Analysez vos questionnaires Google Forms avec une méthodologie qualitative rigoureuse.
            </p>
            <Button onClick={() => setAuthModalOpen(true)}>
              Se connecter avec Google
            </Button>
          </div>
        </main>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setAuthModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {isDevMode && !user && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-sm text-amber-700">
          Mode développeur — authentification non requise
        </div>
      )}

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analyse CSV</h1>
            <p className="text-muted-foreground mt-1">
              Analysez vos questionnaires Google Forms
            </p>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                <p className="text-sm text-muted-foreground">Parsing du fichier CSV...</p>
              </div>
            ) : (
              <>
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-foreground font-medium mb-1">
                  Glissez un fichier CSV ici
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  ou cliquez pour sélectionner un fichier (.csv exporté de Google Forms)
                </p>

                <div className="flex items-center justify-center gap-3 mb-4">
                  <label className="text-sm text-muted-foreground">Modèle :</label>
                  <LlmModelSelect
                    value={selectedModel}
                    onChange={setSelectedModel}
                  />
                </div>

                <Button onClick={() => fileInputRef.current?.click()}>
                  Sélectionner un fichier CSV
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </>
            )}
          </div>

          {loadingSessions ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : sessions.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Analyses précédentes</h2>
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => router.push(`/csv-analysis/${session.id}`)}
                  className="w-full text-left bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {session.filename}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(session.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.status === 'complete'
                          ? 'bg-green-100 text-green-700'
                          : session.status === 'error'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {session.status === 'complete'
                        ? 'Terminée'
                        : session.status === 'error'
                          ? 'Erreur'
                          : `Étape ${session.current_step}/5`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
