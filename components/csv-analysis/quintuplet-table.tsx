'use client';

import { useState, useMemo } from 'react';
import { sentimentEmoji } from '@/types/csv-analysis';
import type { Quintuplet, Sentiment } from '@/types/csv-analysis';

interface QuintupletTableProps {
  quintuplets: Quintuplet[];
}

export function QuintupletTable({ quintuplets }: QuintupletTableProps) {
  const [filterSentiment, setFilterSentiment] = useState<Sentiment | 'all'>('all');
  const [filterParticipant, setFilterParticipant] = useState<string>('all');
  const [filterQuestion, setFilterQuestion] = useState<string>('all');

  const participants = useMemo(
    () => [...new Set(quintuplets.map((q) => q.participant_id))].sort(),
    [quintuplets]
  );

  const questions = useMemo(
    () => [...new Set(quintuplets.map((q) => q.question))],
    [quintuplets]
  );

  const filtered = useMemo(() => {
    return quintuplets.filter((q) => {
      if (filterSentiment !== 'all' && q.sentiment !== filterSentiment) return false;
      if (filterParticipant !== 'all' && q.participant_id !== filterParticipant) return false;
      if (filterQuestion !== 'all' && q.question !== filterQuestion) return false;
      return true;
    });
  }, [quintuplets, filterSentiment, filterParticipant, filterQuestion]);

  const counts = useMemo(() => ({
    positive: quintuplets.filter((q) => q.sentiment === 'positive').length,
    negative: quintuplets.filter((q) => q.sentiment === 'negative').length,
    suggestion: quintuplets.filter((q) => q.sentiment === 'suggestion').length,
  }), [quintuplets]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-foreground">
          {filtered.length} / {quintuplets.length} quintuplets
        </span>
        <span className="text-xs text-muted-foreground">
          ✅ {counts.positive} &middot; ⚠️ {counts.negative} &middot; 💡 {counts.suggestion}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filterSentiment}
          onChange={(e) => setFilterSentiment(e.target.value as Sentiment | 'all')}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background"
        >
          <option value="all">Tous sentiments</option>
          <option value="positive">✅ Positif</option>
          <option value="negative">⚠️ Négatif</option>
          <option value="suggestion">💡 Suggestion</option>
        </select>

        <select
          value={filterParticipant}
          onChange={(e) => setFilterParticipant(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background"
        >
          <option value="all">Tous participants</option>
          {participants.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={filterQuestion}
          onChange={(e) => setFilterQuestion(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background max-w-xs"
        >
          <option value="all">Toutes questions</option>
          {questions.map((q) => (
            <option key={q} value={q}>{q.length > 60 ? q.slice(0, 60) + '…' : q}</option>
          ))}
        </select>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 text-left">
                <th className="px-3 py-2.5 font-medium text-muted-foreground w-8"></th>
                <th className="px-3 py-2.5 font-medium text-muted-foreground">Tag</th>
                <th className="px-3 py-2.5 font-medium text-muted-foreground">Verbatim</th>
                <th className="px-3 py-2.5 font-medium text-muted-foreground">Question</th>
                <th className="px-3 py-2.5 font-medium text-muted-foreground">Participant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((q) => (
                <tr key={q.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-3 py-2.5 text-center">
                    {sentimentEmoji(q.sentiment)}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
                    {q.tag}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground max-w-md">
                    <span className="italic">&ldquo;{q.verbatim}&rdquo;</span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground max-w-xs truncate">
                    {q.question}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                    {q.participant_id}
                    {q.participant_name ? ` (${q.participant_name})` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Aucun quintuplet ne correspond aux filtres sélectionnés.
          </div>
        )}
      </div>
    </div>
  );
}
