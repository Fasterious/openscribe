'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ColumnSelector, type ColumnInfo } from '@/components/persona/column-selector';
import { V2Controls } from '@/components/persona-v2/controls';
import { PersonaV2Results } from '@/components/persona-v2/results';
import { runPersonaV2 } from '@/lib/persona-v2';
import { DEFAULT_V2_CONFIG } from '@/types/persona-v2';
import type { PersonaV2Config, PersonaV2Result } from '@/types/persona-v2';

interface UploadData {
  filename: string;
  headers: string[];
  rows: Record<string, string>[];
  total_rows: number;
}

type Step = 'columns' | 'configure' | 'running' | 'done';

const TRUTH_HINTS = ['persona', 'groupe', 'group', 'segment', 'cluster', 'label', 'vérité', 'verite'];

export default function PersonaV2Page() {
  const router = useRouter();

  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [noUpload, setNoUpload] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<number[]>([]);
  const [idColumn, setIdColumn] = useState<number>(0);
  const [truthColumn, setTruthColumn] = useState<number>(-1);
  const [step, setStep] = useState<Step>('columns');
  const [config, setConfig] = useState<PersonaV2Config>(DEFAULT_V2_CONFIG);
  const [result, setResult] = useState<PersonaV2Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('persona_upload');
    if (!raw) {
      setNoUpload(true);
      return;
    }
    try {
      setUploadData(JSON.parse(raw));
    } catch {
      setNoUpload(true);
    }
  }, []);

  const loadSample = useCallback(async () => {
    setLoadingSample(true);
    try {
      const res = await fetch('/samples/persona-demo-50.csv');
      const text = await res.text();
      const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
      const headers = parsed.meta.fields ?? [];
      setUploadData({ filename: 'persona-demo-50.csv (exemple)', headers, rows: parsed.data, total_rows: parsed.data.length });
      setNoUpload(false);
    } catch {
      setError("Impossible de charger l'exemple.");
    } finally {
      setLoadingSample(false);
    }
  }, []);

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

  // Auto-select numeric Likert-like columns + guess a ground-truth column.
  useEffect(() => {
    if (columns.length === 0 || selectedColumns.length > 0) return;
    const numeric = columns.filter((c) => c.isNumeric && c.uniqueValues <= 12).map((c) => c.index);
    if (numeric.length > 0) setSelectedColumns(numeric);
    const truthIdx = columns.findIndex((c) =>
      TRUTH_HINTS.some((h) => c.name.toLowerCase().includes(h)) && !c.isNumeric
    );
    if (truthIdx >= 0) setTruthColumn(truthIdx);
  }, [columns, selectedColumns.length]);

  const respondents = useMemo(() => {
    if (!uploadData || selectedColumns.length === 0) return [];
    const headers = uploadData.headers;
    const idHeader = headers[idColumn];
    return uploadData.rows
      .map((row, i) => {
        let bad = false;
        const values = selectedColumns.map((ci) => {
          const r = row[headers[ci]];
          if (r === '' || r === undefined || r === null) { bad = true; return 0; }
          const v = Number(r);
          if (isNaN(v)) { bad = true; return 0; }
          return v;
        });
        if (bad) return null;
        return { id: row[idHeader] || `R${i + 1}`, values, _row: i };
      })
      .filter((r): r is { id: string; values: number[]; _row: number } => r !== null);
  }, [uploadData, selectedColumns, idColumn]);

  const columnNames = useMemo(
    () => selectedColumns.map((ci) => uploadData?.headers[ci] ?? `C${ci + 1}`),
    [selectedColumns, uploadData]
  );

  const truthLabels = useMemo(() => {
    if (truthColumn < 0 || !uploadData) return undefined;
    const header = uploadData.headers[truthColumn];
    return respondents.map((r) => {
      const v = uploadData.rows[r._row]?.[header];
      return v && v.trim() !== '' ? v : null;
    });
  }, [truthColumn, uploadData, respondents]);

  const runAnalysis = useCallback(
    async (cfg: PersonaV2Config) => {
      if (respondents.length < 8) {
        setError('Il faut au moins 8 répondants valides pour une analyse fiable.');
        return;
      }
      setError(null);
      setStep('running');
      await new Promise((r) => setTimeout(r, 60));
      try {
        const res = runPersonaV2(
          {
            respondents: respondents.map((r) => ({ id: r.id, values: r.values })),
            columnNames,
            truthLabels,
          },
          cfg
        );
        setResult(res);
        setStep('done');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur inconnue');
        setStep('configure');
      }
    },
    [respondents, columnNames, truthLabels]
  );

  // --- No upload: offer the sample or a link back ---------------------------
  if (noUpload && !uploadData) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Module Persona — V2</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Un moteur plus intelligent : motifs surprenants, classe « non assignés », qualité par
            sous-espace et stabilité — chaque étape est expliquée.
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={loadSample} disabled={loadingSample}>
              {loadingSample ? 'Chargement…' : "Essayer avec l'exemple (50 × 5)"}
            </Button>
            <Button variant="outline" onClick={() => router.push('/persona')}>
              Importer un fichier
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!uploadData) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }

  const steps: { id: Step; label: string }[] = [
    { id: 'columns', label: '1. Colonnes' },
    { id: 'configure', label: '2. Réglages' },
    { id: 'done', label: '3. Résultats' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
              {uploadData.filename}
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                V2
              </span>
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {uploadData.total_rows} lignes · {uploadData.headers.length} colonnes
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/persona')}>
            Retour
          </Button>
        </div>

        {/* Stepper */}
        <div className="mb-6 flex gap-2">
          {steps.map((s, i) => {
            const order = ['columns', 'configure', 'done'];
            const curIdx = order.indexOf(step === 'running' ? 'configure' : step);
            const isCurrent = (step === 'running' ? 'configure' : step) === s.id;
            const isDone = order.indexOf(s.id) < curIdx;
            return (
              <div
                key={s.id}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-medium ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {s.label}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Step 1: columns */}
        {step === 'columns' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <label className="mb-2 block text-[13px] font-medium text-foreground">
                  Colonne identifiant
                </label>
                <select
                  value={idColumn}
                  onChange={(e) => setIdColumn(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {uploadData.headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <label className="mb-2 block text-[13px] font-medium text-foreground">
                  Colonne « vérité terrain » (optionnel)
                </label>
                <select
                  value={truthColumn}
                  onChange={(e) => setTruthColumn(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value={-1}>— aucune —</option>
                  {uploadData.headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Si vos groupes réels sont connus, on mesure l&apos;ARI / pureté / NMI.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <ColumnSelector
                columns={columns}
                selectedIndices={selectedColumns}
                onSelectionChange={setSelectedColumns}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep('configure')} disabled={selectedColumns.length < 2}>
                Suivant : réglages
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: configure */}
        {(step === 'configure' || step === 'running') && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Réglages du moteur</h3>
                  <p className="text-[12px] text-muted-foreground">
                    {respondents.length} répondants valides · {columnNames.length} questions
                    {truthLabels ? ' · vérité terrain active' : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep('columns')}>
                  Modifier les colonnes
                </Button>
              </div>
              <V2Controls
                config={config}
                onChange={(patch) => setConfig((c) => ({ ...c, ...patch }))}
                disabled={step === 'running'}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('columns')} disabled={step === 'running'}>
                Retour
              </Button>
              <Button onClick={() => runAnalysis(config)} disabled={step === 'running'}>
                {step === 'running' ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyse en cours…
                  </span>
                ) : (
                  "Lancer l'analyse"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: results */}
        {step === 'done' && result && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 lg:flex-row lg:items-start">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Réglages (live)</h3>
                <p className="mb-3 text-[12px] text-muted-foreground">
                  Modifiez un paramètre puis relancez pour voir son effet.
                </p>
                <V2Controls config={config} onChange={(patch) => setConfig((c) => ({ ...c, ...patch }))} />
              </div>
              <div className="flex gap-2 lg:flex-col">
                <Button onClick={() => runAnalysis(config)}>Relancer</Button>
                <Button variant="outline" onClick={() => setStep('columns')}>
                  Colonnes
                </Button>
              </div>
            </div>

            <PersonaV2Results result={result} />
          </div>
        )}
      </main>
    </div>
  );
}
