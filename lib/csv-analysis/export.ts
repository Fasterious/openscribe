import type { FinalAnalysis, NormalizedTag, Quintuplet } from '@/types/csv-analysis';

function uniqueParticipants(quintuplets: Quintuplet[], sentiment: string): string[] {
  return quintuplets
    .filter((q) => q.sentiment === sentiment)
    .map((q) => q.participant_id)
    .filter((v, i, a) => a.indexOf(v) === i);
}

function verbatimLine(q: Quintuplet): string {
  const emoji = q.sentiment === 'positive' ? '✅' : q.sentiment === 'negative' ? '⚠️' : '💡';
  const name = q.participant_name ? ` (${q.participant_name})` : '';
  return `${emoji} "${q.verbatim}" — ${q.question} — ${q.participant_id}${name}`;
}

function renderTagMarkdown(tag: NormalizedTag): string {
  const lines: string[] = [];
  lines.push(`#### ${tag.label}\n`);

  if (tag.summary) {
    lines.push(`> **Résumé :** ${tag.summary}\n`);
  }

  const sentiments: { key: string; label: string; emoji: string }[] = [
    { key: 'positive', label: 'Positifs', emoji: '✅' },
    { key: 'negative', label: 'Négatifs', emoji: '⚠️' },
    { key: 'suggestion', label: 'Suggestions', emoji: '💡' },
  ];

  for (const s of sentiments) {
    const items = tag.quintuplets.filter((q) => q.sentiment === s.key);
    if (items.length === 0) continue;
    const participants = uniqueParticipants(tag.quintuplets, s.key);
    lines.push(
      `**${items.length} ${s.emoji} ${s.label}** (${participants.length} participants : ${participants.join(', ')})\n`
    );
    for (const q of items) {
      lines.push(`- ${verbatimLine(q)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function generateMarkdown(analysis: FinalAnalysis, filename?: string): string {
  const lines: string[] = [];

  lines.push(`# Analyse Qualitative${filename ? ` — ${filename}` : ''}\n`);
  lines.push(
    `> ${analysis.total_quintuplets} verbatims analysés · ${analysis.total_participants} participants · ${analysis.total_clusters} grands thèmes\n`
  );

  lines.push(`## Résumé exécutif\n`);
  lines.push(`${analysis.global_summary}\n`);

  lines.push(`---\n`);

  for (let i = 0; i < analysis.clusters.length; i++) {
    const cluster = analysis.clusters[i];
    lines.push(`## ${i + 1}. ${cluster.title}\n`);
    lines.push(
      `✅ ${cluster.total_positive} · ⚠️ ${cluster.total_negative} · 💡 ${cluster.total_suggestion} · ${cluster.unique_participants.length} participants uniques (${cluster.unique_participants.join(', ')})\n`
    );

    if (cluster.summary) {
      lines.push(`### Synthèse — ${cluster.title}\n`);
      lines.push(`${cluster.summary}\n`);
    }

    for (const tag of cluster.normalized_tags) {
      lines.push(renderTagMarkdown(tag));
    }

    lines.push(`---\n`);
  }

  return lines.join('\n');
}

export function generateHTML(analysis: FinalAnalysis, filename?: string): string {
  const md = generateMarkdown(analysis, filename);

  const htmlBody = md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (\d+\. .+)$/gm, '<h2>$1</h2>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^> \*\*(.+?)\*\* (.+)$/gm, '<blockquote><strong>$1</strong> $2</blockquote>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/^---$/gm, '<hr />')
    .split('\n\n')
    .map((block) => {
      if (
        block.startsWith('<h') ||
        block.startsWith('<ul') ||
        block.startsWith('<blockquote') ||
        block.startsWith('<hr')
      ) {
        return block;
      }
      if (block.trim()) return `<p>${block}</p>`;
      return '';
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Analyse Qualitative${filename ? ` — ${filename}` : ''}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; color: #1a1a2e; line-height: 1.6; }
    h1 { color: #2F40C2; border-bottom: 2px solid #2F40C2; padding-bottom: 0.5rem; }
    h2 { color: #2F40C2; margin-top: 2rem; }
    h3 { color: #4a5568; }
    h4 { color: #2d3748; margin-bottom: 0.5rem; }
    blockquote { background: #f0f4ff; border-left: 4px solid #2F40C2; padding: 0.75rem 1rem; margin: 1rem 0; border-radius: 0 8px 8px 0; }
    ul { padding-left: 1.5rem; }
    li { margin-bottom: 0.4rem; font-size: 0.95rem; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0; }
    strong { color: #2d3748; }
    p { margin: 0.5rem 0; }
  </style>
</head>
<body>
${htmlBody}
</body>
</html>`;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
