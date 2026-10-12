# OpenScribe

**Comprendre ce que les gens disent, sans perdre le fil de leurs mots.**

OpenScribe est une boîte à outils libre et gratuite pour la recherche utilisateur et l'analyse qualitative. Elle s'adresse aux chercheurs UX, aux designers, aux journalistes, aux associations et aux collectifs citoyens.

Vous importez les réponses d'un questionnaire ou la transcription d'un entretien. OpenScribe les découpe en idées, les regroupe par sujet et compte qui pense quoi. Le rapport qui en sort est vérifiable : chaque chiffre mène à la phrase exacte d'une personne.

## Ce qui le rend différent

- **L'IA lit et rédige, OpenScribe vérifie.** Chaque citation est retrouvée mot pour mot dans les réponses, sinon elle est écartée et vous voyez laquelle. Chaque idée est rangée une seule fois. Tous les chiffres sont calculés par le programme, jamais par l'IA. Un nombre cité dans une synthèse qui ne correspond à rien est signalé « À vérifier ».
- **On compte des personnes, pas des mentions.** Huit critiques de la même personne comptent pour une personne. Les avis partagés et les minorités constantes sont mis en évidence, pas noyés dans une moyenne.
- **Reproductible.** La même analyse, relancée sur les mêmes données avec les mêmes réglages, donne le même rapport, mot pour mot.
- **Vos données restent chez vous.** Pas de serveur ni de compte : tout reste dans votre navigateur. Seuls des pseudonymes (P1, P2…) et le texte des réponses partent vers le moteur d'IA que vous choisissez.
- **Votre moteur, votre clé.** Mistral, Groq, Gemini, OpenRouter, ou Ollama sur votre propre ordinateur. Plusieurs fournisseurs ont une offre gratuite. Vous ne payez que ce que vous consommez chez eux.
- **Des rapports qui se lisent bien.** Une étape de relecture rend les synthèses fluides et naturelles. Le programme refuse toute réécriture qui toucherait à une citation ou à un chiffre.

## Essayer

Ouvrez l'application, puis cliquez sur **Essayer avec un exemple** : un rapport complet sur un questionnaire fictif s'affiche, sans clé ni inscription.

Pour analyser vos propres données, ajoutez un moteur dans **Moteurs d'IA**. L'écran vous aide à choisir.

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
| **Synthèse** : questionnaires et transcriptions → idées, sujets, rapport vérifiable | Disponible |
| **Observation** : transcription d'entretiens, vidéo synchronisée avec le texte, étiquetage | Bientôt |
| **Personas** : profils construits à partir des données | Bientôt |
| **Atelier en direct**, **tests à distance** | Plus tard |

## Méthode

OpenScribe s'appuie sur des pratiques reconnues de l'analyse qualitative : unités de sens (idées atomiques), codage ouvert ou par grille, cartographie par affinités, synthèses étayées par les verbatims, et traçabilité de chaque affirmation jusqu'à sa source.

## Licence

[AGPL-3.0-or-later](LICENSE). Vous pouvez utiliser, modifier et redistribuer OpenScribe librement. Si vous proposez une version modifiée en service en ligne, vous devez en publier le code.
