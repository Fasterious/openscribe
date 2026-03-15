'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

type Tab = 'clusters' | 'wordcloud' | 'raw';

export default function SessionView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const supabase = createClient();

  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [responses, setResponses] = useState<WorkshopResponse[]>([]);
  const [analysis, setAnalysis] = useState<WorkshopAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('wordcloud');
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('gemini');
  const [showQR, setShowQR] = useState(true);

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
      setActiveTab('wordcloud');
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
                <button
                  onClick={fetchSession}
                  title="Rafraîchir les réponses"
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
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
          </div>

          {/* Tab content */}
          {activeTab === 'clusters' && (
            <ClustersView
              result={analysisResult}
              analyzing={analyzing}
              responseCount={responses.length}
            />
          )}

          {activeTab === 'wordcloud' && (
            <WordCloudView
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
  'oklch(0.58 0.22 25)',
  'oklch(0.55 0.2 250)',
  'oklch(0.58 0.2 150)',
  'oklch(0.65 0.18 310)',
];

interface LayoutWord {
  text: string;
  size: number;
  x: number;
  y: number;
  clusterIndex: number;
  category: CategoryId;
  readabilityColor: number;
}

const CANONICAL_W = 800;
const CANONICAL_H = 420;

function computeReadabilityColors(words: LayoutWord[]): number[] {
  const CHAR_W_RATIO = 0.55;
  const boxes = words.map((w) => {
    const halfW = (w.text.length * w.size * CHAR_W_RATIO) / 2;
    const halfH = w.size / 2;
    return { l: w.x - halfW, r: w.x + halfW, t: w.y - halfH, b: w.y + halfH };
  });

  const GAP = 4;
  const adj: Set<number>[] = words.map(() => new Set());
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.l - GAP < b.r && a.r + GAP > b.l && a.t - GAP < b.b && a.b + GAP > b.t) {
        adj[i].add(j);
        adj[j].add(i);
      }
    }
  }

  const colors = new Array<number>(words.length).fill(-1);
  const order = words.map((_, i) => i).sort((a, b) => words[b].size - words[a].size);
  for (const i of order) {
    const used = new Set<number>();
    for (const n of adj[i]) if (colors[n] >= 0) used.add(colors[n]);
    let c = 0;
    while (used.has(c)) c++;
    colors[i] = c % READABILITY_PALETTE.length;
  }
  return colors;
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [layoutWords, setLayoutWords] = useState<LayoutWord[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [colorMode, setColorMode] = useState<ColorMode>('category');
  const [soloCategory, setSoloCategory] = useState<CategoryId | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!result) return;

    const clusters = result.clusters;
    const maxCount = Math.max(...clusters.map((c) => c.participant_count));
    const minCount = Math.min(...clusters.map((c) => c.participant_count));
    const range = maxCount - minCount || 1;

    const words = clusters
      .map((c, i) => {
        const t = (c.participant_count - minCount) / range;
        return {
          text: c.label,
          size: 16 + t * 40,
          clusterIndex: i,
          category: detectCategory(c.label),
        };
      })
      .sort((a, b) => b.size - a.size);

    let cancelled = false;

    type CloudWord = (typeof words)[0] & { x?: number; y?: number; rotate?: number };

    import('d3-cloud').then(({ default: cloudLayout }) => {
      if (cancelled) return;

      cloudLayout<CloudWord>()
        .size([CANONICAL_W, CANONICAL_H])
        .words(words.map((w) => ({ ...w })) as CloudWord[])
        .padding(6)
        .rotate(0)
        .font('system-ui, -apple-system, sans-serif')
        .fontSize((d) => d.size!)
        .spiral('archimedean')
        .random(() => 0.5)
        .on('end', (output) => {
          if (cancelled) return;
          const placed = output
            .filter((w) => w.x !== undefined && w.y !== undefined)
            .map((w) => ({
              text: w.text!,
              size: w.size!,
              x: w.x!,
              y: w.y!,
              clusterIndex: w.clusterIndex,
              category: w.category,
              readabilityColor: 0,
            }));

          const rColors = computeReadabilityColors(placed);
          placed.forEach((w, i) => { w.readabilityColor = rColors[i]; });

          setLayoutWords(placed);
        })
        .start();
    });

    return () => { cancelled = true; };
  }, [result]);

  const activeCategories = useMemo(() => {
    const catSet = new Set(layoutWords.map((w) => w.category));
    return CATEGORY_DEFS.filter((c) => catSet.has(c.id));
  }, [layoutWords]);

  const handleLegendClick = (catId: CategoryId) => {
    setSoloCategory((prev) => (prev === catId ? null : catId));
  };

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

  const clusters = result.clusters;
  const scale = containerWidth > 0 ? containerWidth / CANONICAL_W : 1;
  const displayHeight = CANONICAL_H * scale;

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
      {/* Toggle */}
      <div className="flex items-center justify-between">
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

      {/* Cloud */}
      <div
        ref={containerRef}
        className="bg-card rounded-2xl border border-border relative overflow-visible"
        style={{ height: `${displayHeight || 400}px` }}
        onClick={() => setActiveIndex(null)}
      >
        {layoutWords.map((word) => {
          const cluster = clusters[word.clusterIndex];
          const isActive = activeIndex === word.clusterIndex;
          const isDimmed = activeIndex !== null && !isActive;
          const visible = isWordVisible(word);

          return (
            <div
              key={word.clusterIndex}
              className="absolute"
              style={{
                left: `${(CANONICAL_W / 2 + word.x) * scale}px`,
                top: `${(CANONICAL_H / 2 + word.y) * scale}px`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: visible ? 'auto' : 'none',
              }}
              onMouseEnter={() => visible && setActiveIndex(word.clusterIndex)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (!visible) return;
                setActiveIndex((prev) =>
                  prev === word.clusterIndex ? null : word.clusterIndex
                );
              }}
            >
              <span
                className="cursor-pointer inline-block select-none whitespace-nowrap"
                style={{
                  fontSize: `${word.size * scale}px`,
                  fontWeight: word.size > 36 ? 800 : word.size > 24 ? 700 : 600,
                  color: getWordColor(word),
                  opacity: !visible ? 0.06 : isDimmed ? 0.15 : 0.9,
                  transform: `scale(${isActive ? 1.08 : 1})`,
                  transition: 'opacity 0.3s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  lineHeight: 1,
                }}
              >
                {word.text}
              </span>

              {isActive && cluster && visible && (
                <div
                  className="absolute z-50 w-72 bg-card rounded-xl border border-border shadow-xl"
                  style={{
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '14px',
                    padding: '16px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="absolute w-3 h-3 bg-card border-b border-r border-border"
                    style={{
                      bottom: '-7px',
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                    }}
                  />

                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                      {cluster.participant_count}
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
                      Extraits ({cluster.excerpts.length})
                    </h4>
                    {cluster.excerpts.slice(0, 3).map((excerpt, i) => (
                      <div
                        key={i}
                        className="bg-muted/50 rounded-md px-3 py-2 text-xs"
                      >
                        <span className="font-medium text-foreground">
                          {excerpt.participant_name}
                        </span>
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
                    {cluster.excerpts.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{cluster.excerpts.length - 3} extrait
                        {cluster.excerpts.length - 3 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
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
