'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { createClient } from '@/lib/supabase/client';
import type {
  WorkshopSession,
  WorkshopResponse,
  WorkshopAnalysis,
  LLMProvider,
  AnalysisResult,
  Cluster,
  ClusterExcerpt,
} from '@/types/workshop';
import { LLM_MODELS, getAllClusterExcerpts, hasSplitExcerpts } from '@/types/workshop';
import { ImportModal } from '@/components/workshop/import-modal';
import { ApiKeyStatusProvider } from '@/components/auth/require-api-key';
import { LlmModelSelect } from '@/components/ui/llm-model-select';

function uniqueParticipantCount(cluster: Cluster): number {
  return new Set(getAllClusterExcerpts(cluster).map((e) => e.response_id)).size;
}

function isProExcerpt(cluster: Cluster, ex: ClusterExcerpt): boolean {
  return (cluster.excerpts_pros ?? []).some(
    (p) => p.response_id === ex.response_id && p.excerpt === ex.excerpt
  );
}

/** Aperçu tooltip : jusqu’à 3 extraits (pros puis cons si format scindé) */
function tooltipPreviewExcerpts(cluster: Cluster): ClusterExcerpt[] {
  if (hasSplitExcerpts(cluster)) {
    return [
      ...(cluster.excerpts_pros ?? []).slice(0, 2),
      ...(cluster.excerpts_cons ?? []).slice(0, 2),
    ].slice(0, 3);
  }
  return getAllClusterExcerpts(cluster).slice(0, 3);
}

