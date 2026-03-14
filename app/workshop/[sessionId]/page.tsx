'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type {
  WorkshopSession,
  WorkshopResponse,
  WorkshopAnalysis,
  LLMProvider,
  AnalysisResult,
  Cluster,
} from '@/types/workshop';
import { LLM_MODELS } from '@/types/workshop';

type Tab = 'clusters' | 'raw';

export default function SessionView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const supabase = createClient();

  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [responses, setResponses] = useState<WorkshopResponse[]>([]);
  const [analysis, setAnalysis] = useState<WorkshopAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('clusters');
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('gemini');
  const [showQR, setShowQR] = useState(true);

  const participateUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/workshop/${sessionId}/participate`
      : '';

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/workshop/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Session not found');
      const data = await res.json();
      setSession(data.session);
      setResponses(data.responses);
      setAnalysis(data.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Supabase Realtime: live response updates
  useEffect(() => {
    const channel = supabase
      .channel(`workshop-responses-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workshop_responses',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setResponses((prev) => {
            if (prev.some((r) => r.id === payload.new.id)) return prev;
            return [...prev, payload.new as WorkshopResponse];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workshop_responses',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setResponses((prev) =>
            prev.map((r) =>
              r.id === payload.new.id ? (payload.new as WorkshopResponse) : r
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/workshop/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          provider: selectedProvider,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await res.json();
      setAnalysis(data.analysis ?? { clusters: data.result });
      setActiveTab('clusters');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(participateUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-10 flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </main>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-10">
          <div className="max-w-md mx-auto text-center py-20">
            <p className="text-destructive">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!session) return null;

  const analysisResult: AnalysisResult | null = analysis
    ? (analysis.clusters as unknown as AnalysisResult)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Session header */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <a
                href="/workshop"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-3"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </a>
              <h1 className="text-xl font-bold text-foreground">
                {session.question}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {responses.length} réponse{responses.length > 1 ? 's' : ''}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    session.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {session.status === 'active' ? 'Active' : 'Fermée'}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code section */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                Partager avec les participants
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQR(!showQR)}
              >
                {showQR ? 'Masquer' : 'Afficher'} le QR code
              </Button>
            </div>

            {showQR && (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="bg-white p-4 rounded-xl border border-border">
                  <QRCodeSVG
                    value={participateUrl}
                    size={180}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Les participants scannent ce QR code pour accéder à la session
                    et répondre à votre question.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={participateUrl}
                      className="flex-1 text-sm bg-muted rounded-lg px-3 py-2 text-muted-foreground border border-border"
                    />
                    <Button variant="outline" size="sm" onClick={copyLink}>
                      Copier
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analysis controls */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-foreground">Analyse</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Clusterisez les réponses pour identifier les tendances
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedProvider}
                  onChange={(e) =>
                    setSelectedProvider(e.target.value as LLMProvider)
                  }
                  className="text-sm rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {(Object.entries(LLM_MODELS) as [LLMProvider, { label: string }][]).map(
                    ([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    )
                  )}
                </select>
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing || responses.length === 0}
                >
                  {analyzing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Analyser les réponses
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border">
            <nav className="flex gap-1">
              {[
                { id: 'clusters' as Tab, label: 'Clusters' },
                { id: 'raw' as Tab, label: 'Données brutes' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          {activeTab === 'clusters' && (
            <ClustersView
              result={analysisResult}
              analyzing={analyzing}
              responseCount={responses.length}
            />
          )}

          {activeTab === 'raw' && <RawDataView responses={responses} />}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ClustersView({
  result,
  analyzing,
  responseCount,
}: {
  result: AnalysisResult | null;
  analyzing: boolean;
  responseCount: number;
}) {
  if (analyzing) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">
          Analyse de {responseCount} réponse{responseCount > 1 ? 's' : ''} en
          cours...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>
          {responseCount === 0
            ? 'En attente de réponses des participants...'
            : `${responseCount} réponse${responseCount > 1 ? 's' : ''} reçue${responseCount > 1 ? 's' : ''}. Cliquez sur "Analyser les réponses" pour générer les clusters.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global summary */}
      {result.global_summary && (
        <div className="bg-primary/5 rounded-2xl border border-primary/20 p-5">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Synthèse globale
          </h3>
          <p className="text-sm text-foreground/80">{result.global_summary}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {result.total_participants} participant{result.total_participants > 1 ? 's' : ''} —{' '}
            {result.clusters.length} cluster{result.clusters.length > 1 ? 's' : ''} identifié{result.clusters.length > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Clusters */}
      {result.clusters.map((cluster: Cluster, idx: number) => (
        <ClusterCard key={idx} cluster={cluster} index={idx} />
      ))}
    </div>
  );
}

function ClusterCard({
  cluster,
  index,
}: {
  cluster: Cluster;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index < 3);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
            {cluster.participant_count}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {cluster.label}
            </h3>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">{cluster.summary}</p>

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Extraits ({cluster.excerpts.length})
            </h4>
            {cluster.excerpts.map((excerpt, i) => (
              <div
                key={i}
                className="bg-muted/50 rounded-lg px-4 py-3 text-sm"
              >
                <span className="font-medium text-foreground">
                  {excerpt.participant_name}
                </span>
                <span className="text-muted-foreground"> : </span>
                <span className="text-foreground/80 italic">
                  &quot;{excerpt.excerpt}&quot;
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RawDataView({ responses }: { responses: WorkshopResponse[] }) {
  if (responses.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        En attente de réponses des participants...
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-40">
                Participant
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Réponse
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-36">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {responses.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground align-top">
                  {r.participant_name}
                </td>
                <td className="px-4 py-3 text-foreground/80 align-top whitespace-pre-wrap">
                  {r.response_text}
                </td>
                <td className="px-4 py-3 text-muted-foreground align-top text-xs">
                  {new Date(r.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
