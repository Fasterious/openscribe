# Arbitrage externe : synthèses X et Y (Grand débat 2019, scolarisation, 378 réponses)

## Ce que j'ai vérifié

- Lecture des deux `rapport.md`, des `state.json` et des règles de `metrics.ts` / `highlights.ts` ; tous les comptes et étiquettes ont été recalculés par script à partir des idées (`scripts/groups.py`) : ils sont conformes au code dans les deux synthèses.
- Échantillon tiré au sort (graine 2019, `scripts/sample.txt`) de 36 personnes : P17 P37 P55 P56 P80 P81 P83 P105 P123 P125 P126 P128 P139 P150 P163 P165 P174 P191 P192 P212 P215 P235 P248 P255 P288 P289 P307 P315 P327 P329 P330 P333 P336 P341 P356 P378, lues contre le corpus avec le découpage des deux synthèses côte à côte (`scripts/dump.py`). S'y ajoutent une trentaine de personnes ciblées (réponses longues et motifs du résumé) : P1 P2 P3 P5 P7 P12 P13 P16 P18 P20 P31 P46 P60 P62 P87 P92 P95 P99 P167 P183 P306 P318 P321 P349 P357 P361 P362 P365.
- Lecture intégrale, idée par idée, des motifs cités dans les deux résumés (X : G1 à G9, G12, G13, G14, G15, G17, G18, G24, G28, G42, G45 ; Y : G1 à G8, G10, G11, G13, G14, G16, G17, G19, G21, G30, G33, G34, G40, G48, G52, G55, G56, G58).
- Contrôles automatiques : verbatims exacts et spans (`verb.py`) : 0 écart dans X ; dans Y, 5 verbatims à coupure « […] » (champ `parts`), fidèles au texte. Renvois des synthèses (`trace.py`) : aucune citation hors du motif ou du grand thème résumé, dans aucune des deux. Tons comparés sur les 751 idées appariées (`tonediff.py`) : 53 désaccords, arbitrés au cas par cas ci-dessous.

| Indicateur brut | X | Y |
|---|---|---|
| Idées propres / copies (codage en double) | 753 / 51 | 935 / 74 |
| Idées par participant | 2,07 | 2,55 |
| Paires d'idées propres dont les verbatims se chevauchent | 9 | 35 |
| Motifs / grands thèmes | 52 / 9 | 67 / 10 |
| Motifs à 1 personne / à 3 personnes ou moins | 0 / 4 | 7 / 18 |
| Plus gros motif (part des idées) | G1, 9,6 % | G1, 7,5 % |
| Résumé (caractères) | 1 924 | 2 582 |

---

## Synthèse X

