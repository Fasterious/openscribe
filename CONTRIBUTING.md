# Contribuer à OpenScribe

Bienvenue, et merci. OpenScribe est un outil libre de recherche utilisateur : il aide chercheurs, designers, journalistes et associations à tirer d'un ensemble de réponses ouvertes un rapport dont chaque chiffre remonte au verbatim exact d'un participant. Une contribution, même petite, compte : un défaut signalé, un test, un message d'erreur plus clair, une correction d'accessibilité, une consultation à proposer pour l'Observatoire.

*English summary at the end of this page.*

## Par où commencer

- **Un premier ticket** : un ticket est une fiche de suivi (onglet *Issues* de GitHub). Ceux qui portent l'étiquette [`good first issue`](https://github.com/Fasterious/openscribe/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) disent quoi faire, dans quels fichiers, et à quoi on reconnaît que c'est fini.
- **Avant de vous lancer**, laissez un mot sur le ticket (« je m'en occupe ») pour éviter que deux personnes fassent le même travail.
- **Une question, une idée, un doute** : les [Discussions](https://github.com/Fasterious/openscribe/discussions). Les tickets sont réservés aux défauts constatés et aux propositions précises.
- **Sans écrire de code** : signalez un défaut, proposez une amélioration ou une consultation, testez OpenScribe sur vos propres données et dites ce qui vous a gêné, proposez une meilleure formulation. Il faut seulement un compte GitHub, gratuit.

## Installer

Il faut Node.js 20 ou plus récent.

```bash
git clone https://github.com/Fasterious/openscribe.git
cd openscribe
npm install
npm run dev        # http://localhost:5173
```

Aucune clé n'est nécessaire pour développer : le moteur **Simulation**, proposé dans l'onglet d'analyse de chaque synthèse, déroule une analyse complète sans aucun appel extérieur, et le bouton **Voir un exemple de rapport** ouvre un rapport déjà calculé.

## Lancer les tests

```bash
npm test           # règles d'analyse (Vitest), moins d'une seconde
npm run e2e        # parcours utilisateur dans un vrai navigateur, sur ordinateur et sur mobile (Playwright)
npm run build      # vérification des types et version de production
npm run lint       # relecture automatique du code
```

`npm run e2e` construit l'application et la lance lui-même. La première fois, installez le navigateur de test avec `npx playwright install chromium`, ou indiquez un Chrome déjà installé :

```bash
PW_CHROMIUM="/chemin/vers/chrome" npm run e2e
```

Un test (`src/core/privacy.test.ts`) ne vérifie rien chez vous : il compare le dépôt aux données privées du mainteneur, absentes de votre machine. C'est normal.

## Les principes du projet

Ils ne se négocient pas : une modification qui en contredit un sera refusée, même si elle est bien faite.

1. **L'IA ne décide jamais.** Elle lit, découpe, nomme et rédige. Le code vérifie chaque citation, range les idées, compte les participants et calcule tous les chiffres.
2. **Tout est traçable.** Du rapport au grand thème, du grand thème au thème, du thème à l'idée, de l'idée au verbatim exact, du verbatim au participant : le lien ne se perd jamais.
3. **Les minorités restent visibles.** Un consensus n'est pas une majorité ; un avis isolé mais constant se montre.
4. **On compte des personnes**, pas seulement des occurrences : 8 critiques d'un même participant comptent pour 1 participant.
5. **Reproductible.** Mêmes données, mêmes réglages : même rapport, mot pour mot (les réponses du moteur sont gardées en cache).
6. **Local d'abord, chacun ses clés.** Aucune donnée ni aucune clé ne passe par un serveur du projet. Le projet ne paie rien à la place des utilisateurs.
7. **Moteurs interchangeables.** Aucun fournisseur d'IA n'est écrit en dur ailleurs que dans `src/core/providers/`.
8. **Simple à utiliser, puissant à maîtriser.** Les réglages avancés restent repliés par défaut.

Et deux règles de communication et de droit :

- **Aucun produit commercial concurrent n'est nommé**, ni dans le code, ni dans les messages de commit, ni dans la documentation. On cite des méthodes (analyse thématique, cartographie par affinités), pas des produits.
- **Aucun code copié** d'un projet dont la licence n'est pas compatible avec l'AGPL-3.0.

## Aucune donnée réelle de participant dans le dépôt

C'est la règle la plus importante. Les réponses de vraies personnes n'entrent jamais dans le dépôt : ni dans un test, ni dans un exemple de consigne, ni dans une capture d'écran, ni dans un ticket. Pour tester, inventez des réponses (voir `fixtures/mediatheque.csv`, un questionnaire fictif). Les données réelles que le mainteneur utilise pour éprouver la méthode restent dans `fixtures/private/`, ignoré par git. Seule exception : l'Observatoire, fait de consultations en données ouvertes, analysées telles que leur source les publie (`observatoire/`).

Pas de clé d'accès non plus, nulle part : ni dans le code, ni dans les tests, ni dans un message.

## Où se trouve quoi

| Dossier | Contenu |
|---|---|
| `src/core/` | La logique, sans interface : import des fichiers, analyse, vérification des citations, calcul des chiffres, rapport. Tout y est testé. |
| `src/core/analysis/` | Les étapes de l'analyse (`pipeline.ts`), les consignes envoyées au moteur (`prompts.ts`), les indicateurs (`metrics.ts`), le contrôle des chiffres (`numbers.ts`), le rapport (`report.ts`). |
| `src/core/import/` | Lecture des questionnaires (CSV) et des textes (transcriptions, notes). |
| `src/core/providers/` | Les fournisseurs d'IA : le catalogue (`presets.ts`), l'appel aux services compatibles OpenAI, la simulation, les limites de débit. |
| `src/core/core.test.ts` | Les tests des règles d'analyse. |
| `src/app/` | Ce qui relie la logique à l'interface : stockage dans le navigateur (IndexedDB), navigation, moteurs configurés. |
| `src/ui/` | L'interface (React, Tailwind) : accueil, synthèses, moteurs d'IA, Observatoire, et les écrans d'une synthèse dans `src/ui/project/`. |
| `e2e/` | Les parcours utilisateur joués dans un navigateur. |
| `fixtures/` | Données de test, toutes fictives. |
| `observatoire/` | Les consultations en données ouvertes : sources, analyses, notations. |
| `docs/` | Avancement, journal des décisions, méthode. |

## Proposer une modification

1. Créez une branche à partir de `main`.
2. Faites une modification à la fois : une *pull request* (PR, votre demande d'intégration sur GitHub) par sujet.
3. **Une règle d'analyse modifiée ou ajoutée s'accompagne d'un test** dans `src/core/`. Un changement d'écran se vérifie sur ordinateur et sur mobile.
4. Avant d'envoyer : `npm test`, `npm run build`, et `npm run e2e` si vous avez touché à l'interface.
5. Ouvrez la PR vers `main` et remplissez le modèle : ce qui change, pourquoi, comment vous l'avez vérifié. Une capture aide beaucoup pour un changement d'écran.

**La langue compte.** L'interface est d'abord en français, au vouvoiement, avec le vocabulaire de la recherche utilisateur : synthèse, participant, verbatim, idée, thème, grand thème, occurrences. Évitez le jargon technique dans tout texte que l'utilisateur lit. Si le français n'est pas votre langue, écrivez en anglais dans la PR : nous reprendrons la formulation avec vous.

## Proposer une consultation pour l'Observatoire

L'Observatoire analyse des consultations citoyennes publiées en données ouvertes. Pour en proposer une, ouvrez une discussion dans la catégorie [Ideas](https://github.com/Fasterious/openscribe/discussions/categories/ideas) avec :

- le lien vers les données et leur licence (une licence ouverte est obligatoire) ;
- la question posée aux participants (elle doit être ouverte et équilibrée) ;
- le nombre approximatif de réponses ;
- pourquoi elle éclaire un sujet d'actualité.

Nous choisissons un sujet pour l'éclairage qu'il apporte, jamais pour le résultat qu'on en attend.

## Signaler un problème de sécurité ou de confidentialité

N'en donnez pas le détail en public. Ouvrez un ticket qui dit seulement qu'il s'agit d'un problème de sécurité : nous conviendrons d'un moyen privé pour en parler.

## Licence

En contribuant, vous acceptez que votre contribution soit publiée sous [AGPL-3.0-or-later](LICENSE), comme le reste du projet.

---

## In English

OpenScribe is a free, open-source (AGPL-3.0) tool for user research and qualitative analysis. The interface and docs are in French first, but contributions in English are welcome: write your issue or PR in English, and we will help with the French wording.

- **Start here**: pick an issue labeled `good first issue`. Comment on it before you start. Questions go to [Discussions](https://github.com/Fasterious/openscribe/discussions).
- **Setup**: Node.js 20+, then `npm install` and `npm run dev`. No API key needed: pick the **Simulation** engine in the analysis tab of a synthesis, or click **Voir un exemple de rapport** on the home page.
- **Tests**: `npm test` (unit, Vitest), `npm run e2e` (Playwright, desktop and mobile; run `npx playwright install chromium` once), `npm run build`, `npm run lint`.
- **Where things live**: `src/core/` is pure, fully tested logic (import, analysis, quote checking, counts, report); `src/core/providers/` holds the AI provider catalog and clients; `src/ui/` is the React interface; `e2e/` the browser tests.
- **Non-negotiable principles**: the AI never decides (the code checks every quote and computes every number); everything traces back to an exact quote and a participant; minority views stay visible; we count people, not just mentions; same data and settings give the same report; local first, users bring their own keys and nothing goes through a project server; no provider is hard-coded outside `src/core/providers/`; simple to use, powerful to master, with advanced settings collapsed by default.
- **Never put real participant data** or API keys in the repo, a test, a screenshot or an issue. Use made-up data (see `fixtures/mediatheque.csv`).
- **Pull requests**: branch from `main`, one topic per PR, a test for every analysis rule you change, and target `main`.
- **Security or privacy issue**: do not post details in public. Open an issue saying only that it is a security matter, and we will agree on a private channel.
- **Do not name commercial competitors** in code, commits or docs; refer to methods instead.
- **Observatory**: suggest an open-data public consultation in the Discussions, Ideas category (link, license, question asked, number of responses).
