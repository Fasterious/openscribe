#!/usr/bin/env node
/**
 * Génère docs/BACKLOG.md depuis scripts/trello-backlog.mjs.
 * Le backlog reste la source de vérité unique : Trello et le Markdown en dérivent.
 *
 * Usage : node scripts/trello-backlog-md.mjs
 */

import { writeFileSync } from 'node:fs';
import { LISTS } from './trello-backlog.mjs';

const OWNER = { claude: '🤖 Claude', arnaud: '🙋 Arnaud', both: '🤝 À deux' };

const out = [];
const total = LISTS.reduce((n, l) => n + l.cards.length, 0);
const count = (p) => LISTS.reduce((n, l) => n + l.cards.filter(p).length, 0);

out.push('# Backlog OpenScribe');
out.push('');
out.push('> **Généré** — ne pas éditer à la main.');
out.push('> Source : `scripts/trello-backlog.mjs` · Régénérer : `node scripts/trello-backlog-md.mjs`');
out.push('> Pousser vers Trello : `node scripts/trello-bootstrap.mjs`');
out.push('');
out.push(`${total} cartes — **${count((c) => c.done)}** faites · `
  + `**${count((c) => !c.done && c.owner === 'claude')}** pour Claude · `
  + `**${count((c) => !c.done && c.owner === 'arnaud')}** pour Arnaud · `
  + `**${count((c) => !c.done && c.owner === 'both')}** à deux`);
out.push('');
out.push('Cadrage : [docs/STRATEGIE.md](./STRATEGIE.md) · Sécurité : [docs/SECURITE-RLS.md](./SECURITE-RLS.md)');
out.push('');

// Sommaire
out.push('## Sommaire');
out.push('');
for (const list of LISTS) {
  if (!list.cards.length) continue;
  const anchor = list.name.toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
  out.push(`- [${list.name}](#${anchor}) — ${list.cards.length} cartes`);
}
out.push('');

// Ce qui bloque, remonté en tête
const blockers = [];
for (const list of LISTS) {
  for (const c of list.cards) if (c.block && !c.done) blockers.push({ list, c });
}
if (blockers.length) {
  out.push('## 🔴 Bloquant');
  out.push('');
  out.push('Rien d\'autre n\'avance tant que ces cartes ne sont pas traitées.');
  out.push('');
  for (const { list, c } of blockers) {
    out.push(`- **${c.name}** — ${OWNER[c.owner]} · _${list.name}_`);
  }
  out.push('');
}

for (const list of LISTS) {
  if (!list.cards.length) continue;
  out.push('---');
  out.push('');
  out.push(`## ${list.name}`);
  out.push('');
  if (list.desc) { out.push(`_${list.desc}_`); out.push(''); }

  for (const card of list.cards) {
    const tags = (card.tags || []).join(', ');
    out.push(`### ${card.done ? '~~' : ''}${card.name}${card.done ? '~~' : ''}`);
    out.push('');
    out.push(`**${OWNER[card.owner]}**${tags ? ` · ${tags}` : ''}`
      + `${card.block ? ' · 🔴 **bloquant**' : ''}${card.done ? ' · ✅ **fait**' : ''}`);
    out.push('');
    if (card.desc) { out.push(card.desc); out.push(''); }
    if (card.check?.length) {
      out.push('**Sous-tâches**');
      out.push('');
      for (const i of card.check) out.push(`- [ ] ${i}`);
      out.push('');
    }
  }
}

writeFileSync('docs/BACKLOG.md', out.join('\n'));
console.log(`✅ docs/BACKLOG.md — ${total} cartes, ${blockers.length} bloquante(s)`);
