'use client';

import { useState, useCallback } from 'react';
import type { PersonaCluster } from '@/types/persona';

export function useClusterFilter() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [lockedIdxs, setLockedIdxs] = useState<Set<number>>(new Set());

  const onHover = useCallback((idx: number) => setHoveredIdx(idx), []);
  const onLeave = useCallback(() => setHoveredIdx(null), []);
  const onClick = useCallback((idx: number) => {
    if (idx === -1) {
      setLockedIdxs(new Set());
      return;
    }
    setLockedIdxs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const getOpacity = useCallback((idx: number): number => {
    const hasLocked = lockedIdxs.size > 0;
    if (hasLocked) {
      if (lockedIdxs.has(idx)) return 1;
      if (hoveredIdx === idx) return 0.7;
      return 0.08;
    }
    if (hoveredIdx !== null) {
      return hoveredIdx === idx ? 1 : 0.12;
    }
    return 1;
  }, [hoveredIdx, lockedIdxs]);

  return { hoveredIdx, lockedIdxs, onHover, onLeave, onClick, getOpacity };
}

export type ClusterFilter = ReturnType<typeof useClusterFilter>;

export function InteractiveLegend({
  clusters,
  filter,
}: {
  clusters: PersonaCluster[];
  filter: ClusterFilter;
}) {
  const { hoveredIdx, lockedIdxs, onHover, onLeave, onClick } = filter;
  const hasLocked = lockedIdxs.size > 0;

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {clusters.map((c, idx) => {
        const isLocked = lockedIdxs.has(idx);
        const isHovered = hoveredIdx === idx;
        const isActive = isLocked || isHovered;
        const dimmed = hasLocked
          ? !isLocked && hoveredIdx !== idx
          : hoveredIdx !== null && hoveredIdx !== idx;

        return (
          <button
            key={idx}
            onMouseEnter={() => onHover(idx)}
            onMouseLeave={onLeave}
            onClick={() => onClick(idx)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] transition-all cursor-pointer select-none"
            style={{
              borderColor: isActive ? c.color : 'transparent',
              backgroundColor: isActive ? `${c.color}15` : 'transparent',
              opacity: dimmed ? 0.35 : 1,
              boxShadow: isLocked ? `0 0 0 2px ${c.color}40` : 'none',
            }}
          >
            <span
              className="inline-block w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: c.color }}
            />
            <span className={`${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
              {c.label}
            </span>
            <span className="text-muted-foreground text-[10px]">({c.members.length})</span>
          </button>
        );
      })}
      {lockedIdxs.size > 0 && (
        <button
          onClick={() => onClick(-1)}
          className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
        >
          Tout afficher
        </button>
      )}
    </div>
  );
}
