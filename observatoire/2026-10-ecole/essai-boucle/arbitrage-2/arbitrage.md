# Arbitrage externe : synthèses X et Y (Grand débat 2019, scolarisation, 378 réponses)

## Ce que j'ai vérifié

- **Lecture des réponses brutes** : 75 participants, lus côte à côte dans X et Y. Il y a tous ceux que cite le résumé de l'une ou de l'autre (P1, P2, P5, P7, P11, P12, P13, P15, P16, P17, P18, P20, P24, P26, P28, P33, P34, P41, P50, P52, P54, P62, P75, P98, P103, P113, P165, P194, P228, P230, P252, P342, P356, P362, P368), deux tirages au hasard (P53, P59, P61, P102, P115, P124, P130, P150, P164, P216, P244, P258, P263, P281, P285, P286, P294, P301, P308, P314, P319, P332, P375) et les cas signalés par les scripts (P8, P51, P57, P87, P95, P101, P177, P186, P209, P246, P272, P283, P291, P321, P327, P335, P349).
- **Motifs du résumé** : toutes les idées des motifs cités par les deux résumés ont été lues une par une avec leur ton, soit environ 420 rangements. Pour X : Déroulement, Absences, Carte scolaire, Orientation, Moyens, Niveau, Handicap, Administration, Formalités, Effectifs, Qualité des équipes, Périscolaire, Privé, Coût, Gestion, Reconnaissance, Climat. Pour Y : Scolarisation dans l'ensemble, Continuité des cours, Privé, Carte scolaire, Niveau d'exigence, Démarches, Administration, Orientation, Handicap, Effectifs, Inégalités, Qualité des enseignants, Écoles de proximité, Périscolaire, Évaluation des enseignants, Coût.
- **Contrôles par script** (`scripts/`) :
  - comptes recalculés avec les règles de `metrics.ts` (`lib.py`, `structure.py`) ;
  - verbatims retrouvés dans le corpus ;
  - recouvrement des extraits (`overlap.py`) ;
  - tons comparés entre X et Y sur les 922 idées appariées, soit 84 désaccords arbitrés (`tone_diff.py`) ;
  - renvois [Ixxxx] de toutes les synthèses (`trace.py`, `showsum.py`) ;
  - étiquettes qui changent sans les copies.
- **Résultats mécaniques communs aux deux** : aucun renvoi inconnu, aucun renvoi hors du motif ou du grand thème. Tous les verbatims sont exacts (X a 4 idées en plusieurs morceaux avec « […] », toutes légitimes). Tous les chiffres du code correspondent aux idées.

---

## Synthèse X

