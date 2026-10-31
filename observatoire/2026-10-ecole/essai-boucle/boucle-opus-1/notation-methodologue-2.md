# Notation methodologue (lecture 2) : synthèse R2

Grand débat national 2019, question sur la scolarisation des enfants, 378 réponses. Moteur : Claude opus-5-5, méthode « consultation », codage en double activé, mode libre (pas de grille imposée).

## 1. Ce que j'ai lu et les contrôles faits

Lu : `rapport.md` (résumé, listes du code, fiches des motifs Carte scolaire et autres, Méthode), `state.json` en entier par script (827 idées, 51 motifs, 9 thèmes, 18 copies, 6 changements de ton, 5 déplacements), `corpus.csv` (les réponses brutes de toutes les personnes citées ci-dessous), et les règles de `metrics.ts` et `highlights.ts`.

Contrôles faits par script :
- **Verbatims** : les 827 se retrouvent mot pour mot dans la réponse de leur auteur (0 écart, 0 « approximatif »).
- **Couverture** : texte des réponses non couvert par une idée (passages de plus de 40 caractères). Il reste 13 passages, presque tous hors sujet (P9 sur la décentralisation, P57 sur les boucheries, P295 sur l'hôpital) ou des non-réponses (« Pas d'enfants », « Il y a trop longtemps »). La seule vraie omission est P60 (administration du supérieur, vacataires). Les 15 personnes sans idée ont bien des non-réponses.
- **Chevauchements** : 18 paires d'idées se recouvrent, toujours un positif et un négatif de la même phrase (« Bons niveaux de professeurs mais trop d'élèves »). La réserve reste donc dans la citation : c'est voulu, et c'est bien fait.
- **Indicateurs** : j'ai recalculé P, N et M pour les 51 motifs à partir des idées. Ils concordent tous avec `metrics`, sans écart. Les étiquettes suivent l'échelle de `stanceOf`, et les mentions « à vérifier » suivent `labelDoubt` (Carte 20/24 sans copies, large majorité ; Qualité des enseignants 27/12/3, majorité ; Démarches 8/19/2, majorité).
- **Structure** : chaque idée est rangée exactement une fois, chaque motif a un thème. Aucun motif ne repose sur une seule personne : le plus petit en compte 3 (G51) et le plus gros 55 idées (6,6 % du total). Les 3 personnes les plus prolixes portent 3,6 % des idées.
- **Synthèses de motifs** : pour chaque phrase, j'ai comparé le nombre annoncé au nombre de personnes distinctes dans les renvois, puis vérifié que les renvois sont du bon ton (aucune phrase de camp ne mélange positifs et négatifs, hors phrases « mitigées » explicites). J'ai aussi vérifié que chaque renvoi d'une synthèse de thème appartient bien à ce thème (tous y appartiennent).
- **Résumé** : chaque chiffre a été comparé aux indicateurs, et chaque idée citée relue dans sa réponse brute.

Relu à la main : tous les verbatims des motifs G1 à G19, G21, G24, G25, G28, G30, G32, G37, G42, G45 et G49, les 18 copies, les 6 changements de ton, et les réponses complètes de P2, P3, P5, P11, P13, P43, P46, P70, P87, P104, P134, P137, P140, P154, P162, P221, P251, P264, P287, P289, P321, P364, P365 et P370.

## 2. Les six critères

