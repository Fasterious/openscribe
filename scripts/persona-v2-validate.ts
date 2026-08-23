/**
 * Persona V2 — validation harness runner (§5 of THESE-PERSONA-V3.md).
 *
 * Usage: npx tsx scripts/persona-v2-validate.ts
 *
 * Loads the labelled demo (public/samples/persona-demo-50.csv), runs the
 * method × score table (ARI / purity / NMI) against ground truth, then sweeps
 * synthetic data to show robustness curves. No API keys required.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runHarness } from '@/lib/persona-v2/validation/harness';
import { runPersonaV2 } from '@/lib/persona-v2/engine';
import { generateSynthetic } from '@/lib/persona-v2/validation/synthetic';
import { scorePartition } from '@/lib/persona-v2/validation/metrics';
import { v1Labels } from '@/lib/persona-v2/validation/baselines';

function parseDemo(): { values: number[][]; truth: string[]; columnNames: string[] } {
  const csv = readFileSync(
    join(process.cwd(), 'public/samples/persona-demo-50.csv'),
    'utf-8'
  ).trim();
  const lines = csv.split(/\r?\n/);
  const header = lines[0].split(',');
  const idCol = header.indexOf('Répondant') >= 0 ? header.indexOf('Répondant') : 0;
  const truthCol = header.indexOf('Persona') >= 0 ? header.indexOf('Persona') : 1;
  const numericCols = header
    .map((_, i) => i)
    .filter((i) => i !== idCol && i !== truthCol);

  const values: number[][] = [];
  const truth: string[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = lines[r].split(',');
    if (cells.length < header.length) continue;
    values.push(numericCols.map((i) => Number(cells[i])));
    truth.push(cells[truthCol]);
  }
  return { values, truth, columnNames: numericCols.map((i) => header[i]) };
}

function pct(x: number): string {
  return (x >= 0 ? ' ' : '') + x.toFixed(3);
}

function printTable(title: string, rows: { name: string; ari: number; purity: number; nmi: number; k: number; note?: string }[]) {
  console.log(`\n${title}`);
  console.log('─'.repeat(78));
  console.log(
    'Méthode'.padEnd(34) + 'ARI'.padStart(8) + 'Pureté'.padStart(9) + 'NMI'.padStart(8) + '  k' + '   note'
  );
  console.log('─'.repeat(78));
  for (const r of rows) {
    console.log(
      r.name.padEnd(34) +
        pct(r.ari).padStart(8) +
        pct(r.purity).padStart(9) +
        pct(r.nmi).padStart(8) +
        String(r.k).padStart(4) +
        (r.note ? `   ${r.note}` : '')
    );
  }
  console.log('─'.repeat(78));
}

function main() {
  console.log('\n=== Persona V2 — Validation harness (vérité terrain 50×5) ===');
  const { values, truth, columnNames } = parseDemo();
  console.log(`Chargé : ${values.length} répondants × ${columnNames.length} questions.`);
  console.log(`Vérité terrain : ${new Set(truth).size} groupes (${[...new Set(truth)].join(' ')}).`);

  const harness = runHarness({ values, truthLabels: truth, columnNames });
  printTable(
    `Tableau méthode × score (true k = ${harness.trueK})`,
    harness.methods.map((m) => ({
      name: m.name,
      ari: m.scores.ari,
      purity: m.scores.purity,
      nmi: m.scores.nmi,
      k: m.scores.foundK,
      note: m.note,
    }))
  );

  // Detail of the V2 run.
  const respondents = values.map((v, i) => ({ id: `R${i}`, values: v }));
  const res = runPersonaV2({ respondents, columnNames, truthLabels: truth });
  console.log(`\nDétail Persona V2 :`);
  console.log(`  Cœur de cible : ${res.coreTarget.verdict}`);
  console.log(`  Personas      : ${res.personas.length} · couverture ${Math.round(res.modelSelection.coverage * 100)}% · classe U ${res.noise.memberIndices.length}`);
  console.log(`  Silhouette subspace ${res.modelSelection.subspaceSilhouette} · stabilité ${res.modelSelection.stability}`);
  res.personas.forEach((p) => {
    const sig = p.subspace.map((s) => `${s.columnName}${s.direction === 'high' ? '↑' : s.direction === 'low' ? '↓' : '~'}`).join(' ');
    console.log(`   • ${p.label}: ${p.size} membres · surprise ${p.surprise} · lift ${p.lift} · cohésion ${p.cohesion} · stab ${p.stability} · [${sig}]`);
  });
  console.log('  Front de Pareto :');
  res.modelSelection.paretoFront.forEach((s) =>
    console.log(`   • λ=${s.lambda} (${s.label}): ${s.personaCount} personas, couverture ${s.coverage}, spécificité ${s.avgSpecificity}, silhouette ${s.subspaceSilhouette}`)
  );

  // Effect of ipsatisation toggle.
  const ipsa = runPersonaV2({ respondents, columnNames, truthLabels: truth }, { prep: 'ipsative' });
  console.log(`\n  Ablation ipsatisation : brut ARI ${res.validation?.v2.ari} → ipsatisé ARI ${ipsa.validation?.v2.ari}`);

  // --- Synthetic robustness sweeps ---------------------------------------
  console.log('\n=== Courbes de robustesse (données synthétiques) ===');

  const noiseSweep = [0, 4, 8, 16, 24].map((noiseVars) => {
    const d = generateSynthetic({ n: 240, p: 12 + noiseVars, truePersonas: 4, noiseVars, randomFrac: 0.08, seed: 11 });
    const r = runPersonaV2({ respondents: d.values.map((v, i) => ({ id: `R${i}`, values: v })), columnNames: d.columnNames, truthLabels: d.labels });
    return { name: `+${noiseVars} questions bruit`, ari: r.validation?.v2.ari ?? 0, purity: r.validation?.v2.purity ?? 0, nmi: r.validation?.v2.nmi ?? 0, k: r.personas.length, note: r.backendUsed };
  });
  printTable('ARI vs nombre de variables de bruit', noiseSweep);

  const outlierSweep = [0, 0.1, 0.2, 0.35, 0.5].map((randomFrac) => {
    const d = generateSynthetic({ n: 240, p: 16, truePersonas: 4, noiseVars: 4, randomFrac, seed: 13 });
    const respo = d.values.map((v, i) => ({ id: `R${i}`, values: v }));
    const r = runPersonaV2({ respondents: respo, columnNames: d.columnNames, truthLabels: d.labels });
    const v1 = scorePartition(v1Labels(d.values, d.columnNames, 'subspace-cohesion'), d.labels);
    return { name: `${Math.round(randomFrac * 100)}% aléatoires`, ari: r.validation?.v2.ari ?? 0, purity: r.validation?.v2.purity ?? 0, nmi: r.validation?.v2.nmi ?? 0, k: r.personas.length, note: `${r.backendUsed} · v1 ARI ${v1.ari}` };
  });
  printTable('ARI vs % de répondants aléatoires (avec comparaison v1)', outlierSweep);

  const styleSweep = [0, 0.5, 1].flatMap((styleIntensity) => {
    const d = generateSynthetic({ n: 240, p: 16, truePersonas: 4, noiseVars: 4, randomFrac: 0.05, styleIntensity, seed: 17 });
    const respo = d.values.map((v, i) => ({ id: `R${i}`, values: v }));
    const raw = runPersonaV2({ respondents: respo, columnNames: d.columnNames, truthLabels: d.labels }, { prep: 'raw' });
    const ips = runPersonaV2({ respondents: respo, columnNames: d.columnNames, truthLabels: d.labels }, { prep: 'ipsative' });
    return [
      { name: `style ${styleIntensity} · brut`, ari: raw.validation?.v2.ari ?? 0, purity: raw.validation?.v2.purity ?? 0, nmi: raw.validation?.v2.nmi ?? 0, k: raw.personas.length },
      { name: `style ${styleIntensity} · ipsatisé`, ari: ips.validation?.v2.ari ?? 0, purity: ips.validation?.v2.purity ?? 0, nmi: ips.validation?.v2.nmi ?? 0, k: ips.personas.length },
    ];
  });
  printTable("ARI vs intensité du style de réponse (brut vs ipsatisé)", styleSweep);

  console.log('\n✓ Validation terminée.\n');
}

main();