| # | Critère | Note /10 | Justification (identifiants) |
|---|---|---|---|
| 1 | Découpage en idées | 7,0 | Découpage propre sur les réponses courtes, réserves bien gardées (P341 I0674/I0675, P191). Mais les réponses en liste sont agglomérées : P318 I0622 réunit effectifs, salaires, matériel et handicap en une idée, puis la recopie dans « Scolarisation des élèves handicapés » (I0795) avec un verbatim presque sans rapport ; P361 I0717 mêle suivi des élèves, parents livrés à eux-mêmes et inégalités ; P99 I0208 fusionne l'aversion de l'enfant et le « votre fils n'est pas normal » ; P167 I0343 range « pas grâce à l'école » dans une idée positive ; P92 I0194 colle « bac pour tous » et « aucun accompagnement ». Tons : 3 plaintes classées positives dans « Carte scolaire » (P13 I0035, P95 I0200 « Insatisfaction : passe droit… », P321 I0626), P80 I0172 « Proximité des filières choisies » en constat alors que c'est une satisfaction, P342 I0677 (« point d'interrogation » sur la réforme du bac) lu comme une critique. |
| 2 | Traçabilité | 8,0 | Aucun renvoi hors motif, comptes du résumé tous adossés au bon motif (I0084, I0087, I0105…). Défaut : des synthèses de grand thème donnent un exemple sous forme de compte : « une personne dénonce un harcèlement ignoré par le proviseur » (P99) alors que G42 compte 5 personnes ; « une personne regrette l'absence d'anglais dès les petites classes » (P224) alors que P314 dit la même chose. |
| 3 | Regroupement | 6,5 | Peu d'émiettement (aucun motif à une personne), mais plusieurs motifs réunissent des objets opposés ou distincts : « Carte scolaire » (G3) mêle la rigidité de la sectorisation et son contournement par des passe-droits, d'où des plaignants comptés « pour » ; « Scolarisation dans l'ensemble » (G1) mêle le vécu de sa famille, la fuite vers le privé (P38, P202, P362) et le procès du système (P92, P118, P357 en copie) ; « Maintien des écoles de proximité » (G14) oppose des gens contents d'avoir une école proche (P1, P143, P226) à d'autres qui déplorent des fermetures : ce sont deux constats, pas deux avis sur un même objet ; « Coût de la scolarité » (G11) mêle gratuité de l'école et coût des études supérieures. Les rythmes sont coupés en deux motifs (G44, G51). 9 copies sur 52 idées dans G2. |
| 4 | Fidélité des chiffres et des minorités | 6,5 | Comptes conformes au code, mais l'étiquette « majorité » de la carte scolaire (24 sur 31) tient aux 3 plaignants classés positifs ; en les plaçant avec les critiques (27 sur 31) ou à part (24 sur 28), c'est « large majorité ». L'avis partagé sur « Qualité des enseignants » dépend de 9 copies (sans elles : « majorité », signalé « à vérifier »). Voix isolée importante peu visible : le harcèlement (5 personnes, 4 directions inertes : P99, P105, P232, P362) est absent du résumé et réduit à « une personne » dans le grand thème. |
| 5 | Synthèses et thèmes | 7,0 | Camp le plus nombreux d'abord, minorité ensuite, sans surinterprétation notable dans les motifs (G5, G7, G12, G13, G17, G18 sont exemplaires). Défauts : le grand thème « Accès » reprend le classement contestable (« 7 autres défendent la sectorisation… »), « Orientation et études » additionne gratuité de l'école et faible coût des grandes écoles, et les sous-comptes à « une personne » du grand thème « Prise en charge » minimisent. |
| 6 | Valeur pour la restitution | 7,5 | Résumé court et hiérarchisé, couvre les grands blocages (absences, carte, niveau, démarches, orientation, handicap, effectifs, inégalités) et un paragraphe de propositions net (7 personnes pour le contrôle des enseignants, vérifié sur G17). Il manque le harcèlement, et l'étiquette de la carte scolaire est à corriger. |
| | **Moyenne** | **7,17** | |
| | **Note globale de méthode** | **7,0** | |

**Erreurs du résumé : 1**
1. Carte scolaire, « critiquée par 24 des 31 personnes (majorité) » : 3 avis dans le mauvais camp. P95 (« Insatisfaction : passe droit par connaissance d'un tel »), P321 (« carte scolaire inappliquée… détournement ») et P13 (« il n'y a plus de carte scolaire donc… scolarité à deux vitesses ») sont des plaintes, comptées positives (retons I0200, I0626, I0035), alors que P365, qui dénonce lui aussi les copinages, est compté négatif. Correction : « large majorité ».

