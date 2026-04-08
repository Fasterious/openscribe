'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { ColumnSelector, type ColumnInfo } from '@/components/persona/column-selector';
import { PersonaDataTable } from '@/components/persona/data-table';
import type { PersonaRespondent } from '@/types/persona';
import { runPersonaClustering, generatePersonaCSV } from '@/lib/persona/clustering';
import type { PersonaAnalysisResult } from '@/types/persona';
import type { User } from '@supabase/supabase-js';

interface UploadData {
  filename: string;
  headers: string[];
  rows: Record<string, string>[];
  total_rows: number;
}

type Step = 'columns' | 'preview' | 'running' | 'done';

export default function PersonaNewAnalysis() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<number[]>([]);
  const [step, setStep] = useState<Step>('columns');
  const [clusterCount, setClusterCount] = useState<number | 'auto'>('auto');
  const [result, setResult] = useState<PersonaAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [idColumn, setIdColumn] = useState<number>(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('persona_upload');
    if (!raw) {
      router.push('/persona');
      return;
    }
    try {
      setUploadData(JSON.parse(raw));
    } catch {
      router.push('/persona');
    }
  }, [router]);

  const columns: ColumnInfo[] = useMemo(() => {
    if (!uploadData) return [];
    return uploadData.headers.map((name, index) => {
      const values = uploadData.rows.map((r) => r[name] ?? '');
      const numericValues = values.filter((v) => v !== '' && !isNaN(Number(v)));
      const isNumeric = numericValues.length > values.length * 0.7;
      const uniqueValues = new Set(values).size;
      return { index, name, sampleValues: values.slice(0, 5), isNumeric, uniqueValues };
    });
  }, [uploadData]);

  // Auto-select numeric Likert-like columns on first load
  useEffect(() => {
    if (columns.length > 0 && selectedColumns.length === 0) {
      const numeric = columns
        .filter((c) => c.isNumeric && c.uniqueValues <= 10)
        .map((c) => c.index);
      if (numeric.length > 0) setSelectedColumns(numeric);
    }
  }, [columns]);

  const respondents: PersonaRespondent[] = useMemo(() => {
    if (!uploadData || selectedColumns.length === 0) return [];
    const headers = uploadData.headers;
    const idHeader = headers[idColumn];
    return uploadData.rows
      .map((row, i) => {
        let hasNaN = false;
        const values = selectedColumns.map((ci) => {
          const raw = row[headers[ci]];
          if (raw === '' || raw === undefined || raw === null) { hasNaN = true; return 0; }
          const v = Number(raw);
          if (isNaN(v)) { hasNaN = true; return 0; }
          return v;
        });
        if (hasNaN) return null;
        return {
          id: row[idHeader] || `R${i + 1}`,
          values,
        };
      })
      .filter((r): r is PersonaRespondent => r !== null);
  }, [uploadData, selectedColumns, idColumn]);

  const columnNames = useMemo(
    () => selectedColumns.map((ci) => uploadData?.headers[ci] ?? `C${ci + 1}`),
    [selectedColumns, uploadData]
  );

  const handleAutoDetect = useCallback(async () => {
    if (!uploadData) return;
    setAutoDetecting(true);
    try {
      const res = await fetch('/api/persona/recommend-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers: uploadData.headers,
          sample_rows: uploadData.rows.slice(0, 5),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.recommended_indices)) {
          setSelectedColumns(data.recommended_indices);
        }
      }
    } catch {
      // Fallback: silent
    } finally {
      setAutoDetecting(false);
    }
  }, [uploadData]);

  const runAnalysis = useCallback(async () => {
    if (respondents.length < 4) {
      setError('Il faut au moins 4 repondants valides pour lancer l\'analyse.');
      return;
    }
    setStep('running');
    setError(null);

    try {
      await new Promise((r) => setTimeout(r, 50));
      const k = clusterCount === 'auto' ? undefined : clusterCount;
      const analysisResult = runPersonaClustering(respondents, columnNames, k);
      setResult(analysisResult);
      setStep('done');

      if (user) {
        try {
          await fetch('/api/persona/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: uploadData?.filename ?? 'unknown',
              column_names: columnNames,
              selected_columns: selectedColumns,
              respondent_count: respondents.length,
              cluster_count: analysisResult.clusters.length,
              analysis_result: analysisResult,
            }),
          });
        } catch {
          // Non-blocking save
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setStep('preview');
    }
  }, [respondents, columnNames, clusterCount, user, uploadData, selectedColumns]);

  const downloadCSV = useCallback(() => {
    if (!result) return;
    const csv = generatePersonaCSV(result.clusters, result.columnNames);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personas_${uploadData?.filename ?? 'analysis'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, uploadData]);

  if (!uploadData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">{uploadData.filename}</h1>
            <p className="text-[13px] text-muted-foreground">
              {uploadData.total_rows} lignes · {uploadData.headers.length} colonnes
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/persona')}>
            Retour
          </Button>
        </div>

        {/* Steps */}
        <div className="flex gap-2 mb-6">
          {(['columns', 'preview', 'done'] as const).map((s, i) => {
            const labels = ['1. Colonnes', '2. Apercu', '3. Resultats'];
            const isCurrent = step === s || (step === 'running' && s === 'preview');
            const isDone = (step === 'preview' && i === 0) || (step === 'done' && i < 2) || (step === 'running' && i === 0);
            return (
              <div
                key={s}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium ${
                  isCurrent ? 'bg-primary text-primary-foreground' : isDone ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}
              >
                {labels[i]}
              </div>
            );
          })}
        </div>

        {/* Step 1: Column selection */}
        {step === 'columns' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <label className="text-[13px] font-medium text-foreground block mb-2">
                Colonne d&apos;identifiant des repondants
              </label>
              <select
                value={idColumn}
                onChange={(e) => setIdColumn(Number(e.target.value))}
                className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {uploadData.headers.map((h, i) => (
                  <option key={i} value={i}>{h}</option>
                ))}
              </select>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <ColumnSelector
                columns={columns}
                selectedIndices={selectedColumns}
                onSelectionChange={setSelectedColumns}
                onAutoDetect={handleAutoDetect}
                autoDetecting={autoDetecting}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep('preview')}
                disabled={selectedColumns.length < 2}
              >
                Suivant : Apercu des donnees
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Preview & configure */}
        {(step === 'preview' || step === 'running') && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Apercu des donnees</h3>
                  <p className="text-[12px] text-muted-foreground">
                    {respondents.length} repondants valides sur {uploadData.total_rows} lignes · {columnNames.length} colonnes selectionnees
                  </p>
                  {respondents.length === 0 && uploadData.total_rows > 0 && (
                    <p className="text-[12px] text-destructive mt-1">
                      Aucun repondant valide. Verifiez que les colonnes selectionnees contiennent uniquement des valeurs numeriques.
                      Les colonnes non-numeriques (texte, emojis, etc.) excluent les lignes correspondantes.
                    </p>
                  )}
                  {respondents.length > 0 && respondents.length < uploadData.total_rows && (
                    <p className="text-[12px] text-warning mt-1">
                      {uploadData.total_rows - respondents.length} lignes exclues (valeurs non-numeriques dans les colonnes selectionnees).
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep('columns')}>
                  Modifier les colonnes
                </Button>
              </div>
              <PersonaDataTable data={respondents.slice(0, 50)} columnNames={columnNames} />
              {respondents.length > 50 && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Affichage des 50 premieres lignes sur {respondents.length}
                </p>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Nombre de clusters</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setClusterCount('auto')}
                  className={`px-4 py-2 rounded-lg text-[13px] border transition-colors ${
                    clusterCount === 'auto'
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  Automatique (silhouette score)
                </button>
                {[2, 3, 4, 5, 6, 7, 8].map((k) => (
                  <button
                    key={k}
                    onClick={() => setClusterCount(k)}
                    className={`px-4 py-2 rounded-lg text-[13px] border transition-colors ${
                      clusterCount === k
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('columns')}>
                Retour
              </Button>
              <Button onClick={runAnalysis} disabled={step === 'running'}>
                {step === 'running' ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyse en cours...
                  </span>
                ) : (
                  'Lancer l\'analyse'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Results (inline quick view, link to full) */}
        {step === 'done' && result && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Analyse terminee</h3>
                  <p className="text-[13px] text-muted-foreground">
                    {result.clusters.length} personas identifiees · k optimal = {result.optimalK}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadCSV}>
                    Telecharger CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setStep('columns'); setResult(null); }}>
                    Nouvelle analyse
                  </Button>
                </div>
              </div>

              {/* Silhouette scores */}
              <div className="mb-6">
                <h4 className="text-[13px] font-medium text-foreground mb-2">Scores silhouette par k</h4>
                <div className="flex gap-2 flex-wrap">
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
              </div>

              {/* Cluster cards */}
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

            {/* Full analysis tabs - rendered inline */}
            <PersonaAnalysisTabs result={result} respondents={respondents} />
          </div>
        )}
      </main>
    </div>
  );
}