type Tab = 'clusters' | 'wordcloud' | 'raw';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildExportHtml(
  session: WorkshopSession,
  responses: WorkshopResponse[],
  analysis: AnalysisResult | null
): string {
  const title = escapeHtml(session.question);
  const date = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Section 1: Nuage de mots (Word cloud SVG)
  let wordCloudSection = '<p>Aucune analyse disponible. Lancez l\'analyse pour générer le nuage de mots.</p>';
  if (analysis && analysis.clusters.length > 0) {
    const layerData = analysis.clusters.map((c, i) => ({
      text: c.label,
      count: uniqueParticipantCount(c),
      clusterIndex: i,
      category: detectCategory(c.label),
    }));
    const { words: placed, bounds } = packWordsLineByLine(layerData, 24, 56);
    const pad = 40;
    const w = bounds.maxX - bounds.minX + pad * 2;
    const h = bounds.maxY - bounds.minY + pad * 2;
    const viewBox = `${bounds.minX - pad} ${bounds.minY - pad} ${w} ${h}`;
    const svgWords = placed
      .map((w) => {
        const color = CATEGORY_DEFS.find((c) => c.id === w.category)?.color ?? CATEGORY_DEFS[5].color;
        return `<text x="${w.cx}" y="${w.cy}" text-anchor="middle" dominant-baseline="central" style="font-size:${w.size}px;font-family:system-ui,sans-serif;font-weight:500;fill:${color}">${escapeHtml(w.text)}</text>`;
      })
      .join('');
    wordCloudSection = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="400" style="max-height:400px"><g>${svgWords}</g></svg>`;
  }

  // Section 2: Clusters
  let clustersSection = '<p>Aucune analyse disponible. Lancez l\'analyse pour générer les clusters.</p>';
  if (analysis && analysis.clusters.length > 0) {
    let clustersHtml = '';
    if (analysis.global_summary) {
      clustersHtml += `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;margin-bottom:24px">
        <h3 style="font-weight:600;margin:0 0 8px 0">Synthèse globale</h3>
        <p style="margin:0;font-size:14px;color:#333">${escapeHtml(analysis.global_summary)}</p>
        <p style="margin:8px 0 0 0;font-size:12px;color:#666">${analysis.total_participants} participant(s) — ${analysis.clusters.length} cluster(s) identifié(s)</p>
      </div>`;
    }
    analysis.clusters.forEach((cluster, idx) => {
      const count = uniqueParticipantCount(cluster);
      const pros = cluster.excerpts_pros ?? [];
      const cons = cluster.excerpts_cons ?? [];
      clustersHtml += `<div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:16px">
        <div style="padding:16px 20px;background:#fafafa;border-bottom:1px solid #e5e7eb">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#e0f2fe;color:#0284c7;font-size:14px;font-weight:600;margin-right:12px">${count}</span>
          <strong style="font-size:16px">${escapeHtml(cluster.label)}</strong>
        </div>
        <div style="padding:16px 20px">
          <p style="margin:0 0 12px 0;font-size:14px;color:#4b5563">${escapeHtml(cluster.summary)}</p>
          ${hasSplitExcerpts(cluster)
            ? `${pros.length > 0
                ? `<h4 style="font-size:11px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:0.05em;margin:16px 0 8px 0">Extraits positifs (${pros.length})</h4>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
            ${pros
              .map(
                (e) =>
                  `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;font-size:14px">
                <span style="font-weight:500">${escapeHtml(e.participant_name)}</span>
                <span style="color:#6b7280"> : </span>
                <span style="font-style:italic;color:#374151">"${escapeHtml(e.excerpt)}"</span>
              </div>`
              )
              .join('')}
          </div>`
                : ''}${cons.length > 0
                ? `<h4 style="font-size:11px;font-weight:600;color:#9a3412;text-transform:uppercase;letter-spacing:0.05em;margin:16px 0 8px 0">Limites / amélioration (${cons.length})</h4>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${cons
              .map(
                (e) =>
                  `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;font-size:14px">
                <span style="font-weight:500">${escapeHtml(e.participant_name)}</span>
                <span style="color:#6b7280"> : </span>
                <span style="font-style:italic;color:#374151">"${escapeHtml(e.excerpt)}"</span>
              </div>`
              )
              .join('')}
          </div>`
                : ''}`
            : `<h4 style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px 0">Extraits (${getAllClusterExcerpts(cluster).length})</h4>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${getAllClusterExcerpts(cluster)
              .map(
                (e) =>
                  `<div style="background:#f3f4f6;border-radius:8px;padding:12px 16px;font-size:14px">
                <span style="font-weight:500">${escapeHtml(e.participant_name)}</span>
                <span style="color:#6b7280"> : </span>
                <span style="font-style:italic;color:#374151">"${escapeHtml(e.excerpt)}"</span>
              </div>`
              )
              .join('')}
          </div>`}
        </div>
      </div>`;
    });
    clustersSection = clustersHtml;
  }

  // Section 3: Données brutes
  let rawSection = '<p>Aucune réponse pour le moment.</p>';
  if (responses.length > 0) {
    rawSection = `<table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#f3f4f6;border-bottom:1px solid #e5e7eb">
          <th style="text-align:left;padding:12px 16px;font-weight:500;color:#6b7280;width:160px">Participant</th>
          <th style="text-align:left;padding:12px 16px;font-weight:500;color:#6b7280">Réponse</th>
          <th style="text-align:left;padding:12px 16px;font-weight:500;color:#6b7280;width:100px">Date</th>
        </tr>
      </thead>
      <tbody>
        ${responses
          .map(
            (r) =>
              `<tr style="border-bottom:1px solid #e5e7eb">
            <td style="padding:12px 16px;font-weight:500;vertical-align:top">${escapeHtml(r.participant_name)}</td>
            <td style="padding:12px 16px;vertical-align:top;white-space:pre-wrap">${escapeHtml(r.response_text)}</td>
            <td style="padding:12px 16px;color:#6b7280;vertical-align:top;font-size:12px">${new Date(r.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>`;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Export Workshop - ${title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 32px; color: #111; line-height: 1.5; }
    h1 { font-size: 24px; margin: 0 0 8px 0; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 32px; }
    h2 { font-size: 18px; margin: 32px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #0284c7; color: #0284c7; }
    @media print { body { padding: 16px; } h2 { page-break-before: always; } h2:first-of-type { page-break-before: avoid; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">Export du ${date} — ${responses.length} réponse(s)</p>

  <h2>1. Nuage de mots</h2>
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:24px">${wordCloudSection}</div>

  <h2>2. Clusters</h2>
  <div style="margin-bottom:24px">${clustersSection}</div>

  <h2>3. Données brutes</h2>
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">${rawSection}</div>
</body>
</html>`;
}

export default function SessionViewWrapper() {
  return (
    <ApiKeyStatusProvider>
      <SessionView />
    </ApiKeyStatusProvider>
  );
}

function SessionView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [responses, setResponses] = useState<WorkshopResponse[]>([]);
  const [analysis, setAnalysis] = useState<WorkshopAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('wordcloud');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('gemini');
  const [showQR, setShowQR] = useState(true);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const participateUrl = `${baseUrl}/workshop/${sessionId}/participate`;

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

  // Supabase Realtime for live response updates + slow polling fallback
  useEffect(() => {
    if (loading) return;

    let realtimeActive = false;

    const channel = supabase
      .channel(`workshop-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workshop_responses',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          realtimeActive = true;
          if (payload.eventType === 'INSERT') {
            setResponses((prev) => {
              if (prev.some((r) => r.id === payload.new.id)) return prev;
              return [...prev, payload.new as WorkshopResponse];
            });
          } else if (payload.eventType === 'UPDATE') {
            setResponses((prev) =>
              prev.map((r) =>
                r.id === payload.new.id ? (payload.new as WorkshopResponse) : r
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loading, sessionId, supabase]);

  const ANALYSIS_STEPS = [
    'Extraction atomique des verbatims...',
    'Normalisation & Clustering...',
    'Synthèse par cluster...',
    'Résumé exécutif...',
  ];

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisStep(0);
    setError(null);

    const stepTimer = setInterval(() => {
      setAnalysisStep((prev) => Math.min(prev + 1, ANALYSIS_STEPS.length - 1));
    }, 12000);

    try {
      const res = await fetch('/api/workshop/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          provider: selectedProvider,
        }),
      });

      clearInterval(stepTimer);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await res.json();
      setAnalysis(data.analysis ?? { clusters: data.result });
      setActiveTab('wordcloud');
    } catch (e) {
      clearInterval(stepTimer);
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(participateUrl);
  };

  const handleDeleteSession = async () => {
    if (!sessionId) return;
    if (!confirm('Supprimer cette session ?')) return;
    setError(null);
    const res = await fetch(`/api/workshop/sessions/${sessionId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error || 'Suppression impossible');
      return;
    }
    router.push('/workshop');
  };

  const effectiveAnalysis: AnalysisResult | null = analysis
    ? (analysis.clusters as unknown as AnalysisResult)
    : null;

  const handleExport = useCallback(() => {
    const html = buildExportHtml(session!, responses, effectiveAnalysis);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workshop-${session?.question?.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-') || sessionId}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [session, sessionId, responses, effectiveAnalysis]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-10 flex justify-center py-20">
          <Spinner size="lg" className="size-8" />
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Session header — même structure que Analyse CSV */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => router.push('/workshop')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </button>
              <h1 className="text-xl font-bold text-foreground">{session.question}</h1>
              <p className="text-sm text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {responses.length} réponse{responses.length > 1 ? 's' : ''}
                </span>
                <span aria-hidden>·</span>
                <Badge
                  variant={session.status === 'active' ? 'default' : 'secondary'}
                >
                  {session.status === 'active' ? 'Active' : 'Fermée'}
                </Badge>
                <span aria-hidden>·</span>
                <span>
                  Créée le{' '}
                  {new Date(session.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <button
                  type="button"
                  onClick={fetchSession}
                  title="Rafraîchir les réponses"
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors inline-flex"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDeleteSession}>
              Supprimer
            </Button>
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
                    <Input
                      type="text"
                      readOnly
                      value={participateUrl}
                      className="flex-1 text-sm bg-muted text-muted-foreground"
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
                  Extraction, clustering et synthèse des réponses
                </p>
              </div>
              <div className="flex items-center gap-3">
                <LlmModelSelect
                  value={selectedProvider}
                  onChange={setSelectedProvider}
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing || responses.length === 0}
                >
                  {analyzing ? (
                    <>
                      <Spinner
                        size="sm"
                        className="mr-2 border-primary-foreground/30 border-t-primary-foreground"
                      />
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

            {/* Pipeline progress */}
            {analyzing && (
              <div className="mt-5 pt-5 border-t border-border">
                <div className="flex items-center gap-3">
                  {ANALYSIS_STEPS.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                        i < analysisStep
                          ? 'bg-primary text-primary-foreground'
                          : i === analysisStep
                            ? 'bg-primary/20 text-primary ring-2 ring-primary/40'
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {i < analysisStep ? (
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      {i < ANALYSIS_STEPS.length - 1 && (
                        <div className={`hidden sm:block w-8 h-0.5 ${i < analysisStep ? 'bg-primary' : 'bg-muted'}`} />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {ANALYSIS_STEPS[analysisStep]}
                </p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex items-center justify-between">
              <nav className="flex gap-1">
                {[
                  { id: 'wordcloud' as Tab, label: 'Nuage de mots' },
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
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setImportModalOpen(true)}
                  disabled={session.status === 'closed'}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashed border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  title={session.status === 'closed' ? 'Session fermée' : 'Importer des réponses (CSV, Excel, TXT)'}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Importer
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashed border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="Exporter les résultats (HTML)"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Exporter
                </button>
              </div>
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'clusters' && (
            <ClustersView
              result={effectiveAnalysis}
              analyzing={analyzing}
              responseCount={responses.length}
            />
          )}

          {activeTab === 'wordcloud' && (
            <WordCloudView
              result={effectiveAnalysis}
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

          <ImportModal
            isOpen={importModalOpen}
            onClose={() => setImportModalOpen(false)}
            sessionId={sessionId!}
            sessionQuestion={session.question}
            onImportSuccess={fetchSession}
          />
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
        <Spinner size="lg" className="mx-auto size-10 border-[3px]" />
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

type CategoryId = 'problem' | 'need' | 'idea' | 'question' | 'strength' | 'other';
type ColorMode = 'category' | 'readability';

const CATEGORY_DEFS: { id: CategoryId; label: string; color: string; pattern?: RegExp }[] = [
  {
    id: 'problem',
    label: 'Problèmes',
    color: 'oklch(0.6 0.22 25)',
    pattern: /problème|difficulté|obstacle|frein|blocage|risque|danger|menace|faiblesse|limite|contrainte|défi|challenge|pain|problem|souci|complex|insuffisan|inadapt|frustrat|tension|conflit/i,
  },
  {
    id: 'need',
    label: 'Besoins',
    color: 'oklch(0.6 0.19 250)',
    pattern: /besoin|nécessité|attente|demande|exigence|manque|priorité|need|requirement|indispensable|essentiel|fondamental|accès|accompagnement|ressource|support|formation/i,
  },
  {
    id: 'idea',
    label: 'Améliorations',
    color: 'oklch(0.62 0.19 150)',
    pattern: /amélioration|idée|suggestion|proposition|innovation|solution|opportunité|piste|recommandation|optimisation|evolution|idea|improvement|créat|développ|mise en place|renforcement|modernis/i,
  },
  {
    id: 'question',
    label: 'Questionnements',
    color: 'oklch(0.7 0.17 65)',
    pattern: /question|interrogation|incertitude|doute|clarification|compréhension|inquiry|pourquoi|comment|\?|réflexion|préoccupation/i,
  },
  {
    id: 'strength',
    label: 'Points forts',
    color: 'oklch(0.6 0.2 290)',
    pattern: /force|atout|avantage|succès|réussite|satisfaction|point fort|strength|positive|qualité|bénéfice|apprécié|efficac|fierté|motivation/i,
  },
  {
    id: 'other',
    label: 'Autre',
    color: 'oklch(0.6 0.12 230)',
  },
];

function detectCategory(text: string): CategoryId {
  for (const cat of CATEGORY_DEFS) {
    if (cat.pattern?.test(text)) return cat.id;
  }
  return 'other';
}

const READABILITY_PALETTE = [
  'oklch(0.55 0.22 25)',
  'oklch(0.50 0.2 250)',
  'oklch(0.55 0.2 150)',
  'oklch(0.60 0.20 310)',
];

interface LayoutWord {
  text: string;
  size: number;
  x: number;
  y: number;
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
  clusterIndex: number;
  category: CategoryId;
  readabilityColor: number;
}

const MIN_FONT = 24;
const MAX_FONT = 56;
const PROXIMITY = 20;

function getWordBox(w: LayoutWord): { l: number; r: number; t: number; b: number } {
  if (w.x0 != null && w.y0 != null && w.x1 != null && w.y1 != null) {
    return {
      l: w.x + w.x0 - PROXIMITY,
      r: w.x + w.x1 + PROXIMITY,
      t: w.y + w.y0 - PROXIMITY,
      b: w.y + w.y1 + PROXIMITY,
    };
  }
  const CHAR_W_RATIO = 0.58;
  const halfW = (w.text.length * w.size * CHAR_W_RATIO) / 2;
  const halfH = w.size * 0.65;
  return {
    l: w.x - halfW - PROXIMITY,
    r: w.x + halfW + PROXIMITY,
    t: w.y - halfH - PROXIMITY,
    b: w.y + halfH + PROXIMITY,
  };
}

function computeReadabilityColors(words: LayoutWord[]): number[] {
  const boxes = words.map((w) => getWordBox(w));
  const adj: Set<number>[] = words.map(() => new Set());
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t) {
        adj[i].add(j);
        adj[j].add(i);
      }
    }
  }

  const N = READABILITY_PALETTE.length;
  const colors = new Array<number>(words.length).fill(-1);
  const order = words.map((_, i) => i).sort((a, b) => adj[b].size - adj[a].size || words[b].size - words[a].size);
  for (const i of order) {
    const used = new Set<number>();
    for (const n of adj[i]) if (colors[n] >= 0) used.add(colors[n]);
    let c = 0;
    while (used.has(c) && c < N) c++;
    colors[i] = c % N;
  }
  return colors;
}

/** Couche par couche : mots ligne par ligne, du plus gros au plus petit, mesure Canvas précise */
function packWordsLineByLine<T extends { text: string; count: number }>(
  data: T[],
  minFont: number,
  maxFont: number
): { words: (T & { size: number; width: number; height: number; cx: number; cy: number })[]; bounds: { minX: number; maxX: number; minY: number; maxY: number } } {
  if (typeof document === 'undefined' || data.length === 0) {
    return { words: [], bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 } };
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const gapX = 32;
  const gapY = 20;
  const maxLineWidth = 1200;

  const maxCount = Math.max(...data.map((d) => d.count));
  const minCount = Math.min(...data.map((d) => d.count));
  const range = maxCount - minCount || 1;

  const words = data
    .map((d) => {
      const size = minFont + ((d.count - minCount) / range) * (maxFont - minFont);
      ctx.font = `500 ${size}px system-ui, -apple-system, sans-serif`;
      const width = ctx.measureText(d.text).width;
      const height = size * 1.2;
      return { ...d, size, width, height };
    })
    .sort((a, b) => b.size - a.size);

  const lines: { words: typeof words; width: number; height: number }[] = [];
  let currentLine = { words: [] as typeof words, width: 0, height: 0 };

  for (const word of words) {
    if (currentLine.words.length === 0) {
      currentLine.words.push(word);
      currentLine.width = word.width;
      currentLine.height = word.height;
    } else if (currentLine.width + gapX + word.width <= maxLineWidth) {
      currentLine.words.push(word);
      currentLine.width += gapX + word.width;
      currentLine.height = Math.max(currentLine.height, word.height);
    } else {
      lines.push(currentLine);
      currentLine = { words: [word], width: word.width, height: word.height };
    }
  }
  if (currentLine.words.length > 0) lines.push(currentLine);

  const placed: (T & { size: number; width: number; height: number; cx: number; cy: number })[] = [];
  let currentY = 0;
  let actualMaxWidth = 0;

  for (const line of lines) {
    actualMaxWidth = Math.max(actualMaxWidth, line.width);
    let currentX = -line.width / 2;
    const lineCenterY = currentY + line.height / 2;

    for (const word of line.words) {
      placed.push({
        ...word,
        cx: currentX + word.width / 2,
        cy: lineCenterY,
      });
      currentX += word.width + gapX;
    }
    currentY += line.height + gapY;
  }

  return {
    words: placed,
    bounds: {
      minX: -actualMaxWidth / 2,
      maxX: actualMaxWidth / 2,
      minY: 0,
      maxY: currentY - (lines.length > 0 ? gapY : 0),
    },
  };
}

function WordCloudView({
  result,
  analyzing,
  responseCount,
}: {
  result: AnalysisResult | null;
  analyzing: boolean;
  responseCount: number;
}) {
  /** Panneau plein détail (clic) — fixe à droite de la page, hors du cadre du nuage */
  const [pinnedClusterIndex, setPinnedClusterIndex] = useState<number | null>(null);
  /** Survol — tooltip d’origine à côté du mot */
  const [hoverClusterIndex, setHoverClusterIndex] = useState<number | null>(null);
  const [layoutWords, setLayoutWords] = useState<LayoutWord[]>([]);
  const [layoutBounds, setLayoutBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('category');
  const [soloCategory, setSoloCategory] = useState<CategoryId | null>(null);
  const [tooltipAnchor, setTooltipAnchor] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const focusClusterIndex = pinnedClusterIndex ?? hoverClusterIndex;

  useEffect(() => {
    if (!result) return;

    const clusters = result.clusters;
    const layerData = clusters.map((c, i) => ({
      text: c.label,
      count: uniqueParticipantCount(c),
      clusterIndex: i,
      category: detectCategory(c.label),
    }));

    const { words: placed, bounds } = packWordsLineByLine(layerData, MIN_FONT, MAX_FONT);
    const layoutWordsFromLayer: LayoutWord[] = placed.map((w) => ({
      text: w.text,
      size: w.size,
      x: w.cx,
      y: w.cy,
      x0: -w.width / 2,
      y0: -w.height / 2,
      x1: w.width / 2,
      y1: w.height / 2,
      clusterIndex: w.clusterIndex,
      category: w.category,
      readabilityColor: 0,
    }));
    const rColors = computeReadabilityColors(layoutWordsFromLayer);
    layoutWordsFromLayer.forEach((w, i) => { w.readabilityColor = rColors[i]; });
    setLayoutWords(layoutWordsFromLayer);
    setLayoutBounds(bounds);
  }, [result]);

  const activeCategories = useMemo(() => {
    const catSet = new Set(layoutWords.map((w) => w.category));
    return CATEGORY_DEFS.filter((c) => catSet.has(c.id));
  }, [layoutWords]);

  const bbox = useMemo(() => {
    if (layoutBounds) {
      const pad = 40;
      return {
        minX: layoutBounds.minX - pad,
        maxX: layoutBounds.maxX + pad,
        minY: layoutBounds.minY - pad,
        maxY: layoutBounds.maxY + pad,
        w: layoutBounds.maxX - layoutBounds.minX + pad * 2,
        h: layoutBounds.maxY - layoutBounds.minY + pad * 2,
      };
    }
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, w: 1, h: 1 };
  }, [layoutBounds]);

  const handleLegendClick = (catId: CategoryId) => {
    setSoloCategory((prev) => (prev === catId ? null : catId));
  };

  if (analyzing) {
    return (
      <div className="text-center py-16 space-y-4">
        <Spinner size="lg" className="mx-auto size-10 border-[3px]" />
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
            : `${responseCount} réponse${responseCount > 1 ? 's' : ''} reçue${responseCount > 1 ? 's' : ''}. Cliquez sur "Analyser les réponses" pour générer le nuage de mots.`}
        </p>
      </div>
    );
  }

  const clusters = result.clusters;

  const displayHeight = bbox.h;
  const viewBox = layoutBounds ? `${bbox.minX} ${bbox.minY} ${bbox.w} ${bbox.h}` : null;

  function getWordColor(word: LayoutWord): string {
    if (colorMode === 'category') {
      return CATEGORY_DEFS.find((c) => c.id === word.category)?.color ?? CATEGORY_DEFS[5].color;
    }
    return READABILITY_PALETTE[word.readabilityColor] ?? READABILITY_PALETTE[0];
  }

  function isWordVisible(word: LayoutWord): boolean {
    if (colorMode !== 'category' || soloCategory === null) return true;
    return word.category === soloCategory;
  }

  return (
    <div className="space-y-3">
      {/* Options : Par type / Lisibilité */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
          {([
            { id: 'category' as ColorMode, label: 'Par type' },
            { id: 'readability' as ColorMode, label: 'Lisibilité' },
          ]).map((mode) => (
            <button
              key={mode.id}
              onClick={() => { setColorMode(mode.id); setSoloCategory(null); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                colorMode === mode.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {colorMode === 'category' && activeCategories.length > 1 && (
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
            {activeCategories.map((cat) => {
              const isActive = soloCategory === null || soloCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleLegendClick(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                    soloCategory === cat.id
                      ? 'border-foreground/20 bg-foreground/5 text-foreground'
                      : soloCategory === null
                        ? 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        : 'border-transparent text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 transition-opacity"
                    style={{
                      backgroundColor: cat.color,
                      opacity: isActive ? 1 : 0.3,
                    }}
                  />
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Nuage — taille inchangée (pas de flex avec le panneau) */}
      <div
        ref={containerRef}
        className="bg-card rounded-2xl border border-border relative overflow-visible flex justify-center"
        style={{
          height: `${displayHeight || 400}px`,
          minHeight: 400,
          maxHeight: 'min(80vh, 800px)',
        }}
        onClick={() => {
          setPinnedClusterIndex(null);
          setHoverClusterIndex(null);
          setTooltipAnchor(null);
        }}
      >
        {viewBox ? (
          <svg
            width="100%"
            height="100%"
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            className="max-h-[600px]"
          >
            <g>
              {layoutWords.map((word) => {
                const cluster = clusters[word.clusterIndex];
                const isFocused = focusClusterIndex === word.clusterIndex;
                const isDimmed = focusClusterIndex !== null && !isFocused;
                const visible = isWordVisible(word);

                return (
                  <g
                    key={word.clusterIndex}
                    style={{ cursor: 'pointer', pointerEvents: visible ? 'auto' : 'none' }}
                    onMouseEnter={(e) => {
                      if (!visible) return;
                      setHoverClusterIndex(word.clusterIndex);
                      const el = e.currentTarget as SVGGElement;
                      const container = containerRef.current;
                      if (!el || !container) return;
                      const rect = el.getBoundingClientRect();
                      const containerRect = container.getBoundingClientRect();
                      const TOOLTIP_W = 288;
                      const TOOLTIP_H_EST = 280;
                      const GAP = 12;
                      const spaceRight = containerRect.right - rect.right;
                      const spaceLeft = rect.left - containerRect.left;
                      const side = spaceRight >= TOOLTIP_W + GAP || spaceRight >= spaceLeft ? 'right' : 'left';
                      const x = side === 'right' ? rect.right - containerRect.left + GAP : rect.left - containerRect.left - TOOLTIP_W - GAP;
                      let y = rect.top - containerRect.top + rect.height / 2;
                      y = Math.max(TOOLTIP_H_EST / 2, Math.min(containerRect.height - TOOLTIP_H_EST / 2, y));
                      setTooltipAnchor({ x, y });
                    }}
                    onMouseLeave={() => {
                      setHoverClusterIndex(null);
                      setTooltipAnchor(null);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!visible) return;
                      setPinnedClusterIndex((prev) =>
                        prev === word.clusterIndex ? null : word.clusterIndex
                      );
                      setHoverClusterIndex(null);
                      setTooltipAnchor(null);
                    }}
                  >
                    <text
                      x={word.x}
                      y={word.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{
                        fontSize: `${word.size}px`,
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: 500,
                        fill: getWordColor(word),
                        opacity: !visible ? 0.06 : isDimmed ? 0.15 : 0.9,
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      {word.text}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        ) : null}
        {hoverClusterIndex !== null &&
          tooltipAnchor &&
          (() => {
            const cluster = clusters[hoverClusterIndex];
            if (!cluster) return null;
            return (
              <div
                className="absolute z-50 w-72 bg-card rounded-xl border border-border shadow-xl"
                style={{
                  left: tooltipAnchor.x,
                  top: tooltipAnchor.y,
                  transform: 'translateY(-50%)',
                  padding: '16px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                    {uniqueParticipantCount(cluster)}
                  </span>
                  <h3 className="font-semibold text-foreground text-sm truncate">
                    {cluster.label}
                  </h3>
                </div>
                <p
                  className="text-xs text-muted-foreground leading-relaxed mb-3"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {cluster.summary}
                </p>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Extraits ({getAllClusterExcerpts(cluster).length})
                  </h4>
                  {tooltipPreviewExcerpts(cluster).map((excerpt, i) => (
                    <div
                      key={`${excerpt.response_id}-${i}`}
                      className={`rounded-md px-3 py-2 text-xs ${
                        hasSplitExcerpts(cluster)
                          ? isProExcerpt(cluster, excerpt)
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : 'bg-orange-500/10 border border-orange-500/20'
                          : 'bg-muted/50'
                      }`}
                    >
                      {hasSplitExcerpts(cluster) && (
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide block mb-0.5 ${
                            isProExcerpt(cluster, excerpt) ? 'text-emerald-700' : 'text-orange-800'
                          }`}
                        >
                          {isProExcerpt(cluster, excerpt) ? 'Pros' : 'Cons'}
                        </span>
                      )}
                      <span className="font-medium text-foreground">{excerpt.participant_name}</span>
                      <span className="text-muted-foreground"> : </span>
                      <span
                        className="text-foreground/80 italic"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        &quot;{excerpt.excerpt}&quot;
                      </span>
                    </div>
                  ))}
                  {getAllClusterExcerpts(cluster).length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{getAllClusterExcerpts(cluster).length - 3} extrait
                      {getAllClusterExcerpts(cluster).length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
      </div>

      {/* Panneau détail : hors du cadre du nuage, glisse depuis la droite (viewport) */}
      {pinnedClusterIndex !== null &&
        (() => {
          const cluster = clusters[pinnedClusterIndex];
          if (!cluster) return null;
          const pros = cluster.excerpts_pros ?? [];
          const cons = cluster.excerpts_cons ?? [];
          return (
            <aside
              className="fixed top-0 right-0 z-[110] h-dvh w-full max-w-md flex flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-300"
              onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-border flex items-start justify-between gap-2 shrink-0">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                      {uniqueParticipantCount(cluster)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground text-sm leading-snug">
                        {cluster.label}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getAllClusterExcerpts(cluster).length} extrait
                        {getAllClusterExcerpts(cluster).length > 1 ? 's' : ''}
                        {hasSplitExcerpts(cluster) && (
                          <span className="block text-[11px] mt-0.5">
                            {pros.length} pros · {cons.length} cons
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPinnedClusterIndex(null)}
                    className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    aria-label="Fermer"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Résumé du cluster
                    </h4>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {cluster.summary}
                    </p>
                  </div>
                  {hasSplitExcerpts(cluster) ? (
                    <>
                      {pros.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2">
                            Extraits positifs ({pros.length})
                          </h4>
                          <ul className="space-y-3">
                            {pros.map((excerpt, i) => (
                              <li
                                key={`pro-${excerpt.response_id}-${i}`}
                                className="bg-emerald-500/10 rounded-lg border border-emerald-500/25 px-3 py-3 text-sm"
                              >
                                <span className="font-medium text-foreground">{excerpt.participant_name}</span>
                                <span className="text-muted-foreground"> : </span>
                                <span className="text-foreground/85 italic whitespace-pre-wrap block mt-1 pl-0">
                                  &quot;{excerpt.excerpt}&quot;
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {cons.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-orange-900 uppercase tracking-wider mb-2">
                            Limites / amélioration ({cons.length})
                          </h4>
                          <ul className="space-y-3">
                            {cons.map((excerpt, i) => (
                              <li
                                key={`con-${excerpt.response_id}-${i}`}
                                className="bg-orange-500/10 rounded-lg border border-orange-500/25 px-3 py-3 text-sm"
                              >
                                <span className="font-medium text-foreground">{excerpt.participant_name}</span>
                                <span className="text-muted-foreground"> : </span>
                                <span className="text-foreground/85 italic whitespace-pre-wrap block mt-1 pl-0">
                                  &quot;{excerpt.excerpt}&quot;
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Tous les extraits ({getAllClusterExcerpts(cluster).length})
                      </h4>
                      <ul className="space-y-3">
                        {getAllClusterExcerpts(cluster).map((excerpt, i) => (
                          <li
                            key={`${excerpt.response_id}-${i}`}
                            className="bg-muted/40 rounded-lg border border-border px-3 py-3 text-sm"
                          >
                            <span className="font-medium text-foreground">{excerpt.participant_name}</span>
                            <span className="text-muted-foreground"> : </span>
                            <span className="text-foreground/85 italic whitespace-pre-wrap block mt-1 pl-0">
                              &quot;{excerpt.excerpt}&quot;
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
            </aside>
          );
        })()}
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
  const pros = cluster.excerpts_pros ?? [];
  const cons = cluster.excerpts_cons ?? [];

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
            {uniqueParticipantCount(cluster)}
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

          {hasSplitExcerpts(cluster) ? (
            <div className="space-y-4">
              {pros.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Extraits positifs ({pros.length})
                  </h4>
                  {pros.map((excerpt, i) => (
                    <div
                      key={`pro-${i}`}
                      className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-foreground">{excerpt.participant_name}</span>
                      <span className="text-muted-foreground"> : </span>
                      <span className="text-foreground/80 italic">&quot;{excerpt.excerpt}&quot;</span>
                    </div>
                  ))}
                </div>
              )}
              {cons.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-orange-900 uppercase tracking-wider">
                    Limites / amélioration ({cons.length})
                  </h4>
                  {cons.map((excerpt, i) => (
                    <div
                      key={`con-${i}`}
                      className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-foreground">{excerpt.participant_name}</span>
                      <span className="text-muted-foreground"> : </span>
                      <span className="text-foreground/80 italic">&quot;{excerpt.excerpt}&quot;</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Extraits ({getAllClusterExcerpts(cluster).length})
              </h4>
              {getAllClusterExcerpts(cluster).map((excerpt, i) => (
                <div key={i} className="bg-muted/50 rounded-lg px-4 py-3 text-sm">
                  <span className="font-medium text-foreground">{excerpt.participant_name}</span>
                  <span className="text-muted-foreground"> : </span>
                  <span className="text-foreground/80 italic">&quot;{excerpt.excerpt}&quot;</span>
                </div>
              ))}
            </div>
          )}
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
