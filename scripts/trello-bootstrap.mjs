#!/usr/bin/env node
/**
 * Crée (ou complète) le board Trello OpenScribe à partir de scripts/trello-backlog.mjs.
 *
 * Idempotent : les listes et cartes déjà présentes (comparaison par nom) sont
 * ignorées. Le script peut donc être relancé après enrichissement du backlog.
 *
 * Identifiants — jamais en argument de ligne de commande (ils resteraient dans
 * l'historique du shell). Les mettre dans .env.local, qui est gitignoré :
 *
 *   TRELLO_KEY=...      → https://trello.com/power-ups/admin  (ou trello.com/app-key)
 *   TRELLO_TOKEN=...    → lien « Token » sur cette même page
 *
 * Usage :
 *   node scripts/trello-bootstrap.mjs --dry-run          # n'écrit rien, montre le plan
 *   node scripts/trello-bootstrap.mjs                    # crée un nouveau board
 *   node scripts/trello-bootstrap.mjs --board <id|url>   # complète un board existant
 *   node scripts/trello-bootstrap.mjs --name "Mon board" # nom du board créé
 */

import { readFileSync, existsSync } from 'node:fs';
import { LISTS, LABELS } from './trello-backlog.mjs';

// ---------- configuration ----------

function loadEnvLocal() {
  if (!existsSync('.env.local')) return;
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}
loadEnvLocal();

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const DRY = args.includes('--dry-run');
const BOARD_NAME = flag('--name') || 'OpenScribe';

const KEY = process.env.TRELLO_KEY;
const TOKEN = process.env.TRELLO_TOKEN;

if (!DRY && (!KEY || !TOKEN)) {
  console.error(`
❌ TRELLO_KEY et TRELLO_TOKEN sont requis.

   1. Ouvrir https://trello.com/power-ups/admin → créer un Power-Up → onglet « API key »
   2. Copier la clé, puis cliquer sur « Token » pour générer un jeton
   3. Les ajouter à .env.local (gitignoré) :

        TRELLO_KEY=votre_cle
        TRELLO_TOKEN=votre_jeton

   Pour voir le plan sans identifiants : node scripts/trello-bootstrap.mjs --dry-run
`);
  process.exit(1);
}

// Extrait l'identifiant depuis une URL https://trello.com/b/XXXXXXXX/nom
function parseBoardArg(v) {
  if (!v) return undefined;
  const m = v.match(/trello\.com\/b\/([A-Za-z0-9]+)/);
  return m ? m[1] : v;
}
const BOARD_ARG = parseBoardArg(flag('--board'));

// ---------- client API ----------

const BASE = 'https://api.trello.com/1';
let calls = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, params = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries({ ...params, key: KEY, token: TOKEN })) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  // Trello : 300 requêtes / 10 s / clé. On reste très en dessous.
  if (++calls % 20 === 0) await sleep(1200);

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { method });
    if (res.status === 429) { await sleep(2000 * (attempt + 1)); continue; }
    if (!res.ok) {
      throw new Error(`${method} ${path} → ${res.status} ${await res.text()}`);
    }
    return res.json();
  }
  throw new Error(`${method} ${path} → 429 après 4 tentatives`);
}

// ---------- exécution ----------

const norm = (s) => s.trim().toLowerCase();