| # | Critère | Note /10 | Justification (identifiants) |
|---|---|---|---|
| 1 | Découpage en idées | 7,5 | Les objets distincts restent séparés et le ton suit l'objet : P5 I0018 (« fabrique des abrutis ») est gardé, P34 I0095 (« En primaire, pas de soucis majeurs ») aussi, P57 I0156 (« Les plus géniaux étaient toujours aussi géniaux ») reste positif, P342 I0840 est bien une **question**, P165 I0411 est une satisfaction et non une proposition. Hors sujet bien isolé : P57 I0167-0170, P87 I0221-0222, P295. Défauts : des listes émiettées en fausses idées (P124 I0315 « chômage », I0314 « difficultés sociales » ; P358 en 6 idées), des doublons qui se chevauchent (P87 I0219 neutre / I0220 négatif sur la même phrase ; P357 I0878-0880 ; P48 I0136 « Problème toujours actuel » n'est pas une idée), P75 I0201 non découpé (effectif et qualité dans un seul extrait, recopié ensuite dans Effectifs), P283 I0703 (simple entrée en matière comptée comme critique), P252 I0623 (éloge de la sélection codé négatif). 34 paires d'extraits se chevauchent. |
| 2 | Traçabilité | 8 | Renvois tous dans le bon motif, comptes découpés et justes (G9 « 6 personnes proposent… » = 2+3+1 ; G16 « 9 personnes » = 3+3+2+1). Défauts : le résumé appuie « la gestion des enseignants suscite des critiques de sens opposés » sur I0008, qui est rangée dans Reconnaissance (G30) et non dans Gestion. T1 compte « 10 personnes… et 8 saluent… » alors que 3 sont les mêmes par copie (P227, P248, P344) : 15 personnes distinctes, pas 18. |
| 3 | Regroupement | 7 | Bonne netteté des objets. Contournement de la carte (G48) est séparé de la carte, ce qui garde des pôles cohérents. Défauts : émiettement, avec 67 motifs dont 21 de 3 personnes ou moins. Le coût est éclaté en 4 motifs (G31, G34, G42, G57), les langues en 2 (G40, G52), l'évaluation en 2 (G55, G58), la proximité en 3 (G22, G23, G54). Il y a 74 copies (G5 Administration en a 10, dont 5 des 8 positifs) et 8 étiquettes qui dépendent des copies. Quelques motifs sont larges : G5 couvre CAF, CROUS et MDPH ; G8 couvre aussi la gale, les poux et l'abri des parents (P89, P358). |
| 4 | Chiffres et minorités | 7,5 | Comptes justes sur les grands motifs. Minorités visibles : le harcèlement est dans le résumé, « À contre-courant » figure dans chaque motif. Défauts : le résumé ne cite pas Inégalités (17 sur 17, unanime) ni Adaptation au niveau (17 sur 18). « Gratuité 5 sur 7 » est mis en avant alors que le motif est mince et mal défini (voir erreurs). |
| 5 | Synthèses et thèmes | 7 | Le camp le plus nombreux vient d'abord, la minorité ensuite, de façon constante. Il y a de vraies nuances : T6 « En sens inverse, 4 personnes dénoncent le contournement… » voit bien que P95, P321, P13 et P365 veulent une carte appliquée. Défaut : des oppositions surinterprétées qui reviennent. Résumé : « critiques de sens opposés » ; T2 : « Ces critiques appellent des remèdes opposés » (sanctionner et mieux reconnaître ne s'opposent pas) ; G39 : « À l'opposé, 1 personne propose de prendre en charge les parents défaillants ». |
| 6 | Valeur pour la restitution | 7 | Le résumé est complet et hiérarchisé (absences, carte, orientation, moyens, niveau, handicap, administration, effectifs), avec le harcèlement comme voix isolée. Il est long : 356 mots, et le paragraphe 2 aligne 9 sujets. Le premier paragraphe donne une place indue à « gratuité 5 sur 7 ». Il est présentable après avoir retiré deux phrases. |
| | **Moyenne** | **7,33** | |
| | **Note globale de méthode** | **7,5** | |

### Erreurs du résumé X : 3 (plus 1 discutable)

