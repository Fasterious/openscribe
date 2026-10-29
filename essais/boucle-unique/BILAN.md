# Bilan d'essai : une boucle unique à la place du pipeline (29/10/2026)

**Statut : archivé, non utilisé par l'application.** Rien dans `src/` n'appelle ce kit. Il est gardé pour rejouer l'essai le
jour où un nouveau modèle (ou un nouveau corpus) pourrait changer la conclusion.

## La question

Anthropic a publié le 22/10/2026 « Building agents: When to fold subagents into your main agent loop » (Diane Sarkis,
[claude.com](https://claude.com/blog/building-agents-when-to-fold-subagents-into-your-main-agent-loop)). L'article
constate que, dans plusieurs déploiements, **un seul agent avec des compétences** (le savoir-faire chargé à la demande) et
**des outils** (les limites dures, les vérifications) fait mieux, plus vite et moins cher, qu'un orchestrateur avec des
sous-agents ou qu'un **pipeline de raisonnement fixe en plusieurs étapes**. Il garde les sous-agents dans trois cas : un
contexte qui déborde au point de faire baisser la qualité, des tâches parallèles qui demandent un contexte neuf, un agent
qui se perd entre ses outils ou ses consignes ; et il cite la vérification en boîte noire comme bon usage. Sa méthode :
une petite batterie d'essais, un changement à la fois, regarder quelles tâches basculent, rejouer chaque tâche plusieurs
fois.

Arnaud a demandé de l'essayer sur OpenScribe et de ne migrer que si la note monte.

## Où l'article s'applique chez nous

- **Le moteur d'analyse** est exactement un « pipeline fixe » : environ 450 demandes pour l'étude école, chacune ne voyant
  qu'un lot. Plusieurs étapes (réconciliation, seconde relecture, balayage) existent parce que les lots ne se voient pas.
  C'est là que la note se mesure, et là que tournent les clés des utilisateurs : l'essai porte sur lui.
- **Les casquettes** (`.claude/agents/`) sont surtout des vérificateurs au contexte neuf (`methodologue`, `plume`,
  `testeur`, `relecteur-code`, `modele-simule`) : le cas où l'article garde des sous-agents. Gardées telles quelles.

## Le kit (`kit/`)

- `outil.ts` : les outils de l'agent, groupés par intention (`idees`, `motifs`, `voir`, `ecrire`, `finaliser`, `importer`).
  Ils appliquent les contrôles du code du moteur (citation vérifiée mot pour mot, comptes, renvois, camps oubliés, nombres
  sans appui) et renvoient en clair ce qui ne va pas. `finaliser` construit l'état d'analyse et le rapport avec le code du
  moteur ; `importer` charge une analyse du pipeline pour la corriger avec les mêmes outils.
- `competences/` : les consignes de la méthode « consultation », reprises règle par règle (découper, regrouper, rédiger,
  guide de style). `competences-evaluation/` : le `methodologue` et la `plume` convertis en compétences.
- `CONSIGNE.md` : la consigne de l'agent (principe, compétences à charger à la demande, cadre).
- `preparer.sh` : prépare un dossier d'essai ; `rendre.ts` : rend un état d'analyse avec le code actuel.

Rejouer : `essais/boucle-unique/kit/preparer.sh <dossier> <corpus.csv> "<objectif>" <modèle>`, puis confier `CONSIGNE.md`
à un agent qui n'a accès qu'à ce dossier et à `./outil`. Le moteur exporte pour cela `markUnverified`, `verifyNumbers` et
`ensureCamps` (`src/core/analysis/pipeline.ts`).

## Le protocole retenu (à armes égales, demande d'Arnaud)

Une première comparaison contre la passe 17 publiée (réglée 17 fois sur ce corpus) était déséquilibrée. Protocole final :
- **A, pipeline** : à neuf, sans cache (452 demandes, chacune répondue en une passe par un modèle simulé Opus neuf) ; ronde
  interne : `methodologue` et `plume` en sous-agents, puis un orchestrateur applique leurs corrections avec les outils.
- **B, boucle unique** : un agent Opus, un seul contexte, compétences et outils ; ronde interne dans le même contexte, par
  les compétences d'évaluation.
- **Arbitres** : deux Opus neufs, sans les casquettes du projet, grille de `docs/NOTATION.md`, à l'aveugle (X/Y, même titre,
  même rendu), ordre inversé de l'un à l'autre.

## Les résultats (étude école, Grand débat 2019, 378 réponses)

| | A pipeline | B boucle unique |
|---|---|---|
| Idées (copies) · motifs · thèmes | 1 009 (74) · 67 · 10 | 804 (51) · 52 · 9 |
| Appels au moteur · durée | 452 · 51 min, plus la correction | 78 · 39 min |
| Arbitre 1 : méthode · erreurs du résumé · langue | 7 · 1 · 7,5 | 7 · 1 · 8 |
| Arbitre 2 : méthode · erreurs du résumé · langue | 7,5 · 3 · 7,5 | 6,5 · 3 · 8 |
| Verdict des arbitres | préféré par les deux (confiance faible, puis modérée) | |

**Conclusion : pas de gain de note, pas de migration.** La boucle écrit mieux (+0,5 en langue aux deux arbitres), garde une
structure plus saine (moins de copies, aucun motif à une personne) et fait six fois moins d'appels. Mais elle découpe plus
large (753 idées contre 935) et perd des nuances, laisse des minorités moins visibles, et range des plaintes du côté
favorable. La première comparaison, déséquilibrée, disait déjà la même chose.

## Ce qui pourrait changer la conclusion

- **Un modèle plus fort** au découpage dans un seul contexte : le défaut décisif de la boucle était un découpage trop
  large, pas son raisonnement d'ensemble.
- **Un hybride** dans l'esprit de l'article (« un changement à la fois ») : garder le découpage du pipeline, une demande
  par personne, et confier à une boucle unique le rangement et la rédaction, où le contexte partagé a aidé (structure,
  langue). Non essayé.
- **Les autres moteurs** : non testés. La boucle renvoie tout son contexte à chaque tour (100 000 à 300 000 jetons) et
  demande l'appel d'outils, absent de `openai-compatible.ts` : hors de portée des offres gratuites (Groq : 8 000 jetons par
  minute ; Gemini Flash-Lite : 500 demandes par jour) et des modèles locaux, sauf si cela change.

## Ce que l’essai a appris au pipeline (corrections du 29/10, vérifiées par une passe rejouée)

1. L'exemple du codage en double reprenait une réponse du corpus de certification : remplacé par un exemple fictif.
2. Consignes contradictoires relevées par les modèles simulés : tranchées dans la méthode « consultation ».
3. Une paire de la réconciliation qui nommait le mauvais motif était acceptée : contrôle `trustedPairs`.
4. Regretter qu'une règle manque ou soit contournée comptait comme un avis favorable à la règle (le redoublement dans « Ce
   qui a marché », des plaintes contre les passe-droits du côté favorable de la carte scolaire) : c'est maintenant une
   critique, rangée avec ce qui ne va pas.

Détail des notes et des passes : `docs/METHODES.md`, « Boucle unique contre pipeline ». Toutes les analyses, notations et
arbitrages : dépôt de l'Observatoire, `2026-10-ecole/essai-boucle/`.
