# Notation `plume` : synthèse « école », passe 11 (Opus)

Grille : `docs/NOTATION.md`, section `plume`. Champ : textes écrits par le moteur d'IA (résumé,
10 intros de thèmes, 73 titres et synthèses de motifs, 73 lignes « Compte comme positif : … »).
Les verbatims sont hors champ. Les textes injectés par le code (section Méthode, listes, mention
« aussi dans ») sont relus à part, sans peser sur la note. Décomptes faits par script sur les
mêmes extraits du rapport de la passe 10 et de la passe 11, pour qu'ils se comparent.

## Note : 3,5/5

| Critère | Note | En bref |
|---|---|---|
| Naturel | 4 | Pas de calque de l'anglais. Quelques tournures fausses : « des reproches unanimes, mais fragiles », un « quand » sans opposition, « le dialogue coince ». |
| Précision | 4 | Chaque phrase nomme presque toujours son sujet. Deux flous de la passe 10 restent (« aux changements », « décidée à quelques mois de la rentrée »). Quelques renvois sans antécédent. |
| Hiérarchie | 4 | Le camp le plus nombreux vient d'abord, presque partout. Deux synthèses n'ont pas de phrase d'ouverture (Rythmes scolaires, Programmes scolaires). |
| Concision | 3,5 | Les phrases-inventaires reculent (de 8 à 4 phrases de plus de 60 mots), mais le résumé s'alourdit avec « fragile » répété 7 fois. |
| Cohérence | 3 | La règle des nombres en chiffres recule : 16 infractions contre 7. La base « de ceux qui… » n'a pas diminué, elle a seulement changé de verbe. |

Moyenne : 3,7, arrondie à 3,5. Le recul d'un demi-point sur la passe 10 (4/5) est à la limite du
bruit (voir « Variabilité ») : il ne faut pas le lire comme une régression nette. En revanche,
aucun des trois défauts visés n'est réglé. Ce qui est bon : les attaques restent vives (« Échec,
désastre, organisation inadaptée : », « Démarches répétitives, services lents, administration
rigide : », « Faire garder ses enfants reste difficile pour 7 personnes »). Les signaux isolés
tiennent en une phrase claire. Trois défauts ponctuels de la passe 10 sont corrigés : le titre
« Direction des établissements » devient « Relations avec les familles », la définition
« Enseignement privé » ne se contredit plus, et la ligne « Absences des enseignants » sonne juste.

## Les trois défauts de la passe 10 : persistent-ils ?