1. **Opposition inventée** : « La gestion des enseignants suscite des critiques de sens opposés : pouvoir sanctionner les défaillants, ou mieux payer et reconnaître le métier [I0054, I0008] ».
   - Les 15 avis de G16 sont du même côté (unanime).
   - I0008 (P2, « le manque de reconnaissance qu'ils expriment ») est dans G30 et ne parle pas de salaire.
   - La phrase est fausse pour les personnes qu'elle décrit.
2. **Phrase fausse pour 3 des 7 personnes comptées** : « La gratuité de l'école satisfait aussi 5 sur 7 (majorité, fragile) ».
   - P15 I0048 (« content de payer des impôts pour ça ») ne parle pas de gratuité.
   - Les deux avis contraires, P13 I0040 (« l'éducation devient un luxe ») et P190 I0472 (« lycée français à l'étranger très cher »), ne jugent pas la gratuité de l'école.
3. **Avis dans le mauvais camp**, motif Enseignement privé (12 sur 15) : P283 I0703 (« Grand débat entre école publique et privée qui sont toujours en opposition ») est compté comme critique du privé. C'est l'entrée en matière d'une plainte contre les préjugés de l'université envers les élèves venus du privé. L'étiquette ne change pas (12 sur 14).
4. *Discutable* : P209 I0512 (« Si l'enfant a des dispositions à vouloir apprendre, aucun problème », suivi de « par contre celui qui est réticent a besoin de plus d'encadrement ») est compté parmi les 51 jugements positifs d'ensemble. Le même problème touche P165 I0412, satisfaction ponctuelle et non jugement d'ensemble.

### Structure X

- Motifs à une personne : 7 sur 67, soit 10 %. Pas de défaut (seuil : la moitié).
- Plus gros motif : G1, 76 idées sur 1009, soit 7,5 %. Pas de fourre-tout (seuil : un tiers).
- Émiettement réel : 21 motifs de 3 personnes ou moins.
- 74 copies ; 8 étiquettes changent sans les copies (Formalités, Adaptation, Niveau, Accès au supérieur, Proximité, Mission républicaine, Places, Contournement).

### Langue X : 7,5 sur 10

| Naturel | Précision | Hiérarchie | Concision | Cohérence du vocabulaire |
|---|---|---|---|---|
| 7 | 8,5 | 7 | 6,5 | 8 |

- **Précision** : très bonne, avec des cas concrets qui portent (« une professeure d'économie absente une semaine sur deux en terminale », « 40 km quotidiens au lieu de 15 »).
- **Naturel** : des tournures lourdes ou des formules toutes faites. Exemples : « Pour 23 sur 23 (unanime), l'orientation des élèves pose problème » ; « suscitent chacune celles de 4 personnes » ; « Le tableau n'est pas uniforme » ; « 2 constats coexistent » ; T4 enchaîne « tranche avec ce bilan » et « assombrissent ce bilan ».
- **Concision** : textes longs, 7 511 mots rédigés, 27,7 mots par phrase en moyenne, résumé de 356 mots.
- **Cohérence** : vocabulaire stable (« À contre-courant », « mitigé »), mais connecteurs répétitifs.

---

## Synthèse Y

| # | Critère | Note /10 | Justification (identifiants) |
|---|---|---|---|
| 1 | Découpage en idées | 6,5 | Les regroupements de listes sont souvent heureux (P124 I0254, P150 I0306, P286 I0570) et il y a peu de chevauchements (7). Mais plusieurs objets distincts sont fusionnés, parfois au prix d'un ton perdu. P57 I0134 absorbe « Les plus géniaux étaient toujours aussi géniaux » dans une idée négative. P34 I0086 fond « En primaire, pas de soucis majeurs » dans le périscolaire. P167 I0343 fond « pas grâce à l'école » dans un positif. Sont aussi fusionnés : P13 I0037 (entreprises privées à l'université et coût), P92 I0194, P258 I0519, P319 I0624. Erreurs de ton nettes : P95 I0200 « Insatisfaction : passe droit… » est **positif** ; P321 I0626 « La carte scolaire inappliquée… » est **positif** ; P13 I0035 aussi ; P342 I0677 (« point d'interrogation ») est négatif et non question. P62 (« réponses trop longue ») n'est pas extrait. |
| 2 | Traçabilité | 7,5 | Renvois exacts et dans le bon motif ; les phrases du résumé renvoient aux bonnes personnes. Défaut au niveau des grands thèmes : T3 « à l'inverse de 7 autres qui défendent la sectorisation, sa souplesse ou son application stricte » s'appuie sur P95, P321 et P13 (des plaintes), mais aussi sur P134 I0275 et P137 I0285, qui apprécient la liberté de choix et ne sont donc pas « à l'inverse » des 5 qui la réclament. |
| 3 | Regroupement | 7 | 52 motifs, aucun motif orphelin, de bonnes réunions (Démarches G4 ; Coût G11 ; Continuité G5). Défauts : des pôles incohérents. Carte scolaire G3 met dans le camp positif des partisans de la liberté (P134, P137) et des partisans d'une carte stricte (P95, P321, P13). Maintien des écoles de proximité G14 oppose des gens qui défendent tous l'école proche. Coût G11 mêle la gratuité de l'école et le coût du supérieur. Émiettement ailleurs : rythmes en 2 (G44, G51), supérieur en 4 (G19, G22, G37, G50), « Classes de niveau » P34 I0088 rangé dans Niveau d'exigence. 51 copies, 4 étiquettes qui dépendent des copies. |
| 4 | Chiffres et minorités | 6 | Carte scolaire : avec P95 et P321 remis du côté des critiques, on passe de 24 sur 31 « majorité » à 26 sur 31 « large majorité » : **l'étiquette du résumé est fausse**. Faux partage sur les écoles de proximité. Minorités effacées : les 16 jugements d'ensemble négatifs de G1 (dont 9 départs vers le privé, P38, P41, P112, P173, P202, P265, P285, P293, P362) n'apparaissent ni dans le résumé ni dans T1. T7 réduit le climat scolaire à « une personne… une autre… une troisième » alors que les motifs comptent 5 (harcèlement G42), 7 (discipline G35) et 8 personnes (bienveillance G26). Le harcèlement est absent du résumé. |
| 5 | Synthèses et thèmes | 6 | Les synthèses de motif sont claires et transparentes (G3 avoue « ou regrettent qu'elle soit contournée »). Mais les grands thèmes donnent de faux consensus. T2 : « Leur engagement reste pourtant salué par 24 personnes » tait les 13 critiques et 3 mitigés de G2. T1 tait les 16 avis négatifs. T3 contient une opposition fausse (voir critère 2). |
| 6 | Valeur pour la restitution | 6,5 | Le résumé est court (272 mots) et bien hiérarchisé (« la critique la plus partagée », « la proposition la plus partagée ») ; il cite les inégalités. Mais l'erreur sur la carte scolaire saute aux yeux dans le rapport : « 🟢 P95 — « Insatisfaction : passe droit… » » figure sous « Avis positifs ». Le faux partage des écoles de proximité est à retirer avant toute restitution. |
| | **Moyenne** | **6,58** | |
| | **Note globale de méthode** | **6,5** | |

### Erreurs du résumé Y : 3 (plus 1 discutable)

1. **Avis dans le mauvais camp**, Carte scolaire (« critiquée par 24 des 31 ») : P95 I0200 « Insatisfaction : passe droit par connaissance d'un tel » est compté positif.
2. **Avis dans le mauvais camp**, même motif : P321 I0626 « La carte scolaire inappliquée car avec toutes sortes de procédés de détournement » est compté positif.
   - Ces deux corrections font passer l'étiquette de « majorité » à « large majorité » (26 sur 31).
3. **Phrase fausse pour toutes les personnes qu'elle compte** : « Les avis sont partagés sur… maintien des écoles de proximité (5 positifs, 8 négatifs et 2 mitigés) ».
   - Les positifs (P1 I0001, P143 I0293, P218 I0437, P226 I0455, P256 I0517) apprécient leur école proche.
   - Les négatifs déplorent les fermetures.
   - Personne n'est contre le maintien : le partage vient de la définition des pôles.
4. *Discutable* : P13 I0035 (« il n'y a plus de carte scolaire donc il y a une scolarité à deux vitesses ») est compté positif dans la carte scolaire. La définition de Y (« défendre la sectorisation ») le permet, mais c'est une plainte.

Hors décompte :
- Le résumé passe sous silence les 16 avis négatifs du motif qu'il cite en premier.
- « propositions en sens contraire sur le regroupement des écoles de village [I0334, I0391] » : P165 cite le regroupement parmi ses satisfactions et ne fait pas de proposition.
- « le profil attendu des enseignants recrutés » couvre P201 (« Les profs doivent accepter les réformes »), qui ne parle pas de recrutement.

### Structure Y

- Motifs à une personne : 0 sur 52. Pas de défaut.
- Plus gros motif : G1, 77 idées sur 804, soit 9,6 %. Pas de fourre-tout.
- 7 motifs de 3 personnes ou moins.
- 51 copies ; 4 étiquettes changent sans les copies, dont Qualité des enseignants (9 copies : « avis partagés », qui deviendrait « majorité »).

### Langue Y : 8 sur 10

| Naturel | Précision | Hiérarchie | Concision | Cohérence du vocabulaire |
|---|---|---|---|---|
| 8 | 7 | 8,5 | 8,5 | 8 |

- **Naturel et hiérarchie** : phrases nettes, ordonnées par importance (« Ce qui freine le plus, pour 27 personnes, c'est l'absence d'enseignants devant les élèves » ; « L'orientation est le point noir de la fin de scolarité »).
- **Concision** : 4 658 mots, 24,4 mots par phrase en moyenne.
- **Précision** : les chiffres des grands thèmes sont souvent arrondis au silence. T7 dit « une personne… une autre… une troisième » pour des motifs de 5 à 8 personnes ; T2 dit « engagement » pour des éloges qui portent aussi sur la compétence.
- **Lourdeurs ponctuelles** :
  - « 27 des 27 personnes qui donnent un avis (unanime) » ;
  - « L'accès à l'école vient ensuite : » suivi du niveau et des démarches, qui ne relèvent pas de l'accès ;
  - « réunit 5 personnes (notamment P24), comme le profil attendu des enseignants recrutés » (ellipse maladroite).

---

## Comparaison critère par critère

| Critère | X | Y | Écart et raison |
|---|---|---|---|
| 1. Découpage | 7,5 | 6,5 | X garde les objets et les tons (question P342, positifs P57 et P34). Y fusionne au prix de tons perdus et code positives deux plaintes explicites. X émiette davantage les listes (P124, P358), ce qui coûte peu car on compte des personnes. |
| 2. Traçabilité | 8 | 7,5 | Les deux sont mécaniquement propres. X : un renvoi hors motif dans le résumé (I0008) et un double compte par copie dans T1. Y : T3 s'appuie sur des personnes qui disent l'inverse de la phrase. |
| 3. Regroupement | 7 | 7 | X : objets nets et pôles cohérents, mais émiettement et 74 copies. Y : moins d'orphelins et de bonnes réunions, mais deux motifs du résumé ont des pôles incohérents (Carte scolaire, Écoles de proximité). |
| 4. Chiffres et minorités | 7,5 | 6 | Y donne une étiquette fausse sur la carte scolaire, un faux partage, et efface des minorités (16 avis négatifs de G1, harcèlement). X oublie les inégalités dans le résumé mais garde les minorités visibles. |
| 5. Synthèses et thèmes | 7 | 6 | X : majorité puis minorité, avec quelques oppositions surinterprétées. Y : faux consensus dans T2 et T1, chiffres réduits dans T7. |
| 6. Restitution | 7 | 6,5 | Y se lit mieux, mais son erreur la plus visible (🟢 « Insatisfaction ») discrédite la page. X est plus long, mais deux phrases à couper suffisent. |
| **Méthode** | **7,5** | **6,5** | |
| **Erreurs du résumé** | 3 (+1) | 3 (+1) | Même nombre. Chez Y, elles faussent une étiquette (carte scolaire) et un « ce qui divise » ; chez X, ce sont des phrases rédigées, et le seul avis mal rangé ne change aucune étiquette. |
| **Langue** | 7,5 | 8 | Y est plus net et plus court ; X est plus précis mais lourd. |

## Verdict

**Je publierais X, avec une confiance modérée.**

Les trois raisons qui décident :

1. **Les camps sont justes sur les motifs qui comptent.**
   - Chez Y, la carte scolaire, deuxième critique du résumé, range des plaintes explicites parmi les avis positifs (P95 « Insatisfaction… », P321 « inappliquée… »), ce qui fausse l'étiquette (« majorité » au lieu de « large majorité »).
   - Y invente aussi un partage sur les écoles de proximité.
   - Les erreurs de X sont des phrases à corriger (« sens opposés », « gratuité 5 sur 7 »), pas des comptes faux sur les grands motifs.
2. **Les minorités restent visibles.**
   - X dit systématiquement le camp contraire et garde le harcèlement dans le résumé.
   - Y tait les 16 jugements négatifs d'ensemble du motif qu'il cite en premier.
   - Y écrit dans T2 que l'engagement des enseignants est « salué par 24 personnes » sans les 13 critiques.
   - Y réduit à « une personne » des sujets portés par 5 à 8 personnes (T7).
3. **Le découpage est plus fidèle.** X garde les objets distincts et leur ton (P342 en question, P57 et P34 avec leur positif). Y fusionne des idées et perd des polarités.

**Ce qui tempère la confiance** : Y écrit mieux (8 contre 7,5) et son résumé hiérarchise plus vite. Sa structure est plus saine (aucun orphelin, 51 copies contre 74, 4 étiquettes dépendantes des copies contre 8). Les deux ont le même nombre d'erreurs du résumé.

**À corriger dans X avant publication** :
- retirer ou réécrire la phrase sur la gestion des enseignants (I0054, I0008) ;
- remplacer « La gratuité de l'école satisfait 5 sur 7 » par le libellé du motif (« L'école gratuite ou financée par l'impôt satisfait 5 des 7 personnes ») ;
- ajouter les inégalités (17 sur 17) au résumé.
