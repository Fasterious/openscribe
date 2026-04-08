'use client';

import type { PersonaRespondent } from '@/types/persona';

const LIKERT_COLORS: Record<number, string> = {
  1: '#dc2626',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#16a34a',
};

export function PersonaDataTable({
  data,
  columnNames,
  clusterInfo,
}: {
  data: PersonaRespondent[];
  columnNames: string[];
  clusterInfo?: Map<string, { color: string; label: string }>;
}) {
  return (
    <div className="overflow-auto max-h-[500px] border border-border rounded-lg">
      <table className="w-full text-[12px]">
        <thead className="sticky top-0 bg-card z-10">
          <tr className="border-b border-border">
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">ID</th>
            {clusterInfo && (
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Cluster</th>
            )}
            {columnNames.map((col) => (
              <th key={col} className="text-center px-2 py-2 font-medium text-muted-foreground">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r) => {
            const info = clusterInfo?.get(r.id);
            return (
              <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="px-3 py-1.5 text-foreground font-medium">{r.id}</td>
                {clusterInfo && (
                  <td className="px-3 py-1.5">
                    {info && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: info.color }}
                        />
                        <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                          {info.label}
                        </span>
                      </div>
                    )}
                  </td>
                )}
                {r.values.map((v, i) => (
                  <td key={i} className="text-center px-2 py-1.5">
                    <span
                      className="inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-medium text-white"
                      style={{ backgroundColor: LIKERT_COLORS[v] ?? '#94a3b8' }}
                    >
                      {v}
                    </span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
