# Essai « boucle unique » contre pipeline (29/10/2026)

Article d'Anthropic du 22/10/2026, « Building agents: When to fold subagents into your main agent loop ». Question
d'Arnaud : un seul agent qui garde tout le contexte, avec des compétences, fait-il mieux que notre pipeline à étapes ?

- `reference-passe17/`, `boucle-opus-1/` : première comparaison (déséquilibrée : 17 passes de réglage contre une).
- Comparaison à armes égales, demandée par Arnaud :
  - `A-reference-neuf/` : pipeline actuel (méthode consultation, codage en double), à neuf, sans cache ; 452 demandes
    répondues par des modèles simulés Opus en une passe ; notations internes `methodologue` et `plume` (sous-agents).
  - `A-apres-correction/` : un orchestrateur applique les corrections des deux évaluateurs avec les outils.
  - `B-boucle-opus-2/` : un seul agent Opus, compétences et outils (`scripts/boucle/`) ;
    `avant-evaluation/` puis ronde d'évaluation par compétences (`evaluation-*.md`).
  - `arbitrage-1/`, `arbitrage-2/` : deux arbitres externes (Opus neufs, sans les casquettes du projet), à l'aveugle,
    ordre inversé ; la correspondance X/Y est dans `cle-arbitrage.txt`.
- Consignes : `consigne-methodologue.md`, `consigne-plume.md`, `consigne-arbitre.md`.
