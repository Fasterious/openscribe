'use client';

import type { ModelSelection, PersonaV2Result } from '@/types/persona-v2';
import { Term, InfoDot } from './term';

function Stat({ glossary, label, value }: { glossary: string; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <div className="text-[11px] text-muted-foreground">
        <Term k={glossary}>{label}</Term>
      </div>
      <div className="mt-0.5 text-[18px] font-bold text-foreground">{value}</div>
    </div>
  );
}

export function ModelSelectionPanel({ result }: { result: PersonaV2Result }) {
  const ms: ModelSelection = result.modelSelection;
  const alt = ms.alternativeBackend;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Qualité &amp; sélection de modèle</h3>

      <div className="grid grid-cols-3 gap-2">
        <Stat glossary="cohesion" label="Silhouette subspace" value={ms.subspaceSilhouette.toFixed(2)} />
        <Stat glossary="stability" label="Stabilité" value={ms.stability.toFixed(2)} />
        <Stat glossary="coverage" label="Couverture" value={`${Math.round(ms.coverage * 100)}%`} />
      </div>

      {/* Backend decision (auto) */}
      {alt && (
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-[12px] font-medium text-foreground">Décision automatique du moteur</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-md border border-primary/40 bg-primary/5 p-2">
              <p className="font-medium text-primary">
                Retenu : {result.backendUsed === 'co-agreement' ? 'co-accord' : 'surprise'}
              </p>
              <p className="text-muted-foreground">
                silhouette {ms.subspaceSilhouette.toFixed(2)} · {result.personas.length} personas
              </p>
            </div>
            <div className="rounded-md border border-border p-2">
              <p className="font-medium text-muted-foreground">
                Écarté : {alt.backend === 'co-agreement' ? 'co-accord' : 'surprise'}
              </p>
              <p className="text-muted-foreground">
                silhouette {alt.subspaceSilhouette.toFixed(2)} · {alt.personaCount} personas
              </p>
            </div>
          </div>
        </div>
      )}

      {/* per-k model selection (co-agreement) */}
      {ms.perK && ms.perK.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-foreground">
            Silhouette par nombre de groupes (k) <InfoDot k="cohesion" />
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ms.perK.map((row) => (
              <span
                key={row.k}
                className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground"
              >
                k={row.k} · {row.silhouette.toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pareto front */}
      {ms.paretoFront.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-foreground">
            <Term k="pareto">Front de Pareto</Term> (couverture ↔ spécificité)
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1 pr-3 font-medium">Compromis (λ)</th>
                  <th className="py-1 pr-3 font-medium">Personas</th>
                  <th className="py-1 pr-3 font-medium">Couverture</th>
                  <th className="py-1 pr-3 font-medium">Spécificité</th>
                  <th className="py-1 pr-3 font-medium">Silhouette</th>
                </tr>
              </thead>
              <tbody>
                {ms.paretoFront.map((p) => (
                  <tr key={p.lambda} className="border-t border-border/60">
                    <td className="py-1 pr-3 capitalize text-foreground">
                      {p.label} <span className="text-muted-foreground">(λ={p.lambda})</span>
                    </td>
                    <td className="py-1 pr-3 text-foreground">{p.personaCount}</td>
                    <td className="py-1 pr-3 text-foreground">{Math.round(p.coverage * 100)}%</td>
                    <td className="py-1 pr-3 text-foreground">{Math.round(p.avgSpecificity * 100)}%</td>
                    <td className="py-1 pr-3 text-foreground">{p.subspaceSilhouette.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
