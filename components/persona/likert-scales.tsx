'use client';

import { useMemo } from 'react';
import type { PersonaCluster } from '@/types/persona';
import type { ClusterFilter } from './interactive-legend';

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

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Echelles de Likert par Critere</h3>
      <div className="space-y-4">
        {columnNames.map((col, ci) => (
          <div key={col}>
            <div className="text-[13px] text-foreground mb-1">{col}</div>
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
        ))}
      </div>
    </div>
  );
}
