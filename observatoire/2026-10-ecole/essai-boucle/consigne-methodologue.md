# Notation `methodologue` d'une synthèse (grille sur 10)

Tu notes UNE synthèse produite par OpenScribe sur une consultation publique (Grand débat national 2019, question sur la
scolarisation des enfants, 378 réponses tirées au sort). Le dossier contient :
- `rapport.md` : le rapport tel que le lecteur le voit ;
- `state.json` : l'état complet de l'analyse (idées avec leurs verbatims et leur ton, motifs avec leurs idées, définitions,
  copies `copyOf` du codage en double, thèmes, résumé) ;
- `corpus.csv` : les réponses brutes.
Tu peux lire, pour les règles de calcul, `/home/user/openscribe/src/core/analysis/metrics.ts` et `highlights.ts`.
Tu peux écrire et lancer des scripts de contrôle (comptes, citations) : c'est ton travail d'évaluateur.

Ne lis RIEN d'autre : ni `docs/`, ni aucun autre dossier de la machine, ni aucune autre analyse ou notation. La note doit
venir de ta seule lecture de cette synthèse.

Vocabulaire : dans le rapport, un « thème » est un motif du code (`groups`), un « grand thème » est un thème du code (`themes`).

## Grille (docs/NOTATION.md)

Chaque critère est noté de 0 à 10, au demi-point, pensé sur 10 dès le départ (jamais une note sur 5 doublée), en lisant le
rapport ET les réponses brutes. La note est un repère relatif : sois exigeant et concret.

| # | Critère | Ce qu'on vérifie |
|---|---|---|
| 1 | Découpage en idées | Une idée = un avis sur un objet ; une réserve reste avec ce qu'elle nuance ; le ton (positif, négatif…) est juste par rapport à la question posée |
| 2 | Traçabilité | Chaque phrase renvoie aux bonnes personnes ; aucun renvoi faux ; aucun compte (« six personnes ») que les renvois ne justifient |
| 3 | Regroupement | Un motif = un objet sur lequel l'équipe agirait d'un geste ; ni fourre-tout, ni sujet émietté en plusieurs motifs, ni motif orphelin de thème |
| 4 | Fidélité des chiffres et des minorités | Comptes de personnes justes ; consensus distingué de la majorité ; une voix isolée mais importante reste visible |
| 5 | Synthèses et thèmes | Le camp le plus nombreux d'abord, la minorité ensuite ; aucune surinterprétation ; les thèmes rapprochent des motifs voisins sans faux consensus |
| 6 | Valeur pour la restitution | Le résumé hiérarchise (ce qui marche, ce qui bloque, ce qui divise, ce qu'on propose) et permet de décider ; un chercheur pourrait le présenter après une relecture courte |

**Note globale** : moyenne des six critères, arrondie au demi-point, sans plafond. À côté de la note, deux comptes : les
erreurs de fidélité qui changent une conclusion (un avis compté dans le mauvais camp sur un motif du résumé, une citation
déformée, une phrase du résumé fausse pour une part notable des personnes comptées), et les défauts de structure (plus de la
moitié des motifs à une personne, ou un fourre-tout de plus du tiers des idées). Exemple : « 6,5/10 · 3 erreurs du résumé ·
structure saine ».

Rends aussi le temps de relecture humaine estimé pour rendre le rapport présentable.

## Ce que tu écris

Écris ta notation dans le fichier indiqué, en Markdown :
1. Ce que tu as lu et les contrôles faits (par script ou à la main).
2. Le tableau des six critères (note /10 et « en bref » avec exemples précis : identifiants d'idées, de personnes).
3. La moyenne, la note globale, le compte des erreurs du résumé et des défauts de structure.
4. Le détail de chaque erreur du résumé (qui est compté où, pourquoi c'est faux).
5. Les corrections proposées, par ordre d'importance, et le temps de relecture humaine.

Puis réponds en trois lignes : note globale, erreurs du résumé, structure.
