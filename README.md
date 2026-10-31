# OpenScribe

**Des verbatims au rapport, preuves à l'appui.**

OpenScribe est une boîte à outils libre et gratuite pour la recherche utilisateur et l'analyse qualitative. Elle s'adresse aux chercheurs UX, aux designers, aux journalistes, aux associations et aux collectifs citoyens.

Vous importez les réponses ouvertes de vos participants (questionnaire, transcriptions d'entretiens, notes). OpenScribe en tire les motifs récurrents puis les thèmes, compte qui dit quoi, et relie chaque chiffre du rapport au verbatim exact.

## Ce qui le rend différent

- **L'IA lit et rédige, OpenScribe vérifie.** Chaque verbatim cité est retrouvé mot pour mot dans les réponses, sinon il est écarté et vous voyez lequel. Chaque idée est rangée une seule fois. Tous les chiffres sont calculés par le programme, jamais par l'IA. Un nombre cité dans une synthèse qui ne correspond à rien est signalé « À vérifier ».
- **Des participants, pas seulement des occurrences.** Huit critiques du même participant comptent pour un participant. Les avis partagés et les minorités constantes sont mis en évidence, pas noyés dans une moyenne.
- **Reproductible.** La même analyse, relancée sur les mêmes données avec les mêmes réglages, donne le même rapport, mot pour mot.
- **Vos données restent chez vous.** Pas de serveur ni de compte : tout reste dans votre navigateur. Seuls des pseudonymes (P1, P2…) et le texte des réponses partent vers le moteur d'IA que vous choisissez.
- **Votre moteur, votre clé.** Mistral, Groq, Gemini, OpenRouter, ou Ollama sur votre propre ordinateur. Plusieurs fournisseurs ont une offre gratuite. Vous ne payez que ce que vous consommez chez eux.
- **Des rapports qui se lisent bien.** Une étape de relecture rend les synthèses fluides et naturelles. Le programme refuse toute réécriture qui toucherait à un verbatim ou à un chiffre.

## Essayer

Ouvrez l'application, puis cliquez sur **Voir un exemple de rapport** : un rapport complet sur un questionnaire fictif s'affiche, sans clé ni inscription.

Pour analyser vos propres données, choisissez un moteur dans **Moteurs d'IA** : un guide pas à pas vous mène jusqu'à la clé gratuite (Groq, Mistral) ou à l'installation d'Ollama.

## Installer en local

Il faut Node.js 20 ou plus récent.

```bash
git clone https://github.com/Fasterious/openscribe.git
cd openscribe
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

## Licence

[AGPL-3.0-or-later](LICENSE). Vous pouvez utiliser, modifier et redistribuer OpenScribe librement. Si vous proposez une version modifiée en service en ligne, vous devez en publier le code.
