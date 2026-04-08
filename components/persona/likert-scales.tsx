'use client';

import { useMemo } from 'react';
import type { PersonaCluster } from '@/types/persona';
import type { ClusterFilter } from './interactive-legend';

interface SignatureBadge {
  clusterColor: string;
  clusterLabel: string;
  direction: 'high' | 'low' | 'mid';
  avgVal: number;
}

export function LikertScales({
  clusters,
  columnNames,
  filter,
}: {
  clusters: PersonaCluster[];
  columnNames: string[];
  filter: ClusterFilter;
}) {
  const randomPositions = useMemo(() => {
    const map = new Map<string, number>();
    clusters.forEach((c) =>
      c.members.forEach((m) =>
        columnNames.forEach((_, ci) => {
          map.set(`${m.id}_${ci}`, Math.random() * 60 + 10);
        })
      )
    );
    return map;
  }, [clusters, columnNames]);

  const signaturesByColumn = useMemo(() => {
    const map = new Map<number, SignatureBadge[]>();
    clusters.forEach((cluster) => {
      cluster.signatureVars.forEach((sv) => {
        const ci = columnNames.indexOf(sv.columnName);
        if (ci === -1) return;
        const existing = map.get(ci) ?? [];
        existing.push({
          clusterColor: cluster.color,
          clusterLabel: cluster.label,
          direction: sv.direction,
          avgVal: sv.avgVal,
        });
        map.set(ci, existing);
      });
    });
    return map;
  }, [clusters, columnNames]);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Echelles de Likert par Critere</h3>
      <div className="space-y-4">
        {columnNames.map((col, ci) => {
          const badges = signaturesByColumn.get(ci);
          return (
            <div key={col}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] text-foreground">{col}</span>
                {badges && badges.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {badges.map((b, bi) => (
                      <span
                        key={bi}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          backgroundColor: `${b.clusterColor}18`,
                          color: b.clusterColor,
                          border: `1px solid ${b.clusterColor}40`,
                        }}
                        title={`${b.clusterLabel}: moyenne ${b.avgVal}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: b.clusterColor }}
                        />
                        {b.direction === 'high' ? '\u2191' : b.direction === 'low' ? '\u2193' : '~'}{b.avgVal}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative h-10 bg-muted rounded-md">
                {[1, 2, 3, 4, 5].map((v) => (
                  <div
                    key={v}
                    className="absolute top-0 h-full border-l border-border/50 text-[10px] text-muted-foreground flex items-end pb-0.5 pl-0.5"
                    style={{ left: `${((v - 1) / 4) * 100}%` }}
                  >
                    {v}
                  </div>
                ))}
                {clusters.map((cluster, clusterIdx) =>
                  cluster.members.map((member) => {
                    const opacity = filter.getOpacity(clusterIdx);
                    return (
                      <div
                        key={member.id}
                        className="absolute w-2.5 h-2.5 rounded-full transition-opacity"
                        style={{
                          backgroundColor: cluster.color,
                          left: `${((member.values[ci] - 1) / 4) * 100}%`,
                          top: `${randomPositions.get(`${member.id}_${ci}`) ?? 40}%`,
                          transform: 'translate(-50%, -50%)',
                          opacity: opacity > 0.5 ? 0.8 : opacity * 0.5,
                        }}
                        title={`${member.id} (${cluster.label}): ${member.values[ci]}`}
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
