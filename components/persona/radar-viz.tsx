'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import type { PersonaCluster } from '@/types/persona';
import type { ClusterFilter } from './interactive-legend';

export function RadarViz({
  clusters,
  columnNames,
  filter,
}: {
  clusters: PersonaCluster[];
  columnNames: string[];
  filter: ClusterFilter;
}) {
  const data = columnNames.map((col, i) => {
    const entry: Record<string, string | number> = { criterion: col };
    clusters.forEach((_, ci) => {
      entry[`cluster_${ci}`] = parseFloat(clusters[ci].centroid[i].toFixed(2));
    });
    return entry;
  });

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; stroke: string }>; label?: string }) => {
    if (!active || !payload) return null;
    const visiblePayload = payload.filter((_: unknown, idx: number) => filter.getOpacity(idx) > 0.5);
    if (visiblePayload.length === 0) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-2 shadow-lg text-[12px]">
        <p className="mb-1 font-medium">{label}</p>
        {visiblePayload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }} />
            <span>{entry.name}: <strong>{entry.value}</strong></span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Profil Radar des Personas (Centroides)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis domain={[1, 5]} tickCount={5} />
          {clusters.map((cluster, idx) => (
            <Radar
              key={`radar_${idx}`}
              name={cluster.label}
              dataKey={`cluster_${idx}`}
              stroke={cluster.color}
              fill={cluster.color}
              fillOpacity={0.15 * filter.getOpacity(idx)}
              strokeOpacity={filter.getOpacity(idx)}
              strokeWidth={filter.getOpacity(idx) > 0.5 ? 2 : 1}
            />
          ))}
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
