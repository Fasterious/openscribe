'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { PersonaDataTable } from '@/components/persona/data-table';
import { RadarViz } from '@/components/persona/radar-viz';
import { LikertScales } from '@/components/persona/likert-scales';
import { HeatmapViz } from '@/components/persona/heatmap-viz';
import { CorrelationViz } from '@/components/persona/correlation-viz';
import { InteractiveLegend, useClusterFilter } from '@/components/persona/interactive-legend';
import { generatePersonaCSV } from '@/lib/persona/clustering';
import type { PersonaSession, PersonaAnalysisResult, PersonaRespondent } from '@/types/persona';
import type { User } from '@supabase/supabase-js';

type Tab = 'results' | 'data' | 'correlation' | 'viz';

export default function PersonaAnalysisPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<PersonaSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('viz');
  const filter = useClusterFilter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!analysisId) return;
    fetch(`/api/persona/sessions/${analysisId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.session) setSession(data.session);
      })
      .finally(() => setLoading(false));
  }, [analysisId]);

  const result: PersonaAnalysisResult | null = session?.analysis_result ?? null;

  const allRespondents: PersonaRespondent[] = useMemo(() => {
    if (!result) return [];
    return result.clusters.flatMap((c) => c.members);
  }, [result]);

  const clusterMap = useMemo(() => {
    const map = new Map<string, { color: string; label: string }>();
    result?.clusters.forEach((c) =>
      c.members.forEach((m) => map.set(m.id, { color: c.color, label: c.label }))
    );
    return map;
  }, [result]);

  const orderedFromClusters = useMemo(() => {
    if (!result) return [];
    return result.clusters.flatMap((c) =>
      [...c.members].sort((a, b) => {
        const na = parseInt(a.id.replace(/\D/g, '')) || 0;
        const nb = parseInt(b.id.replace(/\D/g, '')) || 0;
        return na - nb;
      })
    );
  }, [result]);

  const downloadCSV = () => {
    if (!result) return;
    const csv = generatePersonaCSV(result.clusters, result.columnNames);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personas_${session?.filename ?? 'analysis'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session || !result) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <p className="text-muted-foreground">Analyse introuvable.</p>
          <Button variant="outline" onClick={() => router.push('/persona')}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'results', label: 'Resultats' },
    { id: 'data', label: 'Donnees' },
    { id: 'correlation', label: 'Correlations' },
    { id: 'viz', label: 'Visualisations' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">{session.filename}</h1>
            <p className="text-[13px] text-muted-foreground">
              {session.respondent_count} repondants · {session.cluster_count} clusters · {new Date(session.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadCSV}>Telecharger CSV</Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/persona')}>Retour</Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <nav className="flex border-b border-border px-4 gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-[13px] border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-foreground font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="p-5">
            {activeTab === 'results' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {result.clusters.length} personas identifiees
                  </h3>
                  <span className="text-[12px] text-muted-foreground">
                    k optimal = {result.optimalK}
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap mb-4">
                  {result.silhouetteScores
                    .sort((a, b) => a.k - b.k)
                    .map((s) => (
                      <div
                        key={s.k}
                        className={`px-3 py-1.5 rounded-lg text-[12px] border ${
                          s.k === result.clusters.length
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        k={s.k}: {s.score.toFixed(3)}
                      </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.clusters.map((c, ci) => (
                    <div key={ci} className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: c.color }} />
                      <p className="text-[13px] font-medium text-foreground">{c.label}</p>
                      <p className="text-[12px] text-muted-foreground mt-1">{c.members.length} membres</p>
                      {c.signatureVars.length > 0 && (
                        <div className="mt-3 flex flex-wrap justify-center gap-1">
                          {c.signatureVars.map((sv) => (
                            <span
                              key={sv.varIdx}
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                                sv.direction === 'high'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : sv.direction === 'low'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}
                            >
                              {sv.columnName} {sv.direction === 'high' ? '\u2191' : sv.direction === 'low' ? '\u2193' : '~'}{sv.avgVal}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <PersonaDataTable
                data={orderedFromClusters}
                columnNames={result.columnNames}
                clusterInfo={clusterMap}
              />
            )}

            {activeTab === 'correlation' && (
              <CorrelationViz
                correlationData={result.correlationData}
                respondents={allRespondents}
                clusterMap={clusterMap}
                columnNames={result.columnNames}
              />
            )}

            {activeTab === 'viz' && (
              <div className="space-y-4">
                <InteractiveLegend clusters={result.clusters} filter={filter} />
                <RadarViz clusters={result.clusters} columnNames={result.columnNames} filter={filter} />
                <LikertScales clusters={result.clusters} columnNames={result.columnNames} filter={filter} />
                <HeatmapViz clusters={result.clusters} columnNames={result.columnNames} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
