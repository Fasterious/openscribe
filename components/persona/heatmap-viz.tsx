'use client';

import type { PersonaCluster } from '@/types/persona';

const VALUE_COLORS = ['', '#1e3a5f', '#2563eb', '#eab308', '#f97316', '#dc2626'];

export function HeatmapViz({
  clusters,
  columnNames,
}: {
  clusters: PersonaCluster[];
  columnNames: string[];
}) {
  const sortedRespondents = clusters.flatMap((c) =>
    c.members.map((m) => ({ ...m, clusterColor: c.color, clusterLabel: c.label }))
  );

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Heatmap des Reponses (groupees par cluster)
      </h3>
      <div className="overflow-auto">
        <div className="flex gap-0.5">
          <div className="w-12 shrink-0" />
          {columnNames.map((c) => (
            <div key={c} className="w-8 text-center text-[10px] text-muted-foreground">{c}</div>
          ))}
        </div>
        {sortedRespondents.map((r) => (
          <div key={r.id} className="flex gap-0.5 items-center">
            <div className="w-12 shrink-0 text-[10px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.clusterColor }} />
              {r.id}
            </div>
            {r.values.map((v, i) => (
              <div
                key={i}
                className="w-8 h-5 rounded-sm flex items-center justify-center text-[9px] text-white"
                style={{ backgroundColor: VALUE_COLORS[v] ?? '#94a3b8' }}
              >
                {v}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
