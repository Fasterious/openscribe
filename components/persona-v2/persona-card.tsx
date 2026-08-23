'use client';

import type { PersonaV2 } from '@/types/persona-v2';
import { Term, BandChip } from './term';

function Metric({
  glossary,
  label,
  value,
  bar,
  tone = 'primary',
}: {
  glossary: string;
  label: string;
  value: string;
  bar?: number; // 0..1 for a progress sliver
  tone?: 'primary' | 'green' | 'amber';
}) {
  const barColor =
    tone === 'green' ? 'bg-green-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-primary';
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <div className="text-[10px] text-muted-foreground">
        <Term k={glossary}>{label}</Term>
      </div>
      <div className="mt-0.5 text-[14px] font-semibold text-foreground">{value}</div>
      {bar !== undefined && (
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-border">
          <div className={`h-full ${barColor}`} style={{ width: `${Math.max(0, Math.min(1, bar)) * 100}%` }} />
        </div>
      )}
    </div>
  );
}

export function PersonaCard({ persona, total }: { persona: PersonaV2; total: number }) {
  const sharePct = total > 0 ? Math.round((persona.size / total) * 100) : 0;
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: persona.color }} />
          <div>
            <p className="text-[14px] font-semibold leading-tight text-foreground">{persona.label}</p>
            <p className="text-[11px] text-muted-foreground">
              {persona.size} membres · {sharePct}% de l&apos;échantillon
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Metric glossary="surprise" label="Surprise" value={persona.surprise.toFixed(2)} />
        <Metric glossary="lift" label="Lift" value={`×${persona.lift.toFixed(1)}`} />
        <Metric
          glossary="cohesion"
          label="Cohésion"
          value={persona.cohesion.toFixed(2)}
          bar={(persona.cohesion + 1) / 2}
          tone="green"
        />
        <Metric
          glossary="stability"
          label="Stabilité"
          value={persona.stability.toFixed(2)}
          bar={persona.stability}
          tone="amber"
        />
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
          <Term k="subspace">Sous-espace</Term> — {persona.subspace.length} question(s)
        </p>
        <div className="flex flex-wrap gap-1">
          {persona.subspace.map((sv) => (
            <BandChip
              key={sv.varIdx}
              label={sv.columnName}
              direction={sv.direction}
              agreement={sv.agreement}
            />
          ))}
          {persona.subspace.length === 0 && (
            <span className="text-[11px] text-muted-foreground">Aucune question discriminante.</span>
          )}
        </div>
      </div>
    </div>
  );
}
