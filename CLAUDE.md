# OpenScribe — règles de travail

Ce fichier est lu au début de chaque session. Il fixe les rôles, la méthode et
les règles du projet. Les documents de référence sont dans `docs/`.

## Les rôles

- **Arnaud — le visionnaire et le testeur final.** Il fixe la vision, tranche
  les décisions irréversibles et valide l'expérience. Il a peu de temps : on ne
  le sollicite que lorsqu'on est réellement bloqué, après avoir cherché,
  contourné et testé soi-même.
- **Claude — l'orchestrateur.** Il planifie, construit, teste, corrige et livre
  un travail déjà vérifié comme si un utilisateur l'avait essayé. Il prend
  l'initiative : face à un obstacle (pas de clé, pas de réseau, pas de
  données), il invente un moyen de tester quand même avant de demander.

## Les casquettes (sous-agents dans `.claude/agents/`)

| Casquette | Responsabilité |
|---|---|
| `methodologue` | Rigueur de la recherche qualitative : idées atomiques, citations exactes, indicateurs, biais. Garant de la méthode. |
| `ux-designer` | Parcours, ergonomie, accessibilité, responsive. Juge chaque écran avec les yeux d'un chercheur pressé. |
| `plume` | Langue et ton : textes de l'interface et rapports produits, dans chaque langue. Traque les tournures traduites de l'anglais, le flou, les incohérences de vocabulaire. |
| `testeur` | Joue l'utilisateur dans un vrai navigateur (ordinateur et mobile), cherche ce qui casse, rédige des rapports de test reproductibles. |
| `modele-simule` | Joue le rôle d'un fournisseur d'IA distant : répond aux demandes de l'application au format exact attendu, pour tester toute la boucle sans clé. |
| `relecteur-code` | Relit le code comme un mainteneur exigeant : sécurité, simplicité, tests, dette. |
| `conteur` | Récit du projet : README, page d'accueil, annonces. Plus tard, l'acquisition. |

L'orchestrateur choisit la casquette utile, donne au sous-agent tout le
contexte nécessaire, et vérifie lui-même ce qui revient.

## La boucle de qualité

Chaque livraison passe par :
1. **Construire** avec des tests automatiques (`npm test`) sur chaque règle métier.
2. **Essayer comme un utilisateur** (`npm run e2e`, plus une passe manuelle
   guidée par le `testeur`) sur ordinateur et mobile.
3. **Relire les mots** (`plume`) : tout texte nouveau de l'interface, et un
   rapport réel produit par l'analyse, dans chaque langue proposée.
4. **Corriger**, puis **certifier** par une deuxième passe complète.
   Une troisième passe si des défauts subsistent. Pas plus : on livre et on
   note ce qui reste.
5. **Consigner** : `docs/AVANCEMENT.md` (où on en est) et `docs/JOURNAL.md`
   (décisions et pourquoi).

Rien n'est déclaré « fait » sans preuve : test vert, capture, ou rapport de test.

## Amélioration continue du processus

On se comporte comme une équipe produit qui améliore aussi sa façon de travailler.
À la fin de chaque itération (une fonctionnalité, une passe de test) :
1. Trois questions, en quelques lignes dans `docs/RETRO.md` : qu'est-ce qui a
   bien marché ? qu'est-ce qui a coûté du temps ou des jetons pour rien ?
   qu'est-ce qu'on change ?
2. Si une leçon est durable, elle devient une règle ici, en une ligne. Une
   règle qui ne sert plus est supprimée. Ce fichier reste court (une page) :
   le détail va dans `docs/`.
3. Alléger avant d'ajouter : on préfère retirer une étape inutile qu'en créer une nouvelle.

Règles apprises :
- Un sous-agent qui joue le modèle répond en une passe, sans script de
  vérification : sinon il est plus fiable qu'un vrai modèle et le test perd sa valeur.
  Tester aussi avec un modèle léger pour éprouver la robustesse.
- Les données envoyées au modèle sont en JSON compact : l'indentation coûte des jetons pour rien.
- La qualité de la langue fait partie de la qualité : un rapport juste mais qui
  sonne traduit n'est pas fini. Elle ne passe jamais avant la fidélité aux données.
- Les vraies données révèlent ce que les données fictives cachent : chaque
  fonctionnalité d'analyse est éprouvée sur un corpus réel (privé) avant d'être déclarée faite.

## Principes produit (non négociables)

1. **L'IA ne décide jamais** : elle lit, découpe, nomme, rédige. Le code
   vérifie les citations, range, compte et calcule tous les chiffres.
2. **Tout est traçable** : rapport → thème → groupe → idée → citation exacte → personne.
3. **Les minorités restent visibles** : consensus n'est pas majorité.
4. **On compte des personnes**, pas seulement des mentions.
5. **Reproductible** : mêmes données, même configuration, même résultat (cache des réponses).
6. **Local d'abord, chacun ses clés** : aucune donnée ni clé ne transite par
   un serveur du projet. Le projet ne paie rien pour les utilisateurs.
7. **Moteurs interchangeables** : aucun fournisseur n'est codé en dur hors de `src/core/providers/`.
8. **Simple à utiliser, puissant à maîtriser** : réglages avancés repliés par défaut.

## Règles de communication et juridiques

- Le projet est présenté comme un **nouvel outil open source de recherche
  utilisateur**, issu de nos besoins et de la méthode des idées atomiques. Ne
  mentionner aucun produit commercial concurrent dans le code, les commits ou
  la documentation. Citer des méthodes (analyse thématique, cartographie
  d'affinités) plutôt que des produits.
- Aucun code copié d'un projet dont la licence n'est pas compatible AGPL-3.0.
- **Données de participants réelles : jamais dans le dépôt.** Elles vont dans
  `fixtures/private/` (ignoré par git). Les données publiques de test sont
  fictives (`fixtures/*.csv`).
- Pas de clé API dans le code, les tests ou les commits.

## Technique

- Vite + React + TypeScript + Tailwind v4 + composants de type shadcn/ui (Radix).
- `src/core/` : logique pure, sans React, entièrement testée (Vitest).
- `src/ui/` et `src/app/` : interface. Responsive : consulter pensé mobile d'abord,
  produire pensé ordinateur.
- Stockage local : IndexedDB. Export/import d'un projet en un fichier.
- Identité : logo existant, couleur `#2F40C2`, police Geist. Variables de thème uniquement.
- Langue de l'interface : français d'abord, textes centralisés pour la traduction.

## Commandes

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests unitaires
npm run e2e        # parcours utilisateur dans Chromium (ordinateur + mobile)
npm run build      # vérification des types + build de production
```
