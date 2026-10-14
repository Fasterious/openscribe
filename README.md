# OpenScribe

**Des verbatims au rapport, preuves à l'appui.**

[**Essayer en ligne**](https://openscribe.fr) · [L'Observatoire](https://openscribe.fr/#/observatoire) · [Contribuer](CONTRIBUTING.md) · [In English](#in-english)

OpenScribe est une boîte à outils libre et gratuite pour la recherche utilisateur et l'analyse qualitative. Elle s'adresse aux chercheurs UX, aux designers, aux journalistes, aux associations et aux collectifs citoyens.

Vous importez les réponses ouvertes de vos participants (questionnaire, transcriptions d'entretiens, notes). OpenScribe en tire les motifs récurrents puis les thèmes, compte qui dit quoi, et relie chaque chiffre du rapport au verbatim exact.

![Un rapport OpenScribe : chaque motif indique combien de participants l'ont exprimé, et chaque verbatim s'ouvre sur la réponse d'origine](docs/capture-rapport.png)

## Ce qui le rend différent

- **L'IA lit et rédige, OpenScribe vérifie.** Chaque verbatim cité est retrouvé mot pour mot dans les réponses, sinon il est écarté et vous voyez lequel. Chaque idée est rangée une seule fois. Tous les chiffres sont calculés par le programme, jamais par l'IA. Un nombre cité dans une synthèse qui ne correspond à rien est signalé « À vérifier ».
- **Des participants, pas seulement des occurrences.** Huit critiques du même participant comptent pour un participant. Les avis partagés et les minorités constantes sont mis en évidence, pas noyés dans une moyenne.
- **Reproductible.** La même analyse, relancée sur les mêmes données avec les mêmes réglages, donne le même rapport, mot pour mot.
- **Vos données restent chez vous.** Pas de serveur ni de compte : tout reste dans votre navigateur. Seuls des pseudonymes (P1, P2…) et le texte des réponses partent vers le moteur d'IA que vous choisissez.
- **Votre moteur, votre clé.** Vous apportez la clé d'un fournisseur d'IA ; le projet ne voit ni vos données ni votre clé. Seuls les moteurs qui atteignent notre seuil de qualité sur un corpus réel sont proposés : aujourd'hui Google Gemini 3.5 Flash-Lite (offre gratuite, sans carte bancaire, parcours vérifié le 13 octobre 2026) et Claude Sonnet (payant). Les autres fournisseurs du catalogue, dont des moteurs qui tournent sur votre ordinateur, sont à l'étude.
- **Des rapports qui se lisent bien.** Une étape de relecture rend les synthèses fluides et naturelles. Le programme refuse toute réécriture qui toucherait à un verbatim ou à un chiffre.

## Essayer

[Ouvrez l'application](https://openscribe.fr), puis cliquez sur **Voir un exemple de rapport** : un rapport complet sur un questionnaire fictif s'affiche, sans clé ni inscription.

Pour analyser vos propres données, ouvrez **Moteurs d'IA** : un guide pas à pas vous mène jusqu'à la clé gratuite de Google Gemini.

## L'Observatoire

Chaque semaine, une consultation citoyenne publiée en données ouvertes, analysée avec OpenScribe et publiée sur le site : [#/observatoire](https://openscribe.fr/#/observatoire). Mêmes garanties que pour vos propres synthèses : verbatims exacts, participants comptés par le programme, avis minoritaires visibles, et en tête de chaque rapport ce qu'on peut en conclure et ce qu'on ne peut pas.

Première édition : l'école vue par les familles, à partir des contributions au Grand Débat national de 2019. Vous connaissez une consultation ouverte qui mériterait d'y figurer ? Proposez-la dans les [Discussions](https://github.com/Fasterious/openscribe/discussions).

## Installer en local

Il faut Node.js 20 ou plus récent.

```bash
git clone https://github.com/Fasterious/openscribe.git
cd openscribe
git checkout next
npm install
npm run dev
```

Puis ouvrez l'adresse affichée (en général http://localhost:5173).

| Commande | Rôle |
|---|---|
| `npm run dev` | Application en développement |
| `npm run build` | Version statique dans `dist/`, à déposer sur n'importe quel hébergement de fichiers |
| `npm test` | Tests des règles d'analyse |
| `npm run e2e` | Tests de parcours dans un navigateur (ordinateur et mobile) |

## Modules

| Module | État |
|---|---|
| **Synthèse** : questionnaires et transcriptions → idées, motifs, thèmes, rapport vérifiable | Disponible |
| **Entretiens et tests** : transcription d'entretiens, vidéo synchronisée avec le texte, étiquetage | Bientôt |
| **Personas** : profils construits à partir des données | Bientôt |
| **Atelier en direct**, **tests à distance** | Plus tard |

## Méthode

OpenScribe s'appuie sur des pratiques reconnues de l'analyse qualitative : unités de sens (idées atomiques), codage ouvert ou par grille, cartographie par affinités, synthèses étayées par les verbatims, et traçabilité de chaque affirmation jusqu'à sa source.

## Contribuer

Toute aide compte, même petite : un test, un message d'erreur plus clair, une traduction, une consultation à proposer pour l'Observatoire.

- Commencez par [CONTRIBUTING.md](CONTRIBUTING.md) : installation, tests, principes du projet, comment proposer une modification.
- Choisissez un ticket étiqueté [good first issue](https://github.com/Fasterious/openscribe/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) : chacun dit quoi faire, dans quels fichiers, et à quoi on reconnaît que c'est fini. Pendant Hacktoberfest, cherchez aussi l'étiquette `hacktoberfest`.
- Une question, une idée : les [Discussions](https://github.com/Fasterious/openscribe/discussions).

Une règle absolue : **aucune donnée réelle de participant dans le dépôt**, pas même dans un test.

## Licence

[AGPL-3.0-or-later](LICENSE). Vous pouvez utiliser, modifier et redistribuer OpenScribe librement. Si vous proposez une version modifiée en service en ligne, vous devez en publier le code.

## In English

**OpenScribe turns open-ended feedback into a report where every number traces back to an exact quote.**

- A free, open-source (AGPL-3.0) toolkit for user research and qualitative analysis: surveys, interview transcripts, notes → ideas, patterns, themes, report.
- The AI reads and drafts; the code checks. Every quote is matched word for word against the source, and every count is computed by the program, never by the model.
- It counts people, not mentions, and keeps minority views visible.
- Local first: no account, no server of ours. Your data stays in your browser; you bring your own AI provider key.
- Reproducible: same data, same settings, same report, word for word.
- The Observatory publishes a weekly analysis of an open-data public consultation, with the same guarantees.
- [Try it online](https://openscribe.fr): click "Voir un exemple de rapport" for a sample report, no key needed. The interface is in French for now; preparing an English version is one of our open issues.
- Want to help? Read [CONTRIBUTING.md](CONTRIBUTING.md) (it ends with an English summary) and pick an issue labelled `good first issue` or `hacktoberfest`; many are written in English.
