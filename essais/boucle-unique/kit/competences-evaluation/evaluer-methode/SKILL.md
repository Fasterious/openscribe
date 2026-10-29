---
name: evaluer-methode
description: Juger la rigueur de l'analyse produite (ce qu'était le sous-agent « methodologue ») avec la grille sur 10, puis corriger l'analyse avec les outils. À charger quand le rapport est écrit, avant de le rendre.
---

# Évaluer la méthode, puis corriger

Tu prends maintenant la casquette d'un chercheur senior en recherche qualitative (analyse thématique, codage inductif,
cartographie d'affinités) et en méthodes mixtes. Ta mission : t'assurer que l'analyse est rigoureuse, traçable et honnête.
Relis le rapport (`rapport.md`, écrit par `./outil finaliser`) comme si un autre l'avait écrit : cherche ce qui est faux,
pas ce qui est bien.

## Ce que tu vérifies

- Les idées atomiques : un sujet et un ton par idée, rien d'oublié, rien d'inventé.
- Les citations : exactes, assez longues pour être comprises seules.
- Les regroupements : par sujet, pas par jugement ; ni fourre-tout, ni émiettement.
- Les chiffres : des personnes autant que des mentions ; consensus, désaccords et minorités visibles ; aucune affirmation
  non sourcée.
- Les synthèses : fidèles, sans extrapolation, nuancées.
- Les biais : grilles qui masquent l'imprévu, sur-représentation d'une personne bavarde.

## La grille (note sur 10, chaque critère pensé sur 10)

| # | Critère | Ce qu'on vérifie |
|---|---|---|
| 1 | Découpage en idées | Une idée = un avis sur un objet ; une réserve reste avec ce qu'elle nuance ; le ton est juste par rapport à la question posée |
| 2 | Traçabilité | Chaque phrase renvoie aux bonnes personnes ; aucun renvoi faux ; aucun compte que les renvois ne justifient |
| 3 | Regroupement | Un motif = un objet sur lequel l'équipe agirait d'un geste ; ni fourre-tout, ni sujet émietté, ni motif orphelin de thème |
| 4 | Fidélité des chiffres et des minorités | Comptes de personnes justes ; consensus distingué de la majorité ; une voix isolée mais importante reste visible |
| 5 | Synthèses et thèmes | Le camp le plus nombreux d'abord, la minorité ensuite ; aucune surinterprétation ; les thèmes rapprochent des motifs voisins sans faux consensus |
| 6 | Valeur pour la restitution | Le résumé hiérarchise (ce qui marche, ce qui bloque, ce qui divise, ce qu'on propose) et permet de décider |

Compte à part les erreurs du résumé : un avis compté dans le mauvais camp sur un motif du résumé, une citation déformée, une
phrase du résumé fausse pour une part notable des personnes comptées.

## Comment faire

1. Lis `rapport.md` en entier, puis, pour chaque motif cité dans le résumé, `./outil voir motif Gx` : la définition, les
   idées camp par camp, les copies. Relis les réponses d'origine dans `corpus.md` quand un ton ou un rangement est douteux.
2. Écris dans `evaluation-methode.md` : la note de chaque critère, la note globale (moyenne arrondie au demi-point), les
   erreurs du résumé, puis les défauts du plus grave au plus léger, chacun avec ses identifiants.
3. Corrige ce qui peut l'être avec les outils (`./outil motifs`, `./outil ecrire`) : rangement, ton, définition, synthèse,
   résumé. Toujours par l'analyse, jamais en contournant un contrôle du code. Puis `./outil finaliser` de nouveau.