| Défaut | Passe 10 | Passe 11 | Verdict |
|---|---|---|---|
| « de ceux qui en parlent » (forme exacte) | 9 au résumé, 26 dans intros et synthèses | 3 au résumé, 20 dans intros et synthèses | Recul apparent |
| Toute la formule de base (« ceux / personnes qui en parlent, qui donnent un avis, qui l'évoquent, qui parlent de… ») | 10 au résumé, 29 dans les intros, 50 dans les synthèses | 11 au résumé, 19 dans les intros, 50 dans les synthèses | **Persiste** : seul le verbe varie |
| Phrases de plus de 60 mots (renvois compris) | 8 | 4 | Recul, mais le défaut persiste |
| Phrases de plus de 60 mots (renvois retirés) | 2 (dont une de 92 mots) | 2 (dont une de 73 mots) | Stable |
| Nombres en lettres au milieu d'une phrase (comptes de personnes) | au moins 7 | 16, plus 2 cas limites | **S'aggrave** |

## Défauts qui reviennent (par gravité)

### 1. Le deuxième paragraphe du résumé reste un formulaire, auquel s'ajoute « fragile »

La consigne a été suivie à la lettre. Le verbe varie (« en parlent », « l'évoquent », « les
décrivent », « parlent de… »), mais 8 phrases sur 9 gardent le même moule : mot de l'échelle,
« de ceux qui… », puis le chiffre. Le paragraphe a un nouveau poids : le mot « fragile » y revient
7 fois, imposé à chaque ligne fragile.

- « Les absences des enseignants suscitent des reproches unanimes, mais fragiles, chez ceux qui en parlent (24 sur 24 ; P34), et les démarches d'inscription déplaisent à une majorité fragile de ceux qui les décrivent (21 sur 30 ; P52). » Ce ne sont pas les reproches qui sont fragiles, c'est l'unanimité. Proposition : « Les absences des enseignants font l'unanimité contre elles, une unanimité fragile (24 sur 24 ; P34) ».
- « Tous ceux qui évoquent la scolarisation des enfants handicapés la critiquent, de façon unanime mais fragile (18 sur 18 ; notamment P1), quand une large majorité de ceux qui parlent des effectifs par classe s'en plaint (18 sur 21 ; notamment P2). » « Tous » et « unanime » disent deux fois la même chose. « Quand » annonce une opposition alors qu'il n'y en a pas : il faut « et ».
- « L'enseignement privé fait l'unanimité de ceux qui en parlent, une unanimité fragile (13 sur 13 ; P22). Tous ceux qui évoquent la gratuité de l'école la saluent, unanimité fragile elle aussi (5 sur 5 ; notamment P7), et une large majorité, fragile, de ceux qui parlent des écoles rurales les apprécie (4 sur 5 ; notamment P353). » Trois « fragile » en deux phrases.

Proposition : dire la base une fois en tête de paragraphe (« Parmi ceux qui en parlent : »),
puis l'objet, le mot de l'échelle et le chiffre. Pour la fragilité, une phrase suffit : « Ces
unanimités tiennent à une voix. » Ou bien le mot reste dans les listes, à côté du chiffre.

**Source : la consigne** (`methods.ts`, `global`, règles 7 et 10) **et un contrôle du code.**
La règle 7 impose « une large majorité de ceux qui en parlent, jamais « une large majorité »
seul ». La règle 10 impose « fragile » à côté du mot de l'échelle. Le contrôle des renvois
(`pipeline.ts`, vers la ligne 1999) signale toute ligne fragile qui ne porte pas le mot dans sa
phrase. Le moteur d'IA n'a donc aucun moyen d'alléger. C'est à corriger à la source : autoriser
la base dite une fois par paragraphe, et accepter « fragile » dit une fois pour plusieurs lignes.

### 2. Nombres en lettres au milieu d'une phrase : le défaut s'aggrave (16 cas contre 7)

La règle « Nombres en chiffres, en lettres seulement en tête de phrase » est enfreinte 16 fois.
Le mélange se voit souvent dans une même phrase :

- Proximité de l'école : « trois personnes saluent des écoles proches (P1, P143, P226), cinq déplorent l'éloignement » → 3 personnes, 5
- Enseignement privé : « Trois personnes louent un suivi plus attentif […], quatre la réussite, le niveau ou le goût du travail » → 4
- Accès aux services administratifs : « Cinq personnes dénoncent des délais trop longs […], trois des difficultés avec un rectorat […], deux des erreurs ou des pertes de documents » → 3, 2
- Moyens des écoles : « quatre notent que l'école ou ses enseignants tiennent malgré ce manque » → 4
- Réforme du système éducatif : « deux autres de ne pas bouger malgré les promesses » ; « deux autres demandent que les enseignants acceptent les réformes » → 2 autres
- Accès à l'enseignement supérieur : « À l'inverse, trois personnes saluent une admission réussie » → 3 personnes
- Fonctionnement de l'université : « trois personnes jugent ses moyens insuffisants » → 3
- Relations avec les familles : « trois personnes décrivent une école fermée au dialogue » → 3
- Évaluation des élèves : « deux personnes y dénoncent des remarques » → 2
- Fermetures de classes : « deux autres en décrivent les effets sur les familles » → 2 autres
- Effectifs par classe : « et deux citent des classes de 29 élèves » → 2
- Harcèlement scolaire : « et trois d'entre elles reprochent aux établissements » → 3 d'entre elles
- Rythmes scolaires : « trois autres visent une réforme Peillon » → 3 autres
- Cas limites : « les deux personnes qui en parlent » (Écoles de commerce, Encadrement des stages).

Restent en lettres à bon droit : « deux vitesses », « deux systèmes », « l'un des deux sexes »,
« deux enfants nés à 2 minutes d'écart » (ce ne sont pas des comptes de personnes).

**Source : le code n'applique la règle que dans un sens.** `spellLeadingNumbers` (`pipeline.ts`)
écrit en lettres le chiffre qui ouvre une phrase. Rien ne remet en chiffres le mot de nombre qui
suit une virgule, un point-virgule ou un deux-points. Le défaut est mécanique : il se corrige à
la source, dans la même fonction. Un mot de nombre de deux à vingt, hors tête de phrase, suivi de
« personnes », « autres », « d'entre elles » ou d'un verbe conjugué, passe en chiffres.

### 3. Phrases-inventaires : moins nombreuses, toujours présentes

4 phrases dépassent 60 mots (8 à la passe 10). La plus longue passe de 92 à 73 mots, renvois retirés :

- Carte scolaire : « La carte scolaire est rejetée par une large majorité de ceux qui en parlent : 13 personnes regrettent de ne pas pouvoir choisir l'établissement ou de subir un découpage qui éloigne l'enfant d'une école proche (…), et 6 dénoncent des dérogations obligatoires, refusées, payantes ou longues à obtenir, ou des communes qui refusent les enfants des alentours (…), l'une d'elles précisant ne rencontrer aucun problème dans sa commune, qui n'a qu'une école (P77). » La dernière proposition contredit le reste de la phrase. Elle mérite une phrase à elle.
- Âge d'entrée à l'école (signal isolé, 66 mots) : « La règle d'âge pour entrer à l'école paraît trop rigide à une personne, qui ne comprend pas que deux enfants nés à 2 minutes d'écart, de part et d'autre du 1er janvier, ne soient pas traités de la même façon ; tout en jugeant cette règle bonne comme référence, elle propose de laisser leur chance aux enfants plus aptes après une évaluation par un psychologue (P307). » La consigne exige une seule phrase pour un motif d'une seule personne. Le moteur d'IA y loge alors tout.
- Qualité des enseignants : 4 camps de critiques et 23 renvois dans une seule phrase d'éloges.
- Expérience globale de scolarisation : 47 renvois entre parenthèses dans la phrase d'ouverture. Ici, « (notamment P4, P15, P33) » suffirait.

**Source : la consigne** (`summarize` règle 12 : « Un motif d'une seule personne se dit en une
phrase » ; aucune limite au nombre d'éléments d'une énumération). Deux pistes : « au plus trois
exemples par énumération », et pour un motif d'une personne, « une ou deux phrases courtes ».

### 4. « Subir » dans les définitions : 14 fois (12 à la passe 10)

« subir des délais, des erreurs ou des interlocuteurs injoignables », « subir une administration
rigide, opaque, distante ou impuissante », « subir des classes multiniveaux ou trop hétérogènes »,
« subir la gêne causée par les grèves des enseignants » (pléonasme), « subir l'exclusion scolaire
d'un enfant malade sans solution »… Une définition dit ce que la personne exprime : « se plaindre
de », « dénoncer », « décrire comme ».

**Source : la consigne** (`review` règle 14, qui donne « en subir les contraintes » en exemple de
négatif). Non corrigée depuis la passe 10.

### 5. « La plupart » dans les intros de thèmes : 10 fois (16 à la passe 10)

Le recul est net, mais le mot revient encore deux fois dans l'intro « Contenus et méthodes »
(« déçoivent la plupart de ceux qui en parlent », « Selon la plupart de ceux qui en parlent »).
Le cliché de la passe 10 revient aussi : « le parcours après le collège paraît semé d'obstacles à
la plupart de ceux qui en parlent ».

**Source : la consigne** (`themes` règle 4, qui propose « la plupart de ceux qui parlent de… »
comme seule formule).

### 6. Défauts ponctuels de précision

- Rémunération (persiste depuis la passe 10) : « une autre lie la démotivation des enseignants à cette rémunération et aux changements » : quels changements ?
- Offre d'options (persiste) : « l'absence de choix de langue au collège, décidée à quelques mois de la rentrée » : on ne sait pas ce qui est décidé.
- Enseignement des langues étrangères : « des professeurs de langues français » : le lecteur ne sait pas s'il s'agit de professeurs de français ou de professeurs français qui enseignent une langue étrangère.
- Intro Public, privé et égalité, et synthèse École publique face au privé : « une personne juge lamentable cette victoire de l'enseignement privé ». « Cette » ne renvoie à rien qui précède.
- Intro Public, privé et égalité : « Plusieurs personnes saluent l'enseignement privé, et plusieurs disent l'avoir choisi » : « plusieurs » est répété.
- Reconnaissance des enseignants : « Deux personnes l'opposent… (P303, P318). Une quatrième propose… » : la troisième n'est jamais nommée, et le lecteur perd le compte.
- Évaluation des élèves : « la première personne citée veut des bulletins limités aux pistes de progrès » : la consigne interdit de « montrer ses comptes », et c'en est un.
- Relations avec les familles : « Les critiques l'emportent largement chez ceux qui donnent un avis » : l'objet n'est pas nommé, et « largement » n'est pas un mot de l'échelle.
- Gestion des établissements : « La gestion des établissements est surtout mise en cause par ceux qui en parlent (P343, P361). Deux personnes dénoncent… (P343, P361). » La deuxième phrase répète la première avec les mêmes renvois, et « surtout » reste flou.
- Territoires en difficulté : « Plusieurs personnes décrivent le retard des campagnes […] ; une autre constate […]. L'une d'elles ne trouve aucun professeur particulier » : l'antécédent de « l'une d'elles » est ambigu.
- Résumé, troisième paragraphe : « d'autres en font sur la réforme du système éducatif ou les relations avec les familles » : la phrase ne donne pas de nombre (5 participants pour chaque motif).
- Intro Démarches : « Le dialogue coince aussi » est trop familier pour un rapport. Proposition : « Le dialogue achoppe aussi ».

### 7. Titres de motifs

- « Écoles rurales » : la synthèse dit « L'école de village séduit » (persiste depuis la passe 10). Il faut choisir un seul des deux mots.
- « Gestion des établissements », « Encadrement administratif » et « Accès aux services administratifs » : ces trois titres sont presque synonymes, et le lecteur ne voit pas ce qui les sépare. À voir avec le `methodologue` (est-ce un défaut de regroupement ?).

## Textes injectés par le code (hors note, à corriger à la source)

Aucun des quatre points relevés à la passe 10 n'a été corrigé :

- **Méthode, « Codage en double »** : « 30 idées qui satisfont la définition de deux motifs » → « qui répondent à la définition ».
- **Méthode, « Livre de codes »** : « les camps d'avis s'y conforment ». « Camp » est un mot interne : le rapport dit « positif », « négatif », « ne compte pas comme un avis ».
- **Méthode** : la fusion est encore annoncée deux fois (« La passe de consolidation a fusionné 2 ensembles de motifs… », puis « 2 fusions de motifs qui traitaient le même objet »).
- **Résumé et listes** : « 6 participants » (listes) et « personnes » (synthèses) se côtoient dans une même phrase du résumé (« 6 participants en font, et l'une de ces personnes… »). Le mot vient de la ligne injectée.

## Règle de style à retenir

Une précision dite une fois vaut pour tout le paragraphe : la base (« parmi ceux qui en parlent »)
comme la fragilité. Répétée à chaque phrase, elle ne précise plus rien, elle alourdit.
