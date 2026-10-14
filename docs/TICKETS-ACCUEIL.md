# Tickets d'accueil (good first issue)

Douze tickets prêts à créer sur GitHub, pour accueillir de nouveaux contributeurs
(et Hacktoberfest, jusqu'au 31 octobre). Chacun a été vérifié dans le code le
14/10/2026 : le défaut ou le manque existe, et le travail tient en une PR courte.
Les numéros de ligne bougent : les tickets citent des fonctions et des textes, pas des lignes.

Étiquettes à créer une fois : `good first issue`, `hacktoberfest`, et les domaines
`interface`, `accessibilité`, `tests`, `import`, `fournisseurs`, `messages`, `traduction`, `outillage`.
Ajouter aussi le sujet (topic) `hacktoberfest` au dépôt.

Pour les créer d'un coup : copier chaque bloc dans `gh issue create --title "…" --label "…" --body-file -`.

---

## 1. Confirmer avant de supprimer un moteur d'IA / Ask before deleting an AI engine

**Étiquettes** : good first issue, hacktoberfest, interface

**Contexte.** Sur la page « Moteurs d'IA », l'icône corbeille d'un moteur le supprime aussitôt, avec la clé enregistrée dans ce navigateur. Un clic de trop, et il faut retourner chez le fournisseur recréer une clé. C'est un point « Reste, non bloquant » de `docs/AVANCEMENT.md`.

**À faire.**
- Au clic sur la corbeille, ouvrir une boîte de dialogue (le composant `Dialog` de `src/ui/primitives.tsx`) : titre « Supprimer ce moteur ? », texte « La clé de « {nom} » enregistrée dans ce navigateur sera effacée. Vos synthèses ne sont pas touchées. », boutons « Annuler » et « Supprimer ».
- Échap et « Annuler » ferment sans rien supprimer.
- Ajouter un parcours dans `e2e/parcours.spec.ts` : annuler garde le moteur, confirmer le retire.

**Fichiers.** `src/ui/Settings.tsx` (le bouton qui appelle `removeEngine`), `src/ui/primitives.tsx`, `e2e/parcours.spec.ts`.

**Fini quand.** Aucun moteur ne disparaît sans confirmation ; `npm run e2e` passe sur ordinateur et sur mobile.

---

## 2. Deux synthèses créées le même jour portent le même nom / Same default name for two syntheses created the same day

**Étiquettes** : good first issue, hacktoberfest, interface, tests

**Contexte.** Quand on crée une synthèse sans lui donner de nom, elle s'appelle « Synthèse du {date} ». Deux synthèses créées le même jour ont donc le même nom dans la liste, et on ne sait plus laquelle ouvrir. Point « Reste, non bloquant » de `docs/AVANCEMENT.md`.

**À faire.**
- Écrire une fonction pure `uniqueName(base, existingNames)` dans `src/core/project.ts` : renvoie `base` s'il est libre, sinon `base (2)`, `base (3)`…
- L'utiliser dans `NewStudyDialog` (`src/ui/Synthesis.tsx`), avec les noms des synthèses existantes (`useProjects`).
- Tester la fonction dans `src/core/core.test.ts` (nom libre, un doublon, deux doublons, un trou dans la suite).

**Fichiers.** `src/core/project.ts`, `src/core/core.test.ts`, `src/ui/Synthesis.tsx`.

**Fini quand.** Deux synthèses sans nom créées le même jour ont deux noms différents ; un nom choisi par l'utilisateur n'est jamais modifié ; `npm test` passe.

---

## 3. « Reprendre repart de là » alors qu'on ne peut plus reprendre / Interrupted analysis promises a resume that is not available

**Étiquettes** : good first issue, hacktoberfest, interface, messages

**Contexte.** Quand une analyse a été interrompue, l'onglet Analyse affiche « Analyse interrompue. Ce qui a été fait est conservé : « Reprendre » repart de là. » Mais si le moteur de cette analyse a été supprimé entre-temps, le bouton « Reprendre » n'apparaît pas (une autre ligne dit de relancer) : le message promet un bouton absent. Point « Reste, non bloquant » de `docs/AVANCEMENT.md`.

**À faire.**
- Dans `src/ui/project/AnalysisTab.tsx`, passer à `RunView` l'information « reprise possible » (calculée dans `AnalysisTab` : `canResume && resumeEngine`).
- Quand la reprise n'est pas possible, afficher : « Analyse interrompue. Ce qui a été fait est conservé, mais le moteur de cette analyse n'est plus configuré : ajoutez-le de nouveau pour reprendre, ou relancez une analyse. »

**Fichiers.** `src/ui/project/AnalysisTab.tsx`.

**Fini quand.** Le message ne mentionne « Reprendre » que si le bouton est affiché ; vérifié à la main (lancer une analyse avec un moteur, l'arrêter, supprimer le moteur, revenir sur l'onglet) ; `npm run build` passe.

---

## 4. Délai dépassé : ne pas accuser la connexion / Timeout message wrongly blames the user's connection

**Labels**: good first issue, hacktoberfest, messages, fournisseurs

**Context.** When an online AI service does not answer within the time limit, OpenScribe says (in French) "X does not answer (timeout). Check your connection; a corporate network may block this service." In real use (see `docs/PARCOURS-FOURNISSEURS.md`, Gemini, step 5) the cause was an overloaded model, not the network. The user checks their Wi-Fi for nothing. Listed as pending in `docs/AVANCEMENT.md`.

**What to do.**
- In `src/core/providers/openai-compatible.ts`, in the `limit.timedOut()` branch for non-local services, replace the message with: « {label} n'a pas répondu à temps. Le service est peut-être très demandé : reprenez l'analyse dans quelques minutes, ce qui a été fait est conservé. Si cela se répète, vérifiez votre connexion. »
- Keep the local-engine message unchanged.
- Add a test in `src/core/providers/presets.test.ts`: a `fetchImpl` that never resolves (but rejects when its `signal` aborts) and a small `timeoutMs`; check the message no longer starts with the connection.

**Files.** `src/core/providers/openai-compatible.ts`, `src/core/providers/presets.test.ts`.

**Done when.** The new message is shown on timeout; `npm test` passes. French wording can be adjusted in review, write it in English in the PR if you prefer.

---

## 5. Tests pour la lecture des réponses JSON / Unit tests for JSON response parsing

**Labels**: good first issue, hacktoberfest, tests

**Context.** AI models often wrap their JSON in code fences or add a sentence before it. `src/core/analysis/json.ts` (`extractJsonText`, `parseJson`, `JsonShapeError`) cleans this up before the code checks the shape with zod. Every step of the analysis depends on it, yet it has no direct test (it is only exercised through the full pipeline).

**What to do.** Create `src/core/analysis/json.test.ts` covering:
- a JSON object inside a ```` ```json ```` fence, and inside a bare ```` ``` ```` fence;
- text before and after the object; a top-level array;
- no JSON at all, and invalid JSON → `JsonShapeError` with the French message « n'est pas un JSON valide »;
- valid JSON with the wrong shape → `JsonShapeError` whose message names the faulty path.

**Files.** `src/core/analysis/json.ts` (read only, unless a test reveals a bug: then open a separate issue), new `src/core/analysis/json.test.ts`.

**Done when.** At least 6 cases, `npm test` passes, no change to `json.ts` behaviour.

---

## 6. Tests de la sérialisation stable (clé du cache) / Unit tests for stable serialization (cache key)

**Labels**: good first issue, hacktoberfest, tests

**Context.** Reproducibility is a core promise: same data and settings give the same report, word for word, because model answers are cached. The cache key is built with `stableStringify` and `sha256` from `src/core/ids.ts`. If two equal objects ever serialized differently, the cache would miss and the report could change. These functions have no test.

**What to do.** Create `src/core/ids.test.ts` covering:
- key order does not matter (`{a, b}` and `{b, a}` give the same string), at every nesting level;
- `undefined` properties are dropped, `null` is kept;
- array order is kept;
- `sha256('abc')` returns the standard test vector `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`;
- `randomId('p')` starts with `p_` and two calls differ.

**Files.** `src/core/ids.ts` (read only), new `src/core/ids.test.ts`.

**Done when.** `npm test` passes with the new file.

---

## 7. Contrôle de cohérence du catalogue des fournisseurs / Consistency test for the AI provider catalog

**Étiquettes** : good first issue, hacktoberfest, tests, fournisseurs

**Contexte.** `src/core/providers/presets.ts` décrit 19 fournisseurs (adresse, page des clés, guide pas à pas, modèles). Ces fiches changent souvent, à la main. Une faute de frappe (identifiant en double, lien en `http://`, guide vide) passerait inaperçue jusqu'à ce qu'un utilisateur bloque.

**À faire.** Ajouter dans `src/core/providers/presets.test.ts` un `describe('catalogue')` qui vérifie, pour chaque fournisseur :
- identifiants uniques (fournisseurs, et modèles au sein d'un fournisseur) ;
- `baseUrl` en `https://`, sauf les moteurs locaux (`localhost`, `127.0.0.1`) et le service personnalisé (`custom`, adresse vide) ;
- `keyUrl` présent quand `needsKey` est vrai (sauf `custom`), et en `https://` ;
- au moins une étape dans `steps`, et chaque lien d'étape en `https://`.

Vérifié le 14/10 : le catalogue actuel passe ces règles (seul `custom` n'a pas de `keyUrl`, ce qui est voulu).

**Fichiers.** `src/core/providers/presets.test.ts`.

**Fini quand.** `npm test` passe ; casser volontairement une fiche (lien en `http://`) fait échouer le test.

---

## 8. Import CSV : les colonnes d'heure et de durée prises pour des profils / CSV import: start/end time and duration columns detected as profile attributes

**Étiquettes** : good first issue, hacktoberfest, import, tests

**Contexte.** Beaucoup d'outils de questionnaire exportent des colonnes « Heure de début », « Heure de fin », « Durée », « Start time », « Completion time ». OpenScribe les propose aujourd'hui comme **attributs** (des profils de participants servant aux segments), au lieu de les ignorer. Vérifié le 14/10 avec un CSV fictif : « Heure de début », « Heure de fin », « Durée (s) » et « Start time » ressortent en `attribute`. L'utilisateur doit les décocher une à une.

**À faire.**
- Dans `src/core/import/csv.ts`, compléter l'expression `TECHNICAL_HEADER` pour reconnaître, en français et en anglais : heure / date de début et de fin, durée, start / end time, start / end date, completion time, last modified (time).
- Ajouter un test dans `src/core/core.test.ts` (`describe('import CSV')`) avec un petit CSV **inventé** contenant ces colonnes et une colonne de réponse ouverte : les premières sont `ignore`, la réponse reste `open`.
- Veiller à ne pas attraper une vraie question (« Combien de temps avez-vous attendu ? » doit rester une réponse).

**Fichiers.** `src/core/import/csv.ts`, `src/core/core.test.ts`.

**Fini quand.** Le test passe, les tests existants aussi (`npm test`).

---

## 9. Lien « Aller au contenu » pour la navigation au clavier / "Skip to content" link

**Étiquettes** : good first issue, hacktoberfest, accessibilité

**Contexte.** L'en-tête de l'application compte une dizaine d'éléments focalisables (logo, modules, moteurs d'IA). Une personne qui navigue au clavier ou avec un lecteur d'écran doit tous les traverser, sur chaque page, avant d'atteindre le contenu. Il n'existe pas de lien d'évitement.

**À faire.**
- Dans `src/ui/App.tsx`, ajouter en tout premier un lien « Aller au contenu » pointant vers le `<main>` : invisible tant qu'il n'a pas le focus (`sr-only` + `focus:not-sr-only`, avec un style lisible quand il apparaît).
- Donner au `<main>` un `id` et `tabIndex={-1}` pour qu'il reçoive le focus. Attention : la navigation utilise le fragment d'adresse (`#/synthese`) ; le lien doit déplacer le focus par un gestionnaire de clic (`main.focus()`), sans changer l'adresse.
- Ajouter un parcours dans `e2e/parcours.spec.ts` : la première tabulation atteint le lien, Entrée met le focus dans le contenu, l'adresse ne change pas.

**Fichiers.** `src/ui/App.tsx`, `e2e/parcours.spec.ts`.

**Fini quand.** Vérifié au clavier sur ordinateur ; `npm run e2e` passe.

---

## 10. Un titre de page par écran / A page title for each screen

**Labels**: good first issue, hacktoberfest, accessibilité

**Context.** The browser tab always reads « OpenScribe — des verbatims au rapport », whatever the screen: home, a synthesis, AI engines, the Observatory. Screen reader users hear the page title first on navigation, and people with several tabs open cannot tell them apart. `document.title` is never set (routing is hash-based, see `src/app/router.ts`).

**What to do.**
- Add a small hook (for instance `usePageTitle(title)` in `src/ui/`) that sets `document.title` to `{title} · OpenScribe`, and use it on each screen: « Accueil », « Vos synthèses », « Moteurs d'IA », « Observatoire », and for a synthesis its name followed by the tab (« Données », « Analyse », « Rapport »).
- Keep the current title for the home page if you prefer: it is the one search engines show.
- Add an e2e check in `e2e/parcours.spec.ts` that the title changes when you navigate to « Moteurs d'IA ».

**Files.** `src/ui/App.tsx`, the screens in `src/ui/` and `src/ui/project/ProjectPage.tsx`, `e2e/parcours.spec.ts`.

**Done when.** Each screen has a distinct title; `npm run e2e` passes.

---

## 11. Préparer la traduction : centraliser les textes du cadre de l'application / Prepare the English UI: move the app shell's strings to one file

**Labels**: good first issue, hacktoberfest, traduction

**Context.** The interface is French first, and an English version is wanted (our Hacktoberfest audience is mostly English-speaking). Today every string is written inline in the React components, so there is nothing to translate yet. This issue is the first, small step: move the strings of the app shell into one file, without changing anything on screen. Later issues will do the same screen by screen, then add `en`.

**What to do.**
- Create `src/ui/texts/fr.ts` exporting a typed object (`as const`), no i18n library for now. Group keys by area: `nav` (Accueil, Synthèse, Observatoire, Entretiens, Personas, Ateliers, Moteurs d'IA, « ce module n'est pas encore disponible »), `footer`, `notFound`.
- Use it in `src/ui/App.tsx` for the header, footer and not-found page. Strings with a variable (engine name) become small functions in the same file.
- Explain the convention in three lines at the top of `fr.ts`.

**Files.** new `src/ui/texts/fr.ts`, `src/ui/App.tsx`.

**Done when.** No visible change in the app; `npm run build` and `npm run e2e` pass. Comment on the issue before starting: the structure will be reused everywhere, so we agree on it first.

---

## 12. Intégration continue : tests à chaque PR / Continuous integration: run checks on every pull request

**Labels**: good first issue, hacktoberfest, outillage

**Context.** There is no CI yet. Contributors and reviewers have no automatic signal that a PR keeps the analysis rules green. Checked on 14/10: `npm test` passes (111 tests, one skipped by design), `npm run lint` exits with warnings only, `npm run build` is the type check.

**What to do.**
- Add `.github/workflows/ci.yml`, triggered on `pull_request` and on `push` to `next`.
- One job on `ubuntu-latest`, Node 22, `npm ci`, then `npm run lint`, `npm test`, `npm run build`. Cache npm with `actions/setup-node`.
- Never use a secret or an API key: the tests do not need one.
- Optional, as a second job: `npx playwright install --with-deps chromium` then `npm run e2e`.

**Files.** new `.github/workflows/ci.yml`; a line in `CONTRIBUTING.md` saying the checks run on every PR.

**Done when.** The workflow runs green on the PR that adds it.
