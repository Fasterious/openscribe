# Notation `methodologue` — synthèse evalV3-1 (Grand débat 2019, scolarisation, 378 réponses)

Moteur : claude-opus-5-5, méthode « consultation », codage en double activé.

## 1. Ce que j'ai lu et les contrôles faits

Lu : `rapport.md` (résumé, les cinq listes, les grands thèmes T1 à T10, la fiche de la plupart des motifs, Hors question, Méthode),
`state.json` (idées, motifs, définitions, copies, thèmes, résumé, journaux `retoned`, `moved`, `merges`), `corpus.csv` (réponses lues en entier
pour une vingtaine de participants : P2, P17, P20, P25, P30, P33, P34, P38, P55, P57, P78, P87, P110, P142, P166, P177, P188, P203, P252,
P260, P262, P264, P275, P283, P299, P334), `metrics.ts` et `highlights.ts`.

Contrôles par script (dans `evalV3-1-scripts/`, à côté de ce dossier) :
- **Verbatims** : 1001 idées, 997 retrouvées mot pour mot dans la réponse de leur auteur ; les 4 restantes (I0232, I0879, I0880, I0898)
  sont des coupures « […] » dont chaque morceau est exact. Aucune citation inventée.
- **Couverture** : 366 participants sur 378 ont au moins une idée ; les 12 autres disent « pas concerné », « trop longtemps », « ne comprends
  pas la question » ou parlent de décentralisation (P9) : rien d'oublié. 9 idées hors question (P57 sur les boucheries halal, P87 sur l'ACRE,
  P295 sur l'hôpital, P311) bien écartées et listées.
- **Chiffres** : P/N/M recalculés pour les 65 motifs et les 10 thèmes : aucun écart avec les métriques stockées ni avec le rapport.
- **Renvois** : environ 150 listes de renvois des synthèses (motifs, thèmes, résumé) contrôlées : toutes les idées citées existent et
  appartiennent au périmètre ; chaque compte « N personnes » correspond au nombre de personnes citées (les écarts trouvés par le script étaient
  des dénominateurs « des 29 » ou des listes « 7 … et 4 » additionnées, vérifiés un par un).
- **Structure** : 65 motifs, 6 à une seule personne (9 %), le plus gros motif (G1) a 7,3 % des idées : ni fourre-tout ni émiettement massif.
- **Polarité globale par personne** (hors copies) : 211 seulement critiques, 61 seulement positives, 74 mitigées.
- **Recouvrements** : 35 paires d'idées d'une même personne se chevauchent (presque toujours « X » positif et « X, mais Y » négatif).
- **Bavards** : P57 (16 idées dont 4 hors question), P272, P361 (12 chacun) ; P361 est dans 12 motifs. Aucun ne fait un chiffre à lui seul.

## 2. Les six critères