async function main() {
  const totalCards = LISTS.reduce((n, l) => n + l.cards.length, 0);
  console.log(`\n📋 Backlog : ${LISTS.length} listes, ${totalCards} cartes\n`);

  if (DRY) {
    for (const list of LISTS) {
      console.log(`\n━━ ${list.name}`);
      for (const c of list.cards) {
        const tags = [c.owner, ...(c.tags || []), c.block ? 'block' : null].filter(Boolean);
        const where = c.done ? '✅ Fait' : list.name;
        console.log(`   • ${c.name}`);
        console.log(`     ${tags.join(' · ')}${c.check ? ` · ${c.check.length} sous-tâches` : ''}${c.done ? '  → ' + where : ''}`);
      }
    }
    console.log(`\n(dry-run — aucune écriture)\n`);
    return;
  }

  // Board
  let boardId = BOARD_ARG;
  if (boardId) {
    const b = await api('GET', `/boards/${boardId}`, { fields: 'name,url' });
    console.log(`→ Board existant : ${b.name}\n  ${b.url}\n`);
    boardId = b.id;
  } else {
    const b = await api('POST', '/boards/', {
      name: BOARD_NAME,
      defaultLists: 'false',
      desc: 'Backlog OpenScribe — généré depuis scripts/trello-backlog.mjs. Voir docs/STRATEGIE.md et docs/BACKLOG.md.',
      prefs_permissionLevel: 'private',
    });
    boardId = b.id;
    console.log(`→ Board créé : ${b.name}\n  ${b.url}\n`);
  }

  // Étiquettes
  const existingLabels = await api('GET', `/boards/${boardId}/labels`, { limit: 100 });
  const labelId = {};
  for (const [slug, def] of Object.entries(LABELS)) {
    const found = existingLabels.find((l) => norm(l.name) === norm(def.name));
    if (found) { labelId[slug] = found.id; continue; }
    const created = await api('POST', '/labels', { name: def.name, color: def.color, idBoard: boardId });
    labelId[slug] = created.id;
    console.log(`  🏷  ${def.name}`);
  }

  // Listes (dans l'ordre du backlog)
  const existingLists = await api('GET', `/boards/${boardId}/lists`, { filter: 'open' });
  const listId = {};
  let pos = 1;
  for (const list of LISTS) {
    const found = existingLists.find((l) => norm(l.name) === norm(list.name));
    if (found) { listId[list.name] = found.id; pos++; continue; }
    const created = await api('POST', '/lists', { name: list.name, idBoard: boardId, pos: pos * 1000 });
    listId[list.name] = created.id;
    pos++;
    console.log(`  📁 ${list.name}`);
  }

  const doneListName = LISTS[LISTS.length - 1].name; // « ✅ Fait »

  // Cartes
  let created = 0, skipped = 0;
  for (const list of LISTS) {
    if (!list.cards.length) continue;
    console.log(`\n━━ ${list.name}`);

    for (const card of list.cards) {
      const targetList = card.done ? doneListName : list.name;
      const idList = listId[targetList];

      const cardsInList = await api('GET', `/lists/${idList}/cards`, { fields: 'name' });
      if (cardsInList.some((c) => norm(c.name) === norm(card.name))) {
        console.log(`   ⏭  ${card.name}`);
        skipped++;
        continue;
      }

      const ids = [card.owner, ...(card.tags || []), card.block ? 'block' : null]
        .filter(Boolean).map((t) => labelId[t]).filter(Boolean);

      const desc = (list.desc ? `_${list.desc}_\n\n---\n\n` : '') + (card.desc || '');

      const made = await api('POST', '/cards', {
        name: card.name,
        desc,
        idList,
        idLabels: ids.join(','),
        pos: 'bottom',
      });

      if (card.check?.length) {
        const cl = await api('POST', `/cards/${made.id}/checklists`, { name: 'Sous-tâches' });
        for (const item of card.check) {
          await api('POST', `/checklists/${cl.id}/checkItems`, { name: item, pos: 'bottom' });
        }
      }

      console.log(`   ✓ ${card.name}${card.done ? '   → ✅ Fait' : ''}`);
      created++;
    }
  }

  const b = await api('GET', `/boards/${boardId}`, { fields: 'url' });
  console.log(`\n✅ ${created} carte(s) créée(s), ${skipped} ignorée(s) (déjà présentes)`);
  console.log(`   ${b.url}\n`);
}

main().catch((e) => { console.error('\n❌', e.message, '\n'); process.exit(1); });
