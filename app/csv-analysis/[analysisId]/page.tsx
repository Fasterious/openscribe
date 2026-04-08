'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertContent } from '@/components/ui/alert';
import { PipelineStepper } from '@/components/csv-analysis/pipeline-stepper';
import { QuintupletTable } from '@/components/csv-analysis/quintuplet-table';
import { ClusterView } from '@/components/csv-analysis/cluster-view';
import { FinalReport } from '@/components/csv-analysis/final-report';
import { createClient } from '@/lib/supabase/client';
import type { CsvAnalysisSession, AnalysisStep } from '@/types/csv-analysis';

function cleanSummaryText(text: string): string {
  let cleaned = text.trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null) {
      const values = Object.values(parsed).filter((v) => typeof v === 'string');
      if (values.length > 0) return (values as string[]).join('\n\n');
    }
    if (typeof parsed === 'string') return parsed;
  } catch {
    // Not JSON
  }
  return cleaned;
}

export default function CsvAnalysisPipeline() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.analysisId as string;
  const supabase = createClient();

  const [session, setSession] = useState<CsvAnalysisSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'pipeline' | 'report'>('pipeline');
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/csv-analysis/sessions/${analysisId}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/csv-analysis');
          return;
        }
        throw new Error('Failed to fetch session');
      }
      const data = await res.json();
      setSession(data.session);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [analysisId, router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (session?.step_1_parsed && selectedQuestions.size === 0) {
      const parsed = session.step_1_parsed;
      const initial = parsed.selected_questions ?? parsed.questions;
      setSelectedQuestions(new Set(initial));
    }
  }, [session, selectedQuestions.size]);

  const runStep = async (
    endpoint: string,
    nextStatus: AnalysisStep,
    extraBody?: Record<string, unknown>
  ) => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: analysisId, ...extraBody }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Step failed`);
      }
      await fetchSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Step failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleExtract = () => {
    if (selectedQuestions.size === 0) {
      setError('Sélectionnez au moins une question à analyser.');
      return;
    }
    runStep('/api/csv-analysis/extract', 'extracting', {
      selected_questions: [...selectedQuestions],
    });
  };
  const handleCluster = () => runStep('/api/csv-analysis/cluster', 'clustering');
  const handleSynthesize = () => runStep('/api/csv-analysis/synthesize', 'synthesizing');

  const handleDelete = async () => {
    if (!confirm('Supprimer cette analyse ?')) return;
    await fetch(`/api/csv-analysis/sessions/${analysisId}`, { method: 'DELETE' });
    router.push('/csv-analysis');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-10">
          <div className="flex justify-center py-20">
            <Spinner className="size-8 border-[3px]" />
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-10">
          <div className="text-center py-20">
            <p className="text-muted-foreground">Analyse introuvable.</p>
            <Button className="mt-4" onClick={() => router.push('/csv-analysis')}>
              Retour
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const parsed = session.step_1_parsed;
  const quintuplets = session.step_2_quintuplets;
  const clusters = session.step_3_clusters;
  const finalAnalysis = session.step_5_final;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.push('/csv-analysis')}
                className="mb-2 -ml-2 h-auto px-2 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </Button>
              <h1 className="text-xl font-bold text-foreground">{session.filename}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Modèle : {session.model_used} · Créée le{' '}
                {new Date(session.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>

          {/* Pipeline Stepper */}
          <div className="bg-card rounded-xl border border-border px-5 py-4">
            <PipelineStepper currentStep={session.status} isProcessing={processing} />
          </div>

          {/* Error */}
          {(error || session.error_message) && (
            <Alert variant="destructive">
              <AlertContent>
                <p className="text-sm">{error || session.error_message}</p>
              </AlertContent>
            </Alert>
          )}

          {/* View toggle for complete analyses */}
          {session.status === 'complete' && (
            <div className="flex gap-2">
              <Button
                variant={activeView === 'pipeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('pipeline')}
              >
                Vue Pipeline
              </Button>
              <Button
                variant={activeView === 'report' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('report')}
              >
                Rapport Final
              </Button>
            </div>
          )}

          {/* Report view */}
          {activeView === 'report' && finalAnalysis && (
            <FinalReport analysis={finalAnalysis} filename={session.filename} />
          )}

          {/* Pipeline view */}
          {activeView === 'pipeline' && (
            <>
              {/* Step 1 — Parsed CSV */}
              {parsed && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-foreground">
                        Étape 1 — Parsing CSV
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {parsed.total_participants} participants · {parsed.total_questions} questions détectées · {selectedQuestions.size} sélectionnées
                      </p>
                    </div>
                    <Badge className="border bg-success/15 text-success border-success/20">
                      Terminé
                    </Badge>
                  </div>
                  <div className="px-5 py-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Questions à analyser
                        </p>
                        {!quintuplets && (
                          <button
                            onClick={() => {
                              if (selectedQuestions.size === parsed.questions.length) {
                                setSelectedQuestions(new Set());
                              } else {
                                setSelectedQuestions(new Set(parsed.questions));
                              }
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            {selectedQuestions.size === parsed.questions.length
                              ? 'Tout désélectionner'
                              : 'Tout sélectionner'}
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {parsed.questions.map((q, i) => {
                          const qid = `csv-analysis-q-${i}`;
                          return (
                            <div
                              key={i}
                              className={`flex items-start gap-3 text-sm p-2 rounded-lg transition-colors ${
                                !quintuplets ? 'hover:bg-secondary/30' : ''
                              } ${selectedQuestions.has(q) ? 'text-foreground' : 'text-muted-foreground'}`}
                            >
                              <Checkbox
                                id={qid}
                                className="mt-0.5"
                                checked={selectedQuestions.has(q)}
                                disabled={!!quintuplets}
                                onCheckedChange={() => {
                                  setSelectedQuestions((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(q)) {
                                      next.delete(q);
                                    } else {
                                      next.add(q);
                                    }
                                    return next;
                                  });
                                }}
                              />
                              <Label
                                htmlFor={qid}
                                className={`font-normal leading-snug ${
                                  !quintuplets ? 'cursor-pointer' : 'cursor-default'
                                }`}
                              >
                                <span className="text-muted-foreground mr-1.5">Q{i + 1}.</span>
                                {q}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 — Extraction */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-foreground">
                      Étape 2 — Extraction atomique & Quintuplets
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {quintuplets
                        ? `${quintuplets.length} quintuplets extraits`
                        : 'Extraction des idées atomiques de chaque réponse'}
                    </p>
                  </div>
                  {quintuplets ? (
                    <Badge className="border bg-success/15 text-success border-success/20">
                      Terminé
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleExtract}
                      disabled={processing || !parsed}
                    >
                      {processing && session.status === 'extracting' ? (
                        <>
                          <Spinner
                            size="sm"
                            className="mr-1.5 border-primary-foreground/30 border-t-primary-foreground"
                          />
                          Extraction en cours...
                        </>
                      ) : (
                        'Lancer l\'extraction'
                      )}
                    </Button>
                  )}
                </div>
                {quintuplets && quintuplets.length > 0 && (
                  <div className="px-5 py-4">
                    <QuintupletTable quintuplets={quintuplets} />
                  </div>
                )}
              </div>

              {/* Step 3 — Clustering */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-foreground">
                      Étape 3 — Normalisation & Clustering
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {clusters
                        ? `${clusters.length} clusters créés`
                        : 'Regroupement des tags similaires en grands thèmes'}
                    </p>
                  </div>
                  {clusters ? (
                    <Badge className="border bg-success/15 text-success border-success/20">
                      Terminé
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleCluster}
                      disabled={processing || !quintuplets}
                    >
                      {processing && session.status === 'clustering' ? (
                        <>
                          <Spinner
                            size="sm"
                            className="mr-1.5 border-primary-foreground/30 border-t-primary-foreground"
                          />
                          Clustering en cours...
                        </>
                      ) : (
                        'Lancer le clustering'
                      )}
                    </Button>
                  )}
                </div>
                {clusters && clusters.length > 0 && (
                  <div className="px-5 py-4">
                    <ClusterView clusters={clusters} />
                  </div>
                )}
              </div>

              {/* Step 4+5 — Synthesis */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-foreground">
                      Étape 4 & 5 — Comptage & Synthèse
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {finalAnalysis
                        ? 'Analyse complète avec résumés'
                        : 'Comptage quantitatif + rédaction des résumés par tag et cluster'}
                    </p>
                  </div>
                  {finalAnalysis ? (
                    <Badge className="border bg-success/15 text-success border-success/20">
                      Terminé
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleSynthesize}
                      disabled={processing || !clusters}
                    >
                      {processing && session.status === 'synthesizing' ? (
                        <>
                          <Spinner
                            size="sm"
                            className="mr-1.5 border-primary-foreground/30 border-t-primary-foreground"
                          />
                          Synthèse en cours...
                        </>
                      ) : (
                        'Lancer la synthèse'
                      )}
                    </Button>
                  )}
                </div>
                {finalAnalysis && (
                  <div className="px-5 py-4">
                    <div className="bg-primary/5 rounded-xl p-5">
                      <h3 className="font-semibold text-foreground mb-2">Résumé exécutif</h3>
                      <div className="flex gap-4 mb-3 text-sm text-muted-foreground">
                        <span>{finalAnalysis.total_quintuplets} verbatims</span>
                        <span>{finalAnalysis.total_participants} participants</span>
                        <span>{finalAnalysis.total_clusters} thèmes</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {cleanSummaryText(finalAnalysis.global_summary)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
