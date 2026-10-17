# Grille de notation d'une synthèse

Sert à comparer les moteurs d'IA et les méthodes sur un corpus réel (ÉcoSol aujourd'hui).
La même grille, le même évaluateur (`methodologue` et `plume` sur Opus, réflexion moyenne),
pour chaque passe : sinon les notes ne se comparent pas.

Seuil pour proposer un moteur : le niveau de Gemini Flash-Lite (3,5/5 sur l'ancienne échelle, **2,5/5 sur cette grille**), mesuré par le même évaluateur ; idéalement le niveau de la référence. Voir « Variabilité » plus bas.

## Une note relative, sur 10 (décision d'Arnaud, 17/10/2026)

La note n'est pas une vérité : c'est un **repère relatif**, posé par un évaluateur (Opus 5.5 aujourd'hui) qui
peut lui-même se tromper. Elle sert à situer un moteur ou une méthode par rapport aux autres, sur le même
corpus et avec le même évaluateur. Le changement d'évaluateur du 14/10 l'a montré : la même synthèse de
Sonnet est passée de 4,5 à 3 sur 5, sans avoir changé.

- **Échelle sur 10**, pour plus de finesse : la note globale est la moyenne des six critères multipliée par 2,
  arrondie au demi-point (moyenne 3,33 sur 5 : 6,5/10). Les critères restent notés de 0 à 5.
- **Le plafond devient un compte.** Au lieu de bloquer la note à 3/5 dès qu'un avis est dans le mauvais camp
  sur un motif du résumé, l'évaluateur donne ce nombre à côté de la note : « 6,5/10 · 3 étiquettes du
  résumé fausses ». Le plafond binaire masquait les progrès (cinq erreurs ou une donnaient la même note).
  Le plafond de structure (plus de la moitié des motifs à une personne, ou un fourre-tout de plus du tiers des
  idées) reste un compte du même genre.
- **Aucun seuil de publication.** Une étude de l'Observatoire se publie avec le meilleur moteur dont on dispose
  (Claude Opus 5.5 aujourd'hui), la méthode décrite dans le rapport, ses limites et les mentions « à vérifier »
  calculées par le code. À chaque nouveau moteur, on refait le repère.
- **Pour proposer un moteur dans l'application**, le repère reste le niveau de Gemini Flash-Lite (2,5/5,
  soit 5/10), idéalement celui de la référence.

Repères actuels, convertis (moyennes sans plafond) : sur ÉcoSol, Gemini Flash-Lite 5/10 (sa note de 2,5/5),
Sonnet avec la référence 6,5/10 (trois lectures du 14/10) ; sur l'école, la méthode « consultation » avec Opus 5.5 6,5/10 aux deux lectures de la passe 12, langue
7/10.

## `methodologue` : la méthode (note sur 5)

Chaque critère est noté de 0 à 5, en lisant le rapport ET les réponses brutes.

| # | Critère | Ce qu'on vérifie |
|---|---|---|
| 1 | Découpage en idées | Une idée = un avis sur un objet ; une réserve reste avec ce qu'elle nuance ; le ton (positif, négatif…) est juste par rapport à la question posée |
| 2 | Traçabilité | Chaque phrase renvoie aux bonnes personnes ; aucun renvoi faux ; aucun compte (« six personnes ») que les renvois ne justifient |
| 3 | Regroupement | Un motif = un objet sur lequel l'équipe agirait d'un geste ; ni fourre-tout, ni sujet émietté en plusieurs motifs, ni motif orphelin de thème |
| 4 | Fidélité des chiffres et des minorités | Comptes de personnes justes ; consensus distingué de la majorité ; une voix isolée mais importante reste visible |
| 5 | Synthèses et thèmes | Le camp le plus nombreux d'abord, la minorité ensuite ; aucune surinterprétation ; les thèmes rapprochent des motifs voisins sans faux consensus |
| 6 | Valeur pour la restitution | Le résumé hiérarchise (ce qui marche, ce qui bloque, ce qui divise, ce qu'on propose) et permet de décider ; un chercheur pourrait le présenter après une relecture courte |

**Note globale** : moyenne des six critères, arrondie au demi-point. Plafonds : une erreur de
fidélité qui change une conclusion (un avis compté dans le mauvais camp sur un motif du résumé,
une citation déformée) plafonne la note à 3 ; une structure inutilisable (plus de la moitié des
motifs à une personne, ou un fourre-tout de plus du tiers des idées) la plafonne à 2.

Rendre aussi : le temps de relecture humaine estimé pour rendre le rapport présentable.

## `plume` : la langue (note sur 5)

Sur les seuls textes écrits par le moteur d'IA (titres, synthèses, intros, résumé ; les verbatims
sont hors champ) : naturel (aucun calque de l'anglais), précision (chaque phrase nomme son sujet),
hiérarchie (l'essentiel d'abord), concision, cohérence du vocabulaire. Depuis le 17/10, la note se donne sur 10
(moyenne des critères multipliée par 2) et s'écrit « 7/10 ».

## Variabilité de l'évaluateur

Mesurée le 14/10/2026 sur Sonnet B10, trois lectures indépendantes (`methodologue` sur Opus 5.5) :

| Lecture | C1 | C2 | C3 | C4 | C5 | C6 | Globale |
|---|---|---|---|---|---|---|---|
| Réflexion moyenne, 1 | 3,5 | 3,5 | 3 | 3 | 3 | 3,5 | 3 (plafond) |
| Réflexion moyenne, 2 | 4 | 3 | 3 | 3 | 3,5 | 3,5 | 3 (plafond) |
| Réflexion élevée | 3,5 | 3,5 | 3 | 3 | 3,5 | 3,5 | 3 (plafond) |

Les trois lectures trouvent les mêmes défauts principaux, et les critères ne varient que d'un
demi-point. **La réflexion moyenne suffit** : la réflexion élevée ne change ni la note ni les
défauts trouvés. Un écart d'un demi-point sur un critère est du bruit ; une décision (garder un apport,
proposer un moteur) demande un écart d'au moins un demi-point sur la note globale, confirmé par
deux lectures.

**Changement d'échelle.** Cette grille est plus sévère que les notes libres d'avant (13-14/10) :
Sonnet B10 passe de 4,5 à 3, Gemini P4 de 3,5 à 2,5. L'écart entre les deux reste du même ordre.
Les notes d'avant le 14/10 au soir ne se comparent pas à celles-ci. Le seuil d'Arnaud se lit donc
sur la nouvelle échelle : **le niveau de Gemini Flash-Lite, soit 2,5/5 aujourd'hui** (3,5 sur l'ancienne),
idéalement le niveau de la référence (3/5 aujourd'hui, 4,5 sur l'ancienne).