// --- Analysis tabs (embedded for new analysis) ---

import { PersonaDataTable as DataTableComponent } from '@/components/persona/data-table';
import { RadarViz } from '@/components/persona/radar-viz';
import { LikertScales } from '@/components/persona/likert-scales';
import { HeatmapViz } from '@/components/persona/heatmap-viz';
import { CorrelationViz } from '@/components/persona/correlation-viz';
import { InteractiveLegend, useClusterFilter } from '@/components/persona/interactive-legend';

type AnalysisTab = 'data' | 'correlation' | 'viz';

function PersonaAnalysisTabs({
  result,
  respondents,
}: {
  result: PersonaAnalysisResult;
  respondents: PersonaRespondent[];
}) {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('viz');
  const filter = useClusterFilter();

  const clusterMap = useMemo(() => {
    const map = new Map<string, { color: string; label: string }>();
    result.clusters.forEach((c) =>
      c.members.forEach((m) => map.set(m.id, { color: c.color, label: c.label }))
    );
    return map;
  }, [result.clusters]);

  const orderedFromClusters = useMemo(() => {
    return result.clusters.flatMap((c) =>
      [...c.members].sort((a, b) => {
        const na = parseInt(a.id.replace(/\D/g, '')) || 0;
        const nb = parseInt(b.id.replace(/\D/g, '')) || 0;
        return na - nb;
      })
    );
  }, [result.clusters]);

  const tabs: { id: AnalysisTab; label: string }[] = [
    { id: 'data', label: 'Donnees ordonnees' },
    { id: 'correlation', label: 'Correlations' },
    { id: 'viz', label: 'Visualisations' },
  ];

  return (
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
        {activeTab === 'data' && (
          <DataTableComponent
            data={orderedFromClusters}
            columnNames={result.columnNames}
            clusterInfo={clusterMap}
          />
        )}

        {activeTab === 'correlation' && (
          <CorrelationViz
            correlationData={result.correlationData}
            respondents={respondents}
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
  );
}