Aucune citation déformée. Les autres phrases tiennent pour l'essentiel. « L'orientation est jugée défaillante par 20 sur 20 » s'étire un peu pour P370 (« ils ne savent pas trop ce qu'ils veulent ») et P12. « Le profil attendu des enseignants recrutés » couvre 4 des 5 propositions (P201 parle d'accepter les réformes) : sans gravité.

**Structure** : aucun défaut au sens de la grille (0 motif à une personne sur 52 ; plus gros motif à 9,6 % des idées).

**Langue : 8,0**

| Critère | Note | Constat |
|---|---|---|
| Naturel | 8,0 | Phrases françaises et vivantes (« Ce qui freine le plus, pour 27 personnes, c'est l'absence d'enseignants devant les élèves »). Passif répété (« est dénoncée par », 13 fois). |
| Précision | 7,5 | Énumérations concrètes (« établissement voisin interdit pour une rue traversée, trajets doublés »), mais sous-comptes absents ou ramenés à « une personne » dans les grands thèmes. |
| Hiérarchie | 8,0 | Le plus fréquent d'abord, la nuance ensuite, partout. |
| Concision | 8,5 | 74 mots par synthèse de motif en moyenne, 4 points-virgules dans tout le rapport, 20 phrases de plus de 40 mots. |
| Cohérence du vocabulaire | 8,0 | Stable (« À l'inverse », « Mitigée, une personne… ») ; un seul « en sens contraire », à bon escient. |

---

## Synthèse Y

| # | Critère | Note /10 | Justification (identifiants) |
|---|---|---|---|
| 1 | Découpage en idées | 7,5 | Plus atomique et plus juste sur les réponses longues : P92 (10 idées distinctes, dont « Aucun accompagnement après » en orientation et « bac pour tous » en niveau), P99, P167, P183 (la menace de plainte I0457 isolée), P318, P361 (I0893 « aux parents de se débrouiller »), P22 ; la question de P342 est reconnue comme question (I0840) ; P80 est bien lu comme une satisfaction. Défauts : sur-fragmentation (P358 en 6 idées, P29 en 4, fragments sans objet comme P48 I0136 « il en est toujours de même » ou P236 I0584 « contact tres difficile ») ; 35 chevauchements de verbatims, dont P87 où la même phrase donne I0219 (neutralisée à tort : « enseignants particulièrement dévoués et courageux ») et I0220 (négative) ; quelques fusions (P16 I0050, P255 I0634, P75 I0201 nombre d'élèves et qualité des professeurs, réparée par une copie) ; P356 « Satisfaction : existence de l'enseignement privé » absorbé dans une suggestion (I0874) ; P209 (« si l'enfant a des dispositions… aucun problème ») compté positif ; P349 (« je n'ai plus cette responsabilité ») rangé en orientation. |
| 2 | Traçabilité | 7,5 | Sous-comptes systématiquement renvoyés (G3, G4, G8, G9, G16). Défauts : le résumé appuie « La gestion des enseignants… mieux payer et reconnaître le métier » sur I0008 (P2), qui appartient au motif « Reconnaissance des enseignants » ; le grand thème « Relations avec l'institution » additionne « 10 personnes » et « 8 » dont 3 sont les mêmes (P227, P248, P344, comptés deux fois par copies I0990-I0992) ; l'exemple choisi pour « relations avec l'administration » dans le résumé est P62 (« réponses trop longue »), verbatim ambigu qui peut viser le questionnaire lui-même. |
| 3 | Regroupement | 7,0 | Les grands objets sont mieux séparés : « Déroulement de la scolarité » (vécu, G2) distinct de « Enseignement public » (défiance, G33) ; « Carte scolaire » distinct de « Contournement de la carte scolaire » (G48) et de « Mixité sociale » ; « Formalités d'inscription » distinct de « Relations avec l'administration ». Défauts : émiettement (18 motifs de 3 personnes ou moins, dont 7 à une personne, classés « signaux isolés »), « Évaluation des élèves » (G55) séparé de « Bulletins scolaires » (G58) pour le même objet, quatre motifs de coût (G31, G34, G42, G57) ; « Passage en classe supérieure » (G44) réunit sous « unanime » deux positions opposées (pas de redoublement contre menace de redoublement, P167) ; copies abondantes (13 sur 76 idées dans G1, 10 sur 36 dans G5, dont 4 satisfactions d'inscription recopiées). |
| 4 | Fidélité des chiffres et des minorités | 7,5 | Comptes conformes. Minorités bien visibles : harcèlement (5 récits, 4 directions inertes) dans le résumé et le grand thème, « À contre-courant, 2 personnes… » dans les motifs majoritaires (G2, G13). Consensus et majorité bien distingués (carte scolaire 24 sur 28 « large majorité » sans plaignants à contresens). Défauts : l'avis partagé sur « Formalités d'inscription » tient à 2 copies (P345, P366 ; signalé « à vérifier ») ; « gratuité 5 sur 7 (majorité, fragile) » est promu dans le premier paragraphe du résumé. |
| 5 | Synthèses et thèmes | 6,5 | Synthèses de motif riches et ordonnées (G2, G3, G8, G9, G13). Mais il y a des oppositions fabriquées : « Ces critiques appellent des remèdes opposés » (grand thème Enseignants) et « critiques de sens opposés » (résumé), alors que G16 est unanime dans un seul sens et que vouloir sanctionner les défaillants n'empêche pas de vouloir mieux payer ; G44 « unanime… mais en sens contraire » ; G39 « 2 critiques de sens inverse ». Doubles comptes dans « Relations avec l'institution » (voir 2). |
| 6 | Valeur pour la restitution | 7,0 | Plus informatif (harcèlement, question soulevée, signaux isolés séparés, sous-comptes utiles pour agir). Mais le résumé omet les inégalités scolaires (17 sur 17, unanime) alors qu'il retient la gratuité (7 avis) et les relations avec l'administration (fragile) ; une phrase fausse est à retirer ; la prose est plus lourde. |
| | **Moyenne** | **7,17** | |
| | **Note globale de méthode** | **7,0** | |

**Erreurs du résumé : 1**
1. « La gestion des enseignants suscite des critiques de sens opposés : pouvoir sanctionner les défaillants, ou mieux payer et reconnaître le métier (P2, P17) ». La phrase est fausse pour le motif qu'elle nomme : les 15 avis de G16 vont tous dans le même sens (unanime). Le « sens opposé » vient d'un autre motif (G30, I0008 de P2), et P2 ne parle pas de salaire. L'opposition est construite par le moteur, elle n'est pas dans les données.

Aucune citation déformée. Les autres phrases tiennent. « Plusieurs parents racontent le harcèlement… resté sans réaction de la direction » est exact pour 4 des 5 récits (P99, P105, P232, P362), mais le chiffre manque. « La gratuité de l'école satisfait 5 sur 7 » tient pour les 5 (P15 parle plutôt d'impôts bien employés). Hors erreur, pour la hiérarchie : les inégalités scolaires sont absentes du résumé.

**Structure** : aucun défaut au sens de la grille (7 motifs à une personne sur 67, soit 10 % ; plus gros motif à 7,5 % des idées). L'émiettement est réel mais reste sous le seuil.

**Langue : 7,5** (moyenne 7,3)

| Critère | Note | Constat |
|---|---|---|
| Naturel | 7,0 | Correct mais plus administratif : chiffres en tête de proposition (« 1 personne juge… », « 1 autre », 31 fois), formule toute faite « À contre-courant » (5 fois), une citation qui casse la syntaxe (« une carte qui « c'était très bien » », G3). |
| Précision | 8,5 | Sous-comptes partout (« des budgets trop faibles (9 personnes), des locaux vétustes… (7 personnes) »), objets nommés exactement. |
| Hiérarchie | 7,5 | Le plus fréquent d'abord dans les motifs ; le résumé place la gratuité (7 avis) avant les grands blocages et omet les inégalités. |
| Concision | 6,5 | 95 mots par synthèse de motif, 33 points-virgules, 38 phrases de plus de 40 mots ; G12 et G22 sont des listes à rallonge. |
| Cohérence du vocabulaire | 7,0 | Tic de l'opposition (« sens opposés », « sens contraire », « sens inverse », « remèdes opposés » : 5 emplois, dont 3 abusifs) ; « unanime… mais en sens contraire » se contredit. |

---

## Comparaison critère par critère

| # | Critère | X | Y | Ce qui fait la différence |
|---|---|---|---|---|
| 1 | Découpage | 7,0 | 7,5 | Y découpe les longues réponses objet par objet (P92, P99, P167, P183, P318, P361) et reconnaît la question de P342 ; X agglomère les listes. Y paie en fragments et en chevauchements (35 contre 9). |
| 2 | Traçabilité | 8,0 | 7,5 | X n'a aucun renvoi hors motif ; Y en a un dans le résumé (I0008) et un double compte dans un grand thème. X minimise par des exemples comptés comme « une personne ». |
| 3 | Regroupement | 6,5 | 7,0 | X réunit des objets opposés (carte et contournement, vécu et procès du système, école proche et fermetures) ; Y les sépare mais s'émiette (18 motifs de 3 personnes ou moins) et recopie beaucoup. |
| 4 | Chiffres et minorités | 6,5 | 7,5 | Étiquette fausse de la carte scolaire et harcèlement minimisé chez X ; Y rend le harcèlement visible et distingue bien consensus et majorité. |
| 5 | Synthèses et thèmes | 7,0 | 6,5 | X reste sobre et fidèle ; Y fabrique des oppositions (« remèdes opposés », « sens opposés », G44). |
| 6 | Restitution | 7,5 | 7,0 | Le résumé de X est plus court et couvre les inégalités ; celui de Y apporte le harcèlement mais omet les inégalités et contient une phrase à retirer. |
| | Méthode | **7,0** | **7,0** | Égalité (7,17 de part et d'autre). |
| | Erreurs du résumé | 1 | 1 | X : un camp faussé qui change une étiquette ; Y : une opposition inventée. |
| | Langue | **8,0** | **7,5** | X est plus concis et plus naturel ; Y est plus précis. |

## Verdict

Les deux synthèses se valent sur la méthode : même note (7,0), même nombre d'erreurs dans le résumé (1). Si je dois en publier une, je publie **Y**, avec une **confiance faible**. Trois raisons décident :

1. **Les étiquettes des grands motifs de Y reposent sur des objets homogènes.** X mêle des positions contraires dans un même motif, et cela fausse une étiquette du résumé : sur la carte scolaire, « majorité » au lieu de « large majorité », avec un 🟢 à côté d'« Insatisfaction : passe droit » (P95). Corriger X demande de recoder et de regrouper ; corriger Y demande de supprimer une phrase.
2. **Y rend visible une voix minoritaire grave.** Le harcèlement (5 récits, 4 directions qui ne réagissent pas : P99, P105, P232, P362) figure dans le résumé et dans le grand thème. X le réduit à « une personne ».
3. **Y découpe plus fidèlement les réponses denses** (P92, P99, P167, P183, P318, P361), et chaque critique y est rangée sous le bon objet. Le lecteur peut donc agir motif par motif.

Ce qui retient ma confiance : la langue de X est meilleure (8,0 contre 7,5) et son résumé est plus présentable tel quel. Y doit, avant diffusion, retirer la phrase sur la « gestion des enseignants », ajouter les inégalités scolaires (17 sur 17) et donner le chiffre à « plusieurs parents ».

---

En cinq lignes :
- Note de méthode : X 7,0 ; Y 7,0.
- Erreurs du résumé : X 1 (carte scolaire, 3 avis à contresens qui font passer l'étiquette de « large majorité » à « majorité ») ; Y 1 (opposition inventée sur la gestion des enseignants).
- Langue : X 8,0 ; Y 7,5.
- Verdict : elles se valent ; je publierais Y.
- Confiance : faible.
