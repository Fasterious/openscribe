'use client';

import { useMemo, useState } from 'react';
import type { PersonaV2Result, ValidationScores } from '@/types/persona-v2';
import type { PersonaCluster } from '@/types/persona';
import { v1Labels, kModesLabels, scorePartition } from '@/lib/persona-v2';
import { Term, BandChip, InfoDot } from './term';
import { PersonaCard } from './persona-card';
import { PipelineStepper } from './pipeline-stepper';
import { ModelSelectionPanel } from './model-selection-panel';
import { RadarViz } from '@/components/persona/radar-viz';
import { LikertScales } from '@/components/persona/likert-scales';
import { HeatmapViz } from '@/components/persona/heatmap-viz';
import { InteractiveLegend, useClusterFilter } from '@/components/persona/interactive-legend';

// --- Core target (Étape 0 / régime dual) ----------------------------------

function CoreTargetCard({ result }: { result: PersonaV2Result }) {
  const ct = result.coreTarget;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-1.5">
        <h3 className="text-sm font-semibold text-foreground">
          <Term k="coreTarget">Cœur de cible</Term>
        </h3>
      </div>
      <p className="mb-3 text-[13px] text-foreground/80">{ct.verdict}</p>
      {ct.consensusItems.length > 0 ? (
        <div>
          <p className="mb-1.5 text-[11px] text-muted-foreground">
            Consensus ≥ {Math.round(ct.consensusThreshold * 100)}% :
          </p>
          <div className="flex flex-wrap gap-1">
            {ct.consensusItems.map((it) => (
              <BandChip
                key={it.varIdx}
                label={it.columnName}
                direction={it.direction}
                agreement={it.consensus}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-muted-foreground">
          Aucune question ne fait l&apos;objet d&apos;un large consensus : la population est nettement
          segmentée (voir les personas ci-dessous).
        </p>
      )}
    </div>
  );
}

// --- Noise class U ---------------------------------------------------------

function NoiseCard({ result }: { result: PersonaV2Result }) {
  const noise = result.noise;
  if (noise.memberIndices.length === 0) return null;
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5">
      <div className="mb-1 flex items-center gap-1.5">
        <h3 className="text-sm font-semibold text-foreground">
          <Term k="noiseClass">Classe U — non assignés</Term>
        </h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {noise.memberIndices.length} · {Math.round(noise.fraction * 100)}%
        </span>
      </div>
      <p className="mb-3 text-[12px] text-muted-foreground">
        Ces répondants ne collent à aucun persona net. Les mettre de côté rend les personas plus
        fiables — c&apos;est une information, pas un échec.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {noise.reasons.slice(0, 24).map((r) => (
          <span
            key={r.respondentId}
            className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground"
            title={r.reason}
          >
            {r.respondentId}
          </span>
        ))}
        {noise.reasons.length > 24 && (
          <span className="text-[11px] text-muted-foreground">+{noise.reasons.length - 24}…</span>
        )}
      </div>
    </div>
  );
}

// --- Validation + V1 comparator -------------------------------------------

function scoreRow(name: string, s: ValidationScores, highlight = false) {
  return (
    <tr key={name} className={`border-t border-border/60 ${highlight ? 'bg-primary/5' : ''}`}>
      <td className={`py-1.5 pr-3 ${highlight ? 'font-medium text-primary' : 'text-foreground'}`}>{name}</td>
      <td className="py-1.5 pr-3 text-foreground">{s.ari.toFixed(3)}</td>
      <td className="py-1.5 pr-3 text-foreground">{s.purity.toFixed(3)}</td>
      <td className="py-1.5 pr-3 text-foreground">{s.nmi.toFixed(3)}</td>
      <td className="py-1.5 pr-3 text-muted-foreground">{s.foundK}</td>
    </tr>
  );
}

function ValidationPanel({ result }: { result: PersonaV2Result }) {
  const truth = result.validation?.truthLabels;
  const values = useMemo(() => result.respondents.map((r) => r.values), [result.respondents]);

  const baselines = useMemo(() => {
    if (!truth) return null;
    const trueK = new Set(truth.filter((t) => t && t !== 'U')).size || 5;
    const v1auto = scorePartition(v1Labels(values, result.columnNames, 'subspace-cohesion'), truth);
    const v1k = scorePartition(v1Labels(values, result.columnNames, 'subspace-cohesion', trueK), truth);
    const km = scorePartition(kModesLabels(values, trueK), truth);
    return { v1auto, v1k, km };
  }, [truth, values, result.columnNames]);

  if (!result.validation || !baselines) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-1 flex items-center gap-1.5">
        <h3 className="text-sm font-semibold text-foreground">Validation (vérité terrain)</h3>
        <InfoDot k="ari" />
      </div>
      <p className="mb-3 text-[12px] text-muted-foreground">
        Comparaison aux personas réels — ce que le module actuel ne mesure pas. Plus l&apos;
        <Term k="ari">ARI</Term> est haut, mieux c&apos;est.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 pr-3 font-medium">Méthode</th>
              <th className="py-1 pr-3 font-medium"><Term k="ari">ARI</Term></th>
              <th className="py-1 pr-3 font-medium"><Term k="purity">Pureté</Term></th>
              <th className="py-1 pr-3 font-medium"><Term k="nmi">NMI</Term></th>
              <th className="py-1 pr-3 font-medium">k</th>
            </tr>
          </thead>
          <tbody>
            {scoreRow(`Persona V2 (${result.backendUsed === 'co-agreement' ? 'co-accord' : 'surprise'})`, result.validation.v2, true)}
            {scoreRow('V1 cohésion (auto-k)', baselines.v1auto)}
            {scoreRow('V1 cohésion (k réel forcé)', baselines.v1k)}
            {scoreRow('k-modes naïf', baselines.km)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Visualisations (reuse v1 viz; PersonaV2 ⊇ PersonaCluster) -------------

function VizTabs({ result }: { result: PersonaV2Result }) {
  const filter = useClusterFilter();
  const clusters = result.personas as unknown as PersonaCluster[];
  const [tab, setTab] = useState<'radar' | 'likert' | 'heatmap'>('radar');
  if (clusters.length === 0) return null;

  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'radar', label: 'Radar' },
    { id: 'likert', label: 'Échelles Likert' },
    { id: 'heatmap', label: 'Heatmap' },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <nav className="flex gap-1 border-b border-border px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-[13px] transition-colors ${
              tab === t.id
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="space-y-4 p-5">
        <InteractiveLegend clusters={clusters} filter={filter} />
        {tab === 'radar' && <RadarViz clusters={clusters} columnNames={result.columnNames} filter={filter} />}
        {tab === 'likert' && <LikertScales clusters={clusters} columnNames={result.columnNames} filter={filter} />}
        {tab === 'heatmap' && <HeatmapViz clusters={clusters} columnNames={result.columnNames} />}
      </div>
    </div>
  );
}

// --- Composition -----------------------------------------------------------

export function PersonaV2Results({ result }: { result: PersonaV2Result }) {
  return (
    <div className="space-y-6">
      {result.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-[13px] text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
          <ul className="list-inside list-disc space-y-1">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <CoreTargetCard result={result} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {result.personas.length} persona(s) détecté(s)
          </h3>
          <span className="text-[11px] text-muted-foreground">
            moteur « {result.backendUsed === 'co-agreement' ? 'co-accord' : 'surprise'} »
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.personas.map((p) => (
            <PersonaCard key={p.id} persona={p} total={result.respondents.length} />
          ))}
        </div>
      </div>

      <NoiseCard result={result} />
      <VizTabs result={result} />
      <ModelSelectionPanel result={result} />
      <ValidationPanel result={result} />
      <PipelineStepper steps={result.steps} elapsedMs={result.elapsedMs} backendUsed={result.backendUsed} />
    </div>
  );
}
