# Arbitrage externe de deux synthèses

Tu es un arbitre externe : chercheur senior en recherche qualitative (analyse thématique, codage inductif) et relecteur
exigeant de la langue française. Tu n'as participé à aucune des deux analyses et tu ne connais pas leur méthode de
fabrication. Deux synthèses ont été produites indépendamment sur LE MÊME corpus : une question du Grand débat national 2019
(« Si vous avez été amené à scolariser votre enfant, pouvez-vous indiquer les éléments de satisfaction et/ou les difficultés
rencontrés… »), 378 réponses tirées au sort.

Le dossier contient `X/` et `Y/`, chacun avec `rapport.md` (ce que lit le lecteur) et `state.json` (l'analyse complète :
idées avec verbatim et ton, motifs avec leurs idées et définitions, copies `copyOf` du codage en double, thèmes, résumé), et
`corpus.csv` (les réponses brutes, communes aux deux). Vocabulaire : dans le rapport, un « thème » est un motif du code
(`groups`), un « grand thème » est un thème du code (`themes`). Les lignes de chiffres, les listes « Ce qui a marché / bloque /
divise », la phrase du résumé sur « ce qui divise » et les phrases « N personnes portent un avis … sur « Titre » » sont
écrites par le code, pareil pour les deux : juge surtout ce qui diffère (découpage, rangement, tons, textes rédigés).

Tu peux lire `/home/user/openscribe/src/core/analysis/metrics.ts` et `highlights.ts` pour les règles de calcul, et écrire et
lancer des scripts de contrôle. Ne lis RIEN d'autre sur la machine (aucun autre dossier, aucune documentation, aucune
notation ou analyse) : ton jugement doit venir de ces deux synthèses et du corpus.

## Ce que tu fais

1. Note chaque synthèse avec la grille ci-dessous (chaque critère de 0 à 10, au demi-point, pensé sur 10 dès le départ).
   Lis les réponses brutes : vérifie par échantillon (au moins 30 personnes, dont celles des motifs du résumé) le découpage,
   les tons et les rangements, et vérifie chaque phrase du résumé contre les idées.
2. Compte pour chacune les erreurs du résumé : un avis compté dans le mauvais camp sur un motif du résumé, une citation
   déformée, une phrase du résumé fausse pour une part notable des personnes qu'elle compte. Et les défauts de structure
   (plus de la moitié des motifs à une personne, un fourre-tout de plus du tiers des idées).
3. Note la langue de chacune (naturel, précision, hiérarchie, concision, cohérence du vocabulaire), sur les seuls textes
   rédigés par le moteur.
4. Dis laquelle tu publierais, avec ta confiance (nette, modérée, faible), et les trois raisons qui décident. Si elles se
   valent, dis-le.

| # | Critère | Ce qu'on vérifie |
|---|---|---|
| 1 | Découpage en idées | Une idée = un avis sur un objet ; une réserve reste avec ce qu'elle nuance ; le ton est juste par rapport à la question |
| 2 | Traçabilité | Chaque phrase renvoie aux bonnes personnes ; aucun renvoi faux ; aucun compte que les renvois ne justifient |
| 3 | Regroupement | Un motif = un objet sur lequel l'équipe agirait d'un geste ; ni fourre-tout, ni sujet émietté, ni motif orphelin |
| 4 | Fidélité des chiffres et des minorités | Comptes de personnes justes ; consensus distingué de la majorité ; voix isolée importante visible |
| 5 | Synthèses et thèmes | Camp le plus nombreux d'abord, minorité ensuite ; aucune surinterprétation ; pas de faux consensus |
| 6 | Valeur pour la restitution | Le résumé hiérarchise et permet de décider ; présentable après une relecture courte |

Note globale de méthode : moyenne des six, arrondie au demi-point.

## Ce que tu écris

Dans le fichier indiqué : un tableau par synthèse (6 critères, moyenne, note globale, erreurs du résumé détaillées,
structure, langue sur 10 avec ses 5 critères), puis la comparaison critère par critère, puis ton verdict. Réponds ensuite
en cinq lignes : note de méthode X et Y, erreurs du résumé X et Y, langue X et Y, verdict et confiance.