| # | Critère | Note /10 | En bref |
|---|---|---|---|
| 1 | Découpage en idées | **8** | Découpage fin et juste : un avis par objet, réserves gardées dans la citation (I0331/I0332, I0472/I0473, I0469/I0470), couverture presque totale. Trois des six changements de ton sont de bonnes corrections (I0121 « heureusement qu'il y a ACADOMIA » devenu constat, I0728, I0803). Il reste des tons contestables. **I0787 (P365)** passe de négatif à positif dans Carte scolaire, alors que la personne s'indigne de ne pas avoir de place près de chez elle ; la citation coupe la suite « alors que de multiples dérogations ou inscriptions de copinages se font », qui donne le sens. **I0545 (P252)** passe de négatif à suggestion, alors qu'il exprime un avis net (« Il est dommage aujourd'hui de faire exactement l'inverse »). **I0796 (P370)** est compté négatif sur l'orientation, alors que la personne attribue la difficulté aux jeunes (« ils ne savent pas trop ce qu'ils veulent faire »). **I0164 (P70)** : « sauf ceux qui ont une situation particulière » est rangé dans Élèves à besoins particuliers, alors que la phrase parle des services municipaux. **La copie I0817 (P140)**, « Enseignant démotivé par les changements et une rémunération insuffisante », est comptée comme critique de la qualité des enseignants, alors qu'elle plaint leurs conditions de travail. Quelques fragments ne se comprennent pas seuls : I0538 « malgré des moyens limités », I0612, I0005. |
| 2 | Traçabilité | **8** | Les renvois des synthèses de motifs sont justes et les comptes collent aux personnes renvoyées. Écarts relevés : **G13**, « 4 personnes, et 3 autres », renvoie à 6 personnes seulement (P340 est comptée deux fois). La synthèse du thème « Enfants à besoins particuliers » donne deux exemples (« une association…, des méthodes plus tolérantes ») avec un seul renvoi (I0743 ; I0822 manque). Dans le résumé, l'exemple du camp négatif sur les enseignants, I0014 (P5) « L'éducation générale et en particulier les instituteurs/trices en primaire !!!!!! », ne se comprend pas seul et vise surtout la méthode de lecture (voir I0015). Enfin, « dénoncées par les 27 personnes » n'est pas justifié par les renvois pour ce que la phrase leur fait dire (erreur 1). |
| 3 | Regroupement | **7,5** | 51 motifs, presque tous actionnables d'un geste (Démarches administratives, Continuité des cours, Effectifs, Orientation, AVS et handicap…), 9 thèmes cohérents, ni fourre-tout ni orphelin. Deux faiblesses de construction. (a) **Carte scolaire (G5)** : la définition met dans le même camp positif « défendre la sectorisation ou saluer sa souplesse ». Le camp positif réunit donc des positions opposées : P13, P321 et P365 défendent la règle contre les contournements, P134 (« possibilité de choisir l'établissement ») et P137 (dérogation obtenue) saluent l'inverse. Le « 20 sur 26 » mesure deux choses à la fois. (b) Le même sujet est éclaté : carte, affectation et passe-droits se répartissent entre G5, G45 (Équité des affectations, où l'on retrouve P321 et P365), G28 (Proximité) et G49 (Transports). « Recours au privé » est dispersé dans G3, G5, G21, G25, G32 et G46 sans jamais être réuni. Qualité des enseignants (G1) et Contrôle des enseignants (G19) se recouvrent : 4 copies de G19 vers G1. G3 mêle un jugement sur l'école publique et un comportement (la quitter pour le privé), mais sa définition le dit. |
| 4 | Fidélité des chiffres et des minorités | **7,5** | Le code compte juste et compte des personnes, les mitigés sont à part, les minorités restent visibles dans les fiches (les 2 critiques du privé en G12, P348 et P179 en G7, P235 en G15). Trois étiquettes sont pourtant fragiles. **Démarches administratives**, « avis partagés » : 10 contre 19, soit 0,526, juste au-dessus du seuil de 0,5. L'étiquette tient à la copie I0826 (P154, « le service de la mairie compétent », sans rapport explicite avec une démarche) ; sans elle, c'est « majorité ». Le résumé l'annonce sans « fragile », alors que la liste « Ce qui divise » le porte. **Carte scolaire**, « majorité » : elle tient au camp positif hétérogène décrit au critère 3. **Déroulement de la scolarité**, « 41 sur 41 » dans « Ce qui a marché » : c'est un panier « aucun problème » sans contrepartie négative possible (les difficultés vont dans les autres motifs). Le chiffre est vrai, mais il ne mesure pas un accord. Proximité de l'école (5 contre 4) est classée dans « Ce qui divise » : ce sont des situations différentes (école proche ou lointaine), pas des avis opposés. |
| 5 | Synthèses et thèmes | **7,5** | Les synthèses de motifs sont fidèles et nuancées : majorité d'abord, minorité ensuite, mitigés décrits (G4, G7, G11, G17, G25). Elles ne surinterprètent pas. Défauts relevés. Le résumé durcit la synthèse G6 : « absences et grèves, surtout quand personne ne remplace » y devient « absences non remplacées » (erreur 1). Le thème « Accès à un établissement » écrit « Deux positions s'opposent sur la carte scolaire » : faux équilibre, entre 20 critiques et 5 partisans de la suppression d'un côté, 2 à 3 défenseurs de l'autre. Le thème « Ce que l'école enseigne » écrit « Les sorties… sont saluées, quand elles ont les moyens d'exister », alors que G48 est à 2 contre 2. |
| 6 | Valeur pour la restitution | **7,5** | Le résumé hiérarchise bien : ce qui marche (1re phrase), ce qui bloque (6 motifs chiffrés avec leur étiquette), ce qui divise (3 motifs plus « 5 autres »), ce qu'on propose (8 pistes chiffrées). Les mentions « à vérifier » sont reprises sous le résumé, et un chercheur pourrait le présenter. Mais sa phrase d'ouverture et sa critique principale portent chacune une erreur (section 4). Le 2e paragraphe empile neuf chiffres d'affilée. Les renvois « (notamment P28) (notamment P271) (notamment P54) » sont accolés. Le prénom « Guillaume » (I0286, cité en exemple du privé) est à masquer avant diffusion : le rapport le signale. |