| # | Critère | Note /10 | En bref |
|---|---|---|---|
| 1 | Découpage en idées | **8** | Verbatims exacts, couverture complète, hors question bien isolé, tons justes dans l'immense majorité ; les réserves restent attachées (« X, mais Y » : P122, P191, P244, P303, P318). Défauts : P87 coupé en un positif et un négatif sur **la même phrase** dans le même motif (I0219/I0220), ce qui crée un faux « mitigé » alors que la phrase dit que les enseignants dévoués « sont restés l'exception » ; P262 : I0646 recopie I0645 et a été retonnée en positif, si bien que sa critique des quotas du privé disparaît ; I0623 (P252, éloge de la « sélection par le haut ») compté négatif sur « Niveau scolaire ». |
| 2 | Traçabilité | **8,5** | Chaque compte est justifié par ses renvois ; aucun renvoi hors périmètre. Faiblesses : la première phrase de T1 (« Certains saluent le dévouement…, mais d'autres critiquent… ») renvoie à P87, P17, P34, P55 sans dire qui dit quoi ; dans G5, « À l'inverse, 7 personnes regrettent le manque de reconnaissance » relie par un contraste des personnes qui sont toutes dans le même camp (négatif). |
| 3 | Regroupement | **7** | Motifs bien nommés, découpés à l'échelle d'un geste, tous rattachés à un thème. Mais deux motifs réunissent des positions opposées sous une même polarité : **Carte scolaire** (G3, issu de la fusion avec « Respect de la carte scolaire ») mêle ceux qui veulent la liberté de choix et ceux qui dénoncent son contournement (P321, P365) ; **Gestion des enseignants** (G5) mêle « les mauvais profs sont intouchables » (10 personnes) et « les profs ne sont ni reconnus ni assez payés » (7). « Déroulement de la scolarisation » (G2) recueille les verdicts positifs d'ensemble alors que les verdicts négatifs d'ensemble sont dispersés : son 49 sur 51 est mécanique. Émiettements mineurs : « Grèves des enseignants » (2) à côté de « Absences » (P55, P160, P221 y parlent aussi de grèves), « Dénigrement des accents régionaux » (1) à côté de « Langues régionales », « Mixité sociale » (3, dont 2 copies) à côté de « Carte scolaire » et « Inégalités ». |
| 4 | Fidélité des chiffres et des minorités | **7** | Tous les comptes sont justes, en personnes ; mitigés à part ; contre-courants nommés dans chaque fiche (3 critiques du privé, 4 positifs sur le niveau, la personne satisfaite de sa carte scolaire P31) ; voix isolées visibles (P1 et ses 4 heures de route, P342 sur le bac) ; mentions « à vérifier » et « fragile » posées par le code. Mais deux « unanime / large majorité » du résumé sont de faux consensus (voir § 4), et « Ce qui a marché : 49 avis positifs sur 51 » laisse croire à une satisfaction quasi générale alors que 211 personnes sur 366 ne font que critiquer. « La critique la plus partagée » (carte, 25) ne devance les absences (24) que d'une voix, et cette voix est une copie (I0953, P181). |
| 5 | Synthèses et thèmes | **7,5** | Synthèses fidèles, sans surinterprétation trouvée, camp majoritaire d'abord puis contre-courant ; T1 dit bien « Deux attentes coexistent » ; T9 et T8 signalent des critiques « en sens contraires ». Faiblesses : la synthèse de G5 dit « unanime » puis « pour des raisons très différentes » sans tirer la conséquence ; T7 titre une phrase « Contourner la carte reste difficile » puis y range 4 personnes qui dénoncent qu'on la contourne trop ; le résumé dit que « certaines » des 49 satisfaites nuancent ailleurs, alors que c'est le cas de 21 sur 49. |
| 6 | Valeur pour la restitution | **7** | Le résumé suit la bonne charpente (ce qui marche, ce qui bloque, ce qui divise, ce qu'on propose, questions) et les listes du code sont directement utilisables. Mais le deuxième paragraphe aligne huit étiquettes « unanime / large majorité » sans hiérarchie ni lecture d'ensemble (aucune phrase ne dit que le corpus est d'abord critique) ; les propositions retenues sur la gestion des enseignants ne montrent que le versant « sanctionner » (P5) et taisent le versant « reconnaître, accompagner » (P233, P264) ; « Et aussi » de 28 et 39 motifs. Présentable après une relecture d'environ 1 h 30. |

## 3. Note

- Moyenne : (8 + 8,5 + 7 + 7 + 7,5 + 7) / 6 = 7,5.
- **Note globale : 7,5/10 · 2 erreurs du résumé · structure saine** (6 motifs sur 65 à une personne ; plus gros motif 7 % des idées).

## 4. Détail des erreurs du résumé

**Erreur 1 — « la gestion des enseignants [est critiquée] par 22 sur 22 (unanime) » : un faux consensus.**
Les 22 « négatifs » de G5 critiquent la gestion dans deux directions opposées :
- 10 jugent les enseignants défaillants impunis et veulent plus de contrôle (P17, P57, P130, P135, P160, P233, P302, P337, P343, P361) ;
- 7 défendent les enseignants contre leur institution, faute de reconnaissance ou de salaire (P2 « le manque de reconnaissance qu'ils expriment »,
  P87, P140, P264, P303 « font un travail formidable et ne sont pas reconnus », P310, P318 « salaires indécemment bas ») ;
- 4 parlent de recrutement ou d'effectifs (P67, P186, P208, P376), et P142 de déni.

« Unanime » laisse conclure à une demande commune ; en réalité, les deux camps attendent des remèdes contraires. La phrase de propositions
qui suit (« l'une d'elles voudrait pouvoir licencier… », P5) renforce cette lecture en ne montrant qu'un versant. Le thème T1 le dit bien
(« Deux attentes coexistent »), mais le résumé ne le reprend pas.

**Erreur 2 — « la critique la plus partagée porte sur la carte scolaire, critiquée par 25 des 29 personnes » : des avis dans le mauvais camp.**
G3 vient de la fusion « Carte scolaire » + « Respect de la carte scolaire ». Parmi les 25 « critiques de la carte », P321 (« La carte scolaire
inappliquée car avec toutes sortes de procédés de détournement ») et P365 (« Impensable de ne pas obtenir une place dans le lycée le plus proche
alors que de multiples dérogations ou inscriptions de copinages se font ») réclament que la carte soit appliquée : ils critiquent son
contournement, pas la carte. P132 (I0331, passe-droit du fils du maire) et P42 (I0124, la commune qui « déroge à la loi ») sont dans le même
cas pour une partie de leurs propos. À l'inverse, le camp « positif » réunit P31 (« la carte scolaire c'était très bien ») et P134/P137 (liberté
de choisir, dérogation facile) : deux positions contraires. La définition même du motif (« apprécier la sectorisation **ou** obtenir facilement
une dérogation ») mêle les deux sens. Enfin, la primauté « la plus partagée » tient à une voix (25 contre 24 pour les absences) et cette voix
est une copie (I0953, P181) : sans elle, les deux sujets sont à égalité.

**Signalé sans être compté** (fragile, pas faux) : « 49 personnes portent un jugement positif d'ensemble ». Le chiffre est juste et le résumé
dit qu'il est nuancé ailleurs, mais 6 à 9 de ces jugements ne sont pas « d'ensemble » : P34, P114, P280 (primaire seulement), P364 (« mais il
n'est qu'en maternelle »), P165 (passage primaire-secondaire), P70 et P209 (sous condition), P358 (« pour l'instant »). Et 21 des 49 critiquent
ailleurs (P34 cinq fois, P358 sept fois).

## 5. Corrections proposées, par ordre d'importance

1. **Contrôle des motifs « unanimes à deux directions »** (étape, pas correction à la main) : quand les négatifs d'un motif se partagent entre
   deux remèdes opposés (G5) ou deux griefs opposés (G3 : trop rigide / pas assez appliquée), scinder le motif ou le faire passer dans
   « Ce qui divise » comme « constat partagé, remèdes opposés ». La consigne de définition doit interdire les « ou » qui réunissent deux sens
   contraires dans le positif ou le négatif (G3 : « apprécier la sectorisation ou obtenir facilement une dérogation »).
2. **Fusion du livre de codes** : une fusion n'est acceptée que si les deux motifs ont la même direction de jugement ; « Respect de la carte
   scolaire » ne devait pas rejoindre « Carte scolaire » sans que ses avis soient retournés (le défendre = positif pour la carte).
3. **Motif des verdicts d'ensemble** : « Déroulement de la scolarisation » ne doit pas figurer dans « Ce qui a marché » avec un dénominateur qui
   ne contient presque que des positifs ; soit y ranger aussi les verdicts négatifs d'ensemble (« Catastrophe à tout niveau », P357 ; P5), soit
   l'afficher comme un compte (« 49 personnes se disent satisfaites dans l'ensemble ») sans étiquette d'échelle. Ajouter au résumé une phrase
   de cadrage calculée par le code (« 211 des 366 participants ne font que des critiques, 61 que des éloges, 74 les deux »).
4. **Résumé** : quand un motif cité a deux camps de propositions, citer un exemple de chacun (P5 et P264 pour G5) ; remplacer « que certaines
   nuancent ailleurs » par le compte (21 sur 49), injecté par le code.
5. **Découpage** : interdire deux idées d'une même personne au même verbatim dans un même motif (P87 I0219/I0220, P262 I0645/I0646) ; une
   phrase « X, mais Y » donne une seule idée, du ton de Y, quand Y nuance X sur le même objet.
6. **Émiettement** : rattacher « Grèves des enseignants » à « Absences des enseignants », « Dénigrement des accents régionaux » à « Langues
   régionales ».
7. **Confidentialité** : le prénom « Guillaume » (P132) apparaît en clair (`maskNames: false`) ; le rapport le signale, il faut le masquer
   avant diffusion.

**Temps de relecture humaine estimé : environ 1 h 30** — scinder G3 et G5 et réécrire leurs synthèses (40 min), reprendre trois phrases du
résumé (15 min), relire les 4 étiquettes « à vérifier » et les deux doublons (20 min), masquer le prénom et relire l'ensemble (15 min).
