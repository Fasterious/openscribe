# Notation `plume` : synthèse « école », passe 10 (Opus)

Grille : `docs/NOTATION.md`, section `plume`. Champ : textes écrits par le moteur d'IA (résumé,
intros de thèmes, titres de thèmes et de motifs, synthèses de motifs, lignes « Compte comme
positif : … »). Les verbatims sont hors champ. Les textes injectés par le code (section Méthode,
mention « aussi dans », en-têtes de listes) sont relus à part, sans peser sur la note.

## Note : 4/5

| Critère | Note | En bref |
|---|---|---|
| Naturel | 4,5 | Aucun calque de l'anglais repéré. Un français de rapport, sans tournure traduite. |
| Précision | 4 | Chaque phrase nomme son sujet et son nombre. Restent quelques renvois flous (« aux changements », « une décision »). |
| Hiérarchie | 4 | Le camp le plus nombreux d'abord, les nuances ensuite, presque partout. |
| Concision | 3 | Inventaires exhaustifs : plusieurs synthèses alignent 6 à 8 éléments dans une même phrase. |
| Cohérence | 3,5 | L'échelle d'avis est bien tenue, mais « de ceux qui en parlent » sature le résumé, et la règle des nombres en chiffres n'est pas toujours respectée. |

Moyenne : 3,8, arrondie à 4. Ce qui est bon : les synthèses ouvrent souvent avec une vraie
attaque (« Lents, difficiles à joindre ou compliqués : c'est ainsi qu'une majorité… », « Vécue de
près, l'école satisfait », « Ne pas pouvoir choisir son école est le grief central »). Les signaux
isolés sont bien tournés. Les lignes de définition sont régulières et lisibles.

## Défauts qui reviennent (par gravité)

### 1. « de ceux qui en parlent » répété jusqu'à saturer le résumé

9 occurrences dans le résumé, dont 8 dans le deuxième paragraphe, plus 26 dans les synthèses.
Le deuxième paragraphe se lit comme une suite de formulaires :

- « L'orientation des élèves déçoit elle aussi une large majorité de ceux qui en parlent (27 sur 29 ; P92), et les absences des enseignants suscitent des critiques unanimes, mais fragiles, chez ceux qui en parlent (25 sur 25 ; P34). »
- « La carte scolaire est contestée par une large majorité de ceux qui en parlent (25 sur 30 ; P18) ; comparée au privé, l'école publique est critiquée par une large majorité de ceux qui en parlent (18 sur 20 ; P22). »
- « Pour une large majorité de ceux qui en parlent, les effectifs par classe posent problème (18 sur 20 ; P2), et une majorité de ceux qui en parlent regrette les difficultés d'accès aux services administratifs (16 sur 21 ; P11). »

Proposition : dire la base une fois en tête du paragraphe (« Parmi ceux qui en parlent, … »),
puis le mot de l'échelle seul avec son chiffre : « la carte scolaire est contestée par une large
majorité (25 sur 30 ; P18) ».

**Source : la consigne** (`global`). Elle impose la formule à chaque ligne : « Une large majorité
de ceux qui en parlent critique la carte de transport (29 sur 35) » et « « de ceux qui en
parlent » dit déjà la base ». La consigne demande aussi de varier les attaques, et le moteur
d'IA varie bien l'ordre des mots, mais il garde la formule entière dans chaque phrase. À
corriger dans la consigne : autoriser la base dite une fois par paragraphe.

### 2. Phrases-inventaires trop longues (concision)

Le moteur d'IA veut placer chaque personne. Plusieurs phrases dépassent 60 mots et enchaînent
6 à 8 éléments :

- Démarches d'inscription : « 11 autres personnes reprochent l'inscription sur papier et la paperasse, des inscriptions au lycée ou à l'université lentes ou compliquées, des horaires incompatibles avec le travail, des dossiers difficiles à faire passer d'une académie à l'autre, une pièce exigée qu'une famille arrivée après une mutation ne pouvait pas encore fournir, ou l'avis du maire demandé pour la maternelle (P50, …, P338). » Proposition : « 11 autres personnes décrivent des démarches lentes ou mal adaptées : inscriptions sur papier, délais au lycée ou à l'université, horaires incompatibles avec le travail (P50, …) ».
- Services périscolaires : « Neuf autres reprochent une garderie qui ferme trop tôt ou manque de places, des tarifs élevés, une cantine facturée même quand l'enfant est malade, un site d'inscription défaillant, l'absence de menus végétariens, un manque de souplesse ou le désengagement de l'Éducation nationale (…). »
- Financement des études : « Six personnes visent l'enseignement supérieur : classes préparatoires payantes, école de commerce, faculté éloignée du domicile, frais universitaires laissés aux familles, écarts de prix pour un même diplôme, étudiants sans aide (…) ».
- Information sur l'école : « L'une d'elles n'a pu rencontrer le directeur, ignore ce que recouvre la pédagogie annoncée, apprend en août qui sera l'enseignant et découvre une réunion de présentation fixée après la rentrée, si bien qu'elle ne voit pas comment choisir une école avant mars (P8). »
- Signal « Temps de travail des parents », des relatives empilées : « Une personne propose d'adapter le temps de travail des parents à la charge familiale, une idée qu'elle juge très pertinente, même si difficile à mettre en place, et qui lui semble oubliée, ce qu'elle regrette (P311). » Proposition : « Une personne propose d'adapter le temps de travail des parents à la charge familiale : une idée difficile à mettre en place, dit-elle, mais qu'elle regrette de voir oubliée (P311). »

**Source probable : la consigne** (`summarize` et `polish`). Elle exige que chaque phrase soit
appuyée par ses renvois, et aucune limite ne fixe le nombre d'éléments par phrase. Le moteur
d'IA en déduit qu'il doit tout énumérer. Piste : « au plus trois exemples par énumération, les
autres restent dans les renvois ».

### 3. Nombres en lettres au milieu d'une phrase, contre la règle de la consigne

La consigne `summarize` dit : « Nombres en chiffres, en lettres seulement en tête de phrase ».
Le plus souvent, elle est respectée (« Deux pistes s'opposent : 2 personnes proposent… » est
correct). Elle est enfreinte au moins 7 fois, ce qui donne des chiffres et des lettres mêlés
d'une phrase à la suivante :

- Proximité : « deux personnes subissent de longs trajets » → 2 personnes
- Direction des établissements : « deux autres déplorent l'absence de hiérarchie » → 2 autres
- Garde des enfants : « deux personnes peinent à trouver une assistante maternelle » → 2 personnes
- Élèves à profil atypique : « deux reprochent à l'institution sa rigidité » → 2
- Recrutement : « deux personnes proposent de recruter des gens… » → 2 personnes
- Intro Garde et temps des familles : « deux d'entre elles s'opposent sur la semaine de 4,5 jours » → 2 d'entre elles
- Intro Orientation : « trois personnes veulent redonner leur valeur aux métiers manuels » → 3 personnes

**Source : application incomplète de la consigne** par le moteur d'IA. Comme le défaut est
mécanique, le code pourrait le corriger à la source (un mot de nombre inférieur à 10 qui ne
commence pas une phrase passe en chiffres), plutôt que de compter sur la relecture.

### 4. « La plupart » partout dans les intros de thèmes

16 occurrences, presque toutes dans les intros (« la plupart de ceux qui parlent de… »), parfois
deux fois dans la même intro (Orientation, Moyens). Le mot est hors échelle, et c'est voulu : on
n'additionne pas les avis d'un thème. Mais la répétition aplatit les intros :

- « Du collège à l'université, la plupart de ceux qui en parlent décrivent un chemin semé d'obstacles vers les études et le métier (P35, P92, P151). La plupart de ceux qui parlent d'orientation disent manquer d'information et de conseillers, … Après le bac, la plateforme d'admission, le manque de places, le coût des études et celui du logement pèsent sur la plupart de ceux qui en parlent (notamment P59, P64, P234). »

(« un chemin semé d'obstacles » est en plus un cliché.)

**Source : la consigne** (`global`), qui donne « la plupart de ceux qui en donnent un avis »
comme modèle pour les intros. Piste : proposer deux ou trois tournures, ou laisser l'objet en
sujet sans quantifier (« L'orientation manque d'information et de conseillers, disent… »).

### 5. Tics de transition

- « À contre-courant » ouvre 4 phrases (Carte scolaire, École publique face au privé, Réforme du système éducatif, Orientation des élèves). On trouve aussi « À l'inverse » (6 fois), « au contraire » (environ 12 fois), « En contrepoint ». La palette est bonne, mais « À contre-courant » revient trop.
- « l'une d'elles » ouvre trois propositions de suite dans le troisième paragraphe du résumé.

**Source : le moteur d'IA** pour les transitions. Les exemples de la consigne ne contiennent pas
« À contre-courant ». Défaut mineur, à surveiller sur la passe suivante.

### 6. Lignes de définition (nouveauté) : bonnes dans l'ensemble, trois tournures à reprendre

La forme est régulière et claire : « Compte comme positif : … · comme négatif : … · ne compte
pas comme un avis : … ». Trois défauts :

- Le verbe « subir » revient 10 fois dans le volet négatif (« subir des démarches d'inscription lourdes… », « subir ses contraintes ou refus », « subir un dialogue fermé ou absent avec l'école », « subir des classes multiniveaux ou trop hétérogènes », « subir les conséquences des grèves des enseignants »…). Une définition dit ce que la personne exprime, pas ce qu'elle vit : « se plaindre de », « dénoncer », « décrire comme » serait plus juste. **Source : la consigne** `review`, qui donne « en subir les contraintes » en exemple de négatif.
- Une contradiction : Enseignement privé, « Compte comme positif : apprécier l'enseignement privé, défendre son existence ou regretter ses limites ». Regretter des limites se lit comme une critique. Proposition : « … ou regretter qu'il ne puisse accueillir plus d'élèves ».
- Une tournure forcée : Absences des enseignants, « Compte comme positif : saluer des absences rares ou rapidement remplacées ». Proposition : « constater que les absences sont rares ou vite remplacées ».

### 7. Titres de motifs qui ne disent pas ce que le motif contient

- « Direction des établissements » : la définition et la synthèse parlent du dialogue entre l'école et les familles (« apprécier l'écoute et le dialogue entre école et familles »). Proposition : « Dialogue entre l'école et les familles ».
- « Écoles rurales » : le motif dit « école de village » partout (« Toutes les personnes qui en parlent apprécient l'école de village »). Il faut choisir un seul des deux mots.
- « Qualité des enseignants » : 9 des 23 avis négatifs visent l'Éducation nationale et sa hiérarchie, pas les enseignants. Le titre est trop étroit. C'est d'abord une question de regroupement, à voir avec le `methodologue`.

### 8. Défauts ponctuels de précision

- Rémunération : « une autre attribue la démotivation des enseignants à cette rémunération insuffisante et aux changements (P140) » : quels changements ?
- Offre d'options : « l'autre n'a eu aucun choix de langue au collège, une décision prise à quelques mois de la rentrée » : l'apposition flotte. Proposition : « … au collège, faute d'une décision prise avant quelques mois de la rentrée ».
- Garde des enfants : « l'une n'ayant plus le choix, à la fin de l'aide de la caisse d'allocations familiales, qu'entre quitter son emploi et une école privée » : les deux termes du choix ne sont pas de même nature. Proposition : « … qu'entre quitter son emploi et payer une école privée ».
- Recrutement : « Le recrutement des enseignants inspire surtout des propositions : deux personnes proposent… » : « propositions » et « proposent » se suivent.
- Rythmes scolaires : la synthèse tient en une phrase (« Aucune des personnes qui donnent un avis ne se satisfait des rythmes scolaires (…). ») alors que l'intro du thème annonce une opposition sur la semaine de 4,5 jours. La synthèse ne dit pas ce que reprochent les 7 personnes.
- Résumé : « Un autre sujet divise aussi (voir « Ce qui divise »). » : le sujet n'est pas nommé (proximité de l'école, 3 positifs, 5 négatifs). Il faudrait le nommer avec son chiffre. **Source probable : la consigne** `global`, qui limite l'énumération à trois sujets.

## Textes injectés par le code (hors note, à corriger à la source)

- **Méthode, « Livre de codes »** : « ce qui y compte comme favorable, défavorable ou hors camp ». Les lignes du rapport disent « positif », « négatif », « ne compte pas comme un avis ». Il faut reprendre les mots du rapport. « Hors camp » et « camps d'avis » sont du jargon interne.
- **Méthode, « Codage en double »** : « 20 idées qui satisfont la définition de deux motifs » → « qui répondent à la définition de deux motifs ». À vérifier : le rapport porte 29 mentions « aussi dans » pour 20 idées annoncées (question pour le `methodologue`).
- **Méthode** : la fusion de 3 motifs est annoncée deux fois (« La passe de consolidation a fusionné 3 ensembles de motifs… » puis « 3 fusions de motifs qui traitaient le même objet »). Si c'est la même opération, il faut la dire une seule fois. Sinon, il faut dire en quoi les deux diffèrent.
- **Mention « aussi dans « X » »** : la formule est claire et assez courte. Mais elle ne figure que sous le second motif : P202 la porte sous « Absences des enseignants », pas sous « Qualité des enseignants », et P251 la porte sous « Qualité des enseignants », pas sous « Moyens des écoles ». De plus, la ligne est rejetée en fin de liste, hors de l'ordre des participants. Il faudrait l'afficher sous les deux motifs, à sa place dans l'ordre.

## Règle de style à retenir

Dire la base une fois, puis le mot de l'échelle avec son chiffre : « de ceux qui en parlent »
répété à chaque phrase ne précise rien et alourdit tout.