## 3. Note

- Moyenne : (8 + 8 + 7,5 + 7,5 + 7,5 + 7,5) / 6 = 7,67.
- **Note globale : 7,5/10 · 2 erreurs du résumé · structure saine** (aucun motif à une seule personne, 0 sur 51 ; le plus gros motif porte 6,6 % des idées).

## 4. Détail des erreurs du résumé

**Erreur 1, Continuité des cours.** Le résumé dit : « la critique la plus partagée vise les absences d'enseignants non remplacées, dénoncées par les 27 personnes qui donnent un avis (unanime) ».
- Seules 11 des 27 personnes parlent explicitement d'un non-remplacement : P34, P144, P203, P233, P241, P245, P276, P295, P302, P336 et P362. P236 critique des remplaçants non formés.
- Les 15 autres dénoncent autre chose :
  - l'absentéisme lui-même, sans rien dire du remplacement : P38, P117, P160, P166, P202, P210, P270, P337, P367, P221 ;
  - les grèves : P55, P364 (une supposition : « je pense que les grèves… doivent être beaucoup plus gênantes au collège ») ;
  - des arrêts maladie jugés abusifs : P67, P201 ;
  - la mobilité des enseignants : P376.
- La phrase est donc fausse pour plus de la moitié des personnes comptées. Elle change aussi la cible de l'action : le remplacement relève du rectorat, l'absentéisme et les grèves relèvent du comportement des enseignants. La synthèse du motif était juste (« Les absences et les grèves d'enseignants, surtout quand personne ne remplace… ») : l'erreur naît à la rédaction du résumé.

**Erreur 2, Déroulement de la scolarité.** Le résumé dit : « 41 personnes portent un jugement positif d'ensemble sur la scolarité de leurs enfants, que certaines nuancent ailleurs ».
- « Certaines » sont en fait 21 sur 41, soit la moitié : ces personnes expriment au moins une difficulté ailleurs (P33, P46, P51, P69, P70, P77, P114, P115, P153, P163, P167, P184, P188, P209, P220, P280, P311, P334, P341, P358, P364).
- Pour au moins 9 des 41, il ne s'agit pas d'un « jugement d'ensemble » :
  - le bilan ne vaut que pour un cycle ou un enfant : P114 (primaire), P280 (« en primaire pas de problème »), P364 (« il n'est qu'en maternelle »), P184 (« primaire et lycée OK »), P167 (une fille « à l'aise » alors que son fils « a vécu… en enfer ») ;
  - le bilan est conditionnel : P209 (« Si l'enfant a des dispositions… ») ;
  - l'idée vient d'un autre objet : la copie I0824 (P46, l'école du village encore ouverte), la copie I0825 (P70, les services municipaux), et I0355 (P165, le passage primaire-secondaire).
- La synthèse du motif le disait (« Pour 5 d'entre elles, ce bilan ne vaut que pour un cycle ou un enfant »), mais le résumé l'efface. Il ouvre le rapport sur un satisfecit plus large que les données.

Fragilités non comptées comme erreurs, mais à signaler au lecteur :
- Démarches administratives : « avis partagés » sans « fragile » ; l'étiquette tient à une copie faible.
- Carte scolaire : « majorité » ; elle dépend d'un camp positif hétérogène, et I0787 est sans doute mal tonné.
- « Contrôle plus étroit des enseignants, avancé par 8 personnes » : P264 (« Ses élèves et leurs parents devraient pouvoir contribuer à sa reconnaissance ») parle de reconnaissance, pas de contrôle, dans une réponse qui défend les professeurs (« n'ont plus aucun droit »). Le juste compte est donc 7 sur 8.

## 5. Corrections proposées, par ordre d'importance

1. **Résumé, contrôle de fidélité au motif.** Une phrase du résumé qui reprend un motif ne doit pas être plus précise que sa synthèse. Il faut une consigne explicite : reprendre le qualificatif du motif (« absences et grèves »), et ne jamais ajouter de condition (« non remplacées ») absente de la synthèse. Pour un panier « aucune difficulté », la consigne dira : « N personnes ne signalent aucune difficulté, dont X en signalent ailleurs », X étant calculé par le code et injecté, au lieu de « certaines ».
2. **Définitions à double face.** Interdire une définition qui met dans le même camp deux positions opposées (« défendre la règle ou saluer sa souplesse »). Le livre de codes doit nommer l'objet jugé : ici, « la règle de sectorisation » (pour ou contre) et non « l'expérience vécue ». Sinon, scinder le motif (règle d'un côté, application et dérogations de l'autre) et fusionner G45 dans ce second motif.
3. **Changement de ton vers « positif » ou vers « suggestion »** : le moteur ne doit le faire que si la citation entière le justifie, sans s'appuyer sur un fragment amputé de sa principale (I0787) ; et une suggestion qui contient un jugement explicite (« il est dommage ») doit rester un avis (I0545). Un contrôle peut lister ces changements pour relecture.
4. **« Fragile » dans le résumé** : le code connaît `dividedFragile` ; il faut injecter « fragile » dans la ligne transmise au moteur pour un sujet « avis partagés » (Démarches), comme pour les autres étiquettes.
5. **« Ce qui divise »** : un motif où positifs et négatifs décrivent des situations différentes (école proche ou lointaine) ne doit pas être présenté comme un désaccord. La définition du motif doit porter sur un jugement, ou le motif doit sortir de la liste.
6. **Synthèses de thèmes** : donner les effectifs aux camps quand le thème dit « deux positions s'opposent », pour éviter le faux équilibre (Accès à un établissement).
7. Détails : corriger « 4 personnes, et 3 autres » (G13), ajouter le renvoi I0822 dans la synthèse du thème « Enfants à besoins particuliers », choisir pour le camp négatif des enseignants un exemple qui se comprend seul (I0357 ou I0701 plutôt que I0014), masquer « Guillaume ».

**Temps de relecture humaine estimé : environ 1 h 30.**
- Réécrire les deux phrases fautives du résumé : 15 min.
- Relire les citations des trois motifs « à vérifier » et trancher (Carte, Qualité des enseignants, Démarches) : 40 min.
- Corriger 4 à 5 tons (P365, P252, P370, P70, P140) et recalculer : 20 min.
- Ajuster deux phrases de thèmes et anonymiser : 15 min.
