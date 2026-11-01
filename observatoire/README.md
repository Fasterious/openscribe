# L'Observatoire

L'Observatoire d'OpenScribe analyse des consultations publiques en données ouvertes, sans intervention humaine, et
publie le résultat avec sa méthode et ses limites. C'est la preuve publique de la méthode et son banc d'essai : chaque
étude est notée à l'aveugle, et ce qu'elle révèle améliore l'algorithme, le même pour l'Observatoire et la Synthèse.

Les études publiées se lisent sur [openscribe.fr](https://www.openscribe.fr/#/observatoire). Ce dossier contient de quoi
les vérifier et les refaire.

## Ce qu'il contient

| Chemin | Contenu |
|---|---|
| `JOURNAL.md` | Le journal des études : passes, notes, décisions. |
| `sources/` | Pour chaque consultation : l'adresse et l'empreinte du fichier officiel (`*.source.json`) et ses colonnes utiles, compressées (`*.colonnes.csv.gz`). Le fichier complet est trop lourd pour le dépôt. |
| `2026-10-ecole/` | L'école vue par les familles (Grand débat national, 2019) : la fiche publiée (`fiche.json`), l'échantillon et son tirage, les notes de chaque passe (`notes.json`), les rapports et notations des passes 1 à 17 (`run-opus-*/`), l'essai « boucle unique » (`essai-boucle/`). |
| `2026-10-ecole/essai-boucle/A-corrections-v3/` | L'analyse publiée de l'école : cache des réponses du moteur, état complet, rapport, deux notations `methodologue` et une `plume`. |
| `2026-11-sante/` | Le remboursement des soins vu par les assurés (Grand débat national, 2019) : fiche publiée, échantillon et son tirage, notes, et `run-opus-1/` (cache, état, rapport, deux notations `methodologue`, une `plume`). |
| `2026-10-essai-synthese/` | L'essai qui a validé la méthode commune : 50 contributions, deux méthodes, deux lectures `methodologue` à l'aveugle et une lecture `plume`. |

## Refaire une étude

1. **Le même échantillon.** `scripts/observatoire/echantillon.ts` le retire du fichier officiel avec la graine et les
   réglages notés dans `echantillon.tirage.json`.
2. **La même analyse.** Le pont (`scripts/bridge.ts`) relit le cache de l'analyse : mêmes données, même configuration,
   même résultat. Seules les demandes nouvelles partent au moteur, par exemple après un changement de méthode.
3. **La même page.** `scripts/observatoire/publier.ts` écrit la page publiée dans `public/observatoire/`.

La méthode, les notes et leur grille : `docs/METHODES.md` et `docs/NOTATION.md`.

## Les données et les prénoms

Les consultations sont analysées telles que leur source les publie, sous Licence Ouverte, prénoms compris :
l'algorithme ne change pas selon les données. Les pages publiées masquent les prénoms des particuliers. Dans la
Synthèse, c'est le chercheur qui choisit de les masquer ou non, à l'écran et dans les exports.

Les fichiers de travail des passes intermédiaires (demandes et réponses du moteur, environ 300 Mo) sont sur la branche
`archive/observatoire` ; leurs rapports et leurs notations sont ici, dans `run-opus-*/`.
