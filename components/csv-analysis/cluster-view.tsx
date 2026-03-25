'use client';

import { useState } from 'react';
import { sentimentEmoji } from '@/types/csv-analysis';
import type { AnalysisCluster, NormalizedTag } from '@/types/csv-analysis';

function TagSection({ tag }: { tag: NormalizedTag }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 hover:bg-secondary/30 transition-colors flex items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <span className="font-medium text-foreground">{tag.label}</span>
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
            {tag.positive_count > 0 && (
              <span>✅ {tag.positive_count} ({tag.quintuplets.filter(q => q.sentiment === 'positive').map(q => q.participant_id).filter((v, i, a) => a.indexOf(v) === i).length} participants)</span>
            )}
            {tag.negative_count > 0 && (
              <span>⚠️ {tag.negative_count} ({tag.quintuplets.filter(q => q.sentiment === 'negative').map(q => q.participant_id).filter((v, i, a) => a.indexOf(v) === i).length} participants)</span>
            )}
            {tag.suggestion_count > 0 && (
              <span>💡 {tag.suggestion_count} ({tag.quintuplets.filter(q => q.sentiment === 'suggestion').map(q => q.participant_id).filter((v, i, a) => a.indexOf(v) === i).length} participants)</span>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="space-y-2">
            {tag.quintuplets.map((q) => (
              <div
                key={q.id}
                className="flex items-start gap-2 text-sm pl-2 border-l-2 border-border"
              >
                <span className="flex-shrink-0 mt-0.5">{sentimentEmoji(q.sentiment)}</span>
                <div className="min-w-0">
                  <span className="text-muted-foreground italic">&ldquo;{q.verbatim}&rdquo;</span>
                  <span className="text-xs text-muted-foreground/70">
                    {' '}— {q.question} — {q.participant_id}
                    {q.participant_name ? ` (${q.participant_name})` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {tag.summary && (
            <div className="bg-secondary/30 rounded-lg p-3 text-sm text-foreground">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Résumé du tag
              </span>
              <p className="mt-1">{tag.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ClusterViewProps {
  clusters: AnalysisCluster[];
}

export function ClusterView({ clusters }: ClusterViewProps) {
  return (
    <div className="space-y-6">
      {clusters.map((cluster, idx) => (
        <div
          key={idx}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border bg-secondary/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {idx + 1}. {cluster.title}
                </h3>
                <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>✅ {cluster.total_positive}</span>
                  <span>⚠️ {cluster.total_negative}</span>
                  <span>💡 {cluster.total_suggestion}</span>
                  <span className="text-muted-foreground/60">
                    · {cluster.unique_participants.length} participants uniques
                  </span>
                </div>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                {cluster.normalized_tags.length} tags
              </span>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {cluster.normalized_tags.map((tag, tagIdx) => (
              <TagSection key={tagIdx} tag={tag} />
            ))}
          </div>

          {cluster.summary && (
            <div className="px-5 py-4 border-t border-border bg-primary/5">
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                Résumé du cluster
              </span>
              <p className="mt-1.5 text-sm text-foreground leading-relaxed">
                {cluster.summary}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
