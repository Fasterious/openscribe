'use client';

import { sentimentEmoji } from '@/types/csv-analysis';
import { generateMarkdown, generateHTML, downloadFile } from '@/lib/csv-analysis/export';
import type { FinalAnalysis } from '@/types/csv-analysis';

function cleanSummaryText(text: string): string {
  let cleaned = text.trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null) {
      const values = Object.values(parsed).filter((v) => typeof v === 'string');
      if (values.length > 0) return (values as string[]).join('\n\n');
    }
    if (typeof parsed === 'string') return parsed;
  } catch {
    // Not JSON
  }
  return cleaned;
}

interface FinalReportProps {
  analysis: FinalAnalysis;
  filename?: string;
}

export function FinalReport({ analysis, filename }: FinalReportProps) {
  const baseName = filename?.replace(/\.csv$/i, '') || 'analyse';

  const cleanedAnalysis: FinalAnalysis = {
    ...analysis,
    global_summary: cleanSummaryText(analysis.global_summary),
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown(cleanedAnalysis, filename);
    downloadFile(md, `${baseName}_rapport.md`, 'text/markdown;charset=utf-8');
  };

  const handleDownloadHTML = () => {
    const html = generateHTML(cleanedAnalysis, filename);
    downloadFile(html, `${baseName}_rapport.html`, 'text/html;charset=utf-8');
  };

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 className="text-lg font-semibold text-foreground">
            Résumé exécutif
          </h2>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Markdown
            </button>
            <button
              onClick={handleDownloadHTML}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              HTML
            </button>
          </div>
        </div>
        <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
          <span>{analysis.total_quintuplets} verbatims analysés</span>
          <span>{analysis.total_participants} participants</span>
          <span>{analysis.total_clusters} grands thèmes</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          {cleanSummaryText(analysis.global_summary)}
        </p>
      </div>

      {analysis.clusters.map((cluster, idx) => (
        <div
          key={idx}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">
              {idx + 1}. {cluster.title}
            </h3>
            <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
              <span>✅ {cluster.total_positive}</span>
              <span>⚠️ {cluster.total_negative}</span>
              <span>💡 {cluster.total_suggestion}</span>
              <span className="text-muted-foreground/60">
                · {cluster.unique_participants.length} participants uniques ({cluster.unique_participants.join(', ')})
              </span>
            </div>
          </div>

          <div className="divide-y divide-border/50">
            {cluster.normalized_tags.map((tag, tagIdx) => (
              <div key={tagIdx} className="px-6 py-4">
                <h4 className="font-medium text-sm text-foreground mb-3">
                  {tag.label}
                </h4>

                {tag.positive_count > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      {tag.positive_count} ✅ Positifs ({tag.quintuplets.filter(q => q.sentiment === 'positive').map(q => q.participant_id).filter((v, i, a) => a.indexOf(v) === i).length} participants : {tag.quintuplets.filter(q => q.sentiment === 'positive').map(q => q.participant_id).filter((v, i, a) => a.indexOf(v) === i).join(', ')})
                    </span>
                    <div className="mt-2 space-y-1.5 ml-2">
                      {tag.quintuplets
                        .filter((q) => q.sentiment === 'positive')
                        .map((q, i) => (
                          <p key={`${q.id}-pos-${i}`} className="text-sm text-muted-foreground">
                            {sentimentEmoji(q.sentiment)} <span className="italic">&ldquo;{q.verbatim}&rdquo;</span>
                            <span className="text-xs text-muted-foreground/60">
                              {' '}— {q.question} — {q.participant_id}
                              {q.participant_name ? ` (${q.participant_name})` : ''}
                            </span>
                          </p>
                        ))}
                    </div>
                  </div>
                )}

                {tag.negative_count > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      {tag.negative_count} ⚠️ Négatifs ({tag.quintuplets.filter(q => q.sentiment === 'negative').map(q => q.participant_id).filter((v, i, a) => a.indexOf(v) === i).length} participants : {tag.quintuplets.filter(q => q.sentiment === 'negative').map(q => q.participant_id).filter((v, i, a) => a.indexOf(v) === i).join(', ')})
                    </span>
                    <div className="mt-2 space-y-1.5 ml-2">
                      {tag.quintuplets
                        .filter((q) => q.sentiment === 'negative')
                        .map((q, i) => (
                          <p key={`${q.id}-neg-${i}`} className="text-sm text-muted-foreground">
                            {sentimentEmoji(q.sentiment)} <span className="italic">&ldquo;{q.verbatim}&rdquo;</span>
                            <span className="text-xs text-muted-foreground/60">
                              {' '}— {q.question} — {q.participant_id}
                              {q.participant_name ? ` (${q.participant_name})` : ''}
                            </span>
                          </p>
                        ))}
                    </div>
                  </div>
                )}

                {tag.suggestion_count > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      {tag.suggestion_count} 💡 Suggestions ({tag.quintuplets.filter(q => q.sentiment === 'suggestion').map(q => q.participant_id).filter((v, i, a) => a.indexOf(v) === i).length} participants : {tag.quintuplets.filter(q => q.sentiment === 'suggestion').map(q => q.participant_id).filter((v, i, a) => a.indexOf(v) === i).join(', ')})
                    </span>
                    <div className="mt-2 space-y-1.5 ml-2">
                      {tag.quintuplets
                        .filter((q) => q.sentiment === 'suggestion')
                        .map((q, i) => (
                          <p key={`${q.id}-sug-${i}`} className="text-sm text-muted-foreground">
                            {sentimentEmoji(q.sentiment)} <span className="italic">&ldquo;{q.verbatim}&rdquo;</span>
                            <span className="text-xs text-muted-foreground/60">
                              {' '}— {q.question} — {q.participant_id}
                              {q.participant_name ? ` (${q.participant_name})` : ''}
                            </span>
                          </p>
                        ))}
                    </div>
                  </div>
                )}

                {tag.summary && (
                  <div className="mt-3 bg-secondary/30 rounded-lg p-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Résumé
                    </span>
                    <p className="mt-1 text-sm text-foreground">{tag.summary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {cluster.summary && (
            <div className="px-6 py-5 border-t border-border bg-primary/5">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Synthèse — {cluster.title}
              </span>
              <p className="mt-2 text-sm text-foreground leading-relaxed">
                {cluster.summary}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
