'use client';

// Transparent controls (A2 + A3): every knob is visible, explained, and its
// effect is recomputed live. Defaults are conservative (raw data, auto backend).

import { useState } from 'react';
import type { PersonaV2Config } from '@/types/persona-v2';
import { Term, InfoDot } from './term';

type Patch = Partial<PersonaV2Config>;

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
            value === o.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Row({
  label,
  hint,
  glossary,
  children,
}: {
  label: string;
  hint?: string;
  glossary?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
          {label}
          {glossary && <InfoDot k={glossary} />}
        </div>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function V2Controls({
  config,
  onChange,
  disabled,
}: {
  config: PersonaV2Config;
  onChange: (patch: Patch) => void;
  disabled?: boolean;
}) {
  const [advanced, setAdvanced] = useState(false);

  return (
    <div className={`space-y-4 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <Row
        label="Moteur"
        glossary="cohesion"
        hint="Auto compare les deux et garde la meilleure silhouette subspace."
      >
        <Segmented
          value={config.backend}
          onChange={(v) => onChange({ backend: v })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'co-agreement', label: 'Co-accord' },
            { value: 'surprise', label: 'Surprise' },
          ]}
        />
      </Row>

      <Row
        label="Normalisation"
        glossary="ipsatisation"
        hint="Brut par défaut. L'ipsatisation neutralise les styles de réponse (toujours haut/bas)."
      >
        <Segmented
          value={config.prep}
          onChange={(v) => onChange({ prep: v })}
          options={[
            { value: 'raw', label: 'Brut' },
            { value: 'ipsative', label: 'Ipsatisé' },
            { value: 'item-z', label: 'Z par item' },
          ]}
        />
      </Row>

      <Row label="Granularité des bandes" hint="3 bandes (bas/neutre/haut) ou une bande par valeur.">
        <Segmented
          value={config.granularity}
          onChange={(v) => onChange({ granularity: v })}
          options={[
            { value: 'lmh', label: '3 bandes' },
            { value: 'fine', label: 'Fine' },
          ]}
        />
      </Row>

      {/* λ slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
            <Term k="lambda">Curseur λ</Term>
          </div>
          <span className="font-mono text-[12px] text-primary">{config.lambda.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.lambda}
          onChange={(e) => onChange({ lambda: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>← fin / pur / spécifique</span>
          <span>large / couvrant →</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAdvanced((a) => !a)}
        className="text-[12px] font-medium text-primary hover:underline"
      >
        {advanced ? '− Masquer les options avancées' : '+ Options avancées'}
      </button>

      {advanced && (
        <div className="space-y-4 rounded-lg border border-dashed border-border p-4">
          <Row label="Classe U (non assignés)" glossary="noiseClass" hint="Droit d'exclure les répondants hors-motif.">
            <Segmented
              value={config.useNoiseClass ? 'on' : 'off'}
              onChange={(v) => onChange({ useNoiseClass: v === 'on' })}
              options={[
                { value: 'on', label: 'Activée' },
                { value: 'off', label: 'Désactivée' },
              ]}
            />
          </Row>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[13px] font-medium text-foreground">
              <span className="flex items-center gap-1.5">
                Confiance min. d&apos;assignation <InfoDot k="coverage" />
              </span>
              <span className="font-mono text-[12px] text-primary">{config.assignConfidence.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={config.assignConfidence}
              onChange={(e) => onChange({ assignConfidence: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[13px] font-medium text-foreground">
              <span className="flex items-center gap-1.5">
                Relances de <Term k="stability">stabilité</Term>
              </span>
              <span className="font-mono text-[12px] text-primary">{config.stabilityRuns}</span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              step={2}
              value={config.stabilityRuns}
              onChange={(e) => onChange({ stabilityRuns: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <p className="text-[10px] text-muted-foreground">
              0 désactive la stabilité (et donc la sélection auto du nombre de personas).
            </p>
          </div>

          <Row label="Personas max." hint="Plafond d'affichage.">
            <input
              type="number"
              min={2}
              max={20}
              value={config.maxPersonas}
              onChange={(e) => onChange({ maxPersonas: Number(e.target.value) })}
              className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
            />
          </Row>
        </div>
      )}
    </div>
  );
}
