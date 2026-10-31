# Notation `plume` : synthèse « école », passe 12 (Opus)

Grille : `docs/NOTATION.md`, section `plume`. Champ : textes écrits par le moteur d'IA (résumé,
10 intros de thèmes, 79 titres, 73 synthèses de motifs, 73 lignes de définition). Les verbatims
sont hors champ. Les textes injectés par le code (section Méthode, phrases chiffrées du résumé,
mentions « aussi dans ») sont relus à part et ne pèsent pas sur la note. Les décomptes sont faits
par un même script sur les passes 11 et 12, pour qu'ils se comparent ; ses chiffres de la passe 11
s'écartent d'une ou deux unités de ceux de la notation précédente (11 → 12 au résumé, 50 → 49 dans
les synthèses).

## Note : 3,5/5

| Critère | Note | En bref |
|---|---|---|
| Naturel | 4 | Aucun calque de l'anglais. Restent quelques tournures fausses, dont deux reprises mot pour mot de la passe 11 (« des reproches unanimes, mais fragiles » ; « de façon unanime mais fragile »). |
| Précision | 3,5 | Les synthèses donnent leurs nombres. Mais les intros de thèmes se brouillent (18 « plusieurs personnes », « d'autres », « certains », contre 12), une phrase est tronquée, et trois flous de la passe 10 persistent. |
| Hiérarchie | 4 | Le camp le plus nombreux vient d'abord, presque partout. La minorité est introduite nettement (« À l'inverse », « À contre-courant »). |
| Concision | 3,5 | « Fragile » recule au résumé (5 contre 7). Mais la limite de 4 phrases fait souder les propositions par un point-virgule (14 cas contre 3), et 7 phrases dépassent 60 mots renvois compris (4 à la passe 11). |
| Cohérence | 3,5 | Plus aucun compte de personnes en lettres au milieu d'une phrase (0 contre 16). La base « de ceux qui… » recule nettement dans les synthèses (28 contre 49). Mais le résumé se fige sur une seule formule, et 15 phrases mêlent un nombre en lettres en tête et des chiffres ensuite (9 à la passe 11). |

Moyenne : 3,7, arrondie à 3,5. La note ne bouge pas, mais le profil change. Deux défauts visés
sont réglés ou en net recul (nombres en lettres, base dans les synthèses). Deux persistent
(la base au résumé, les phrases longues). La correction des nombres a deux effets de bord, dont
un défaut de code très visible dès la deuxième phrase du rapport (voir plus bas).

Ce qui est bon : des attaques nettes qui mettent l'objet en sujet (« La carte scolaire est surtout
critiquée pour sa rigidité », « Le calendrier des bourses a pénalisé 2 personnes », « Rescolariser
un élève qui a décroché tient du parcours d'obstacles pour 2 personnes »). Les signaux isolés
tiennent en une phrase courte : la phrase de 66 mots sur l'âge d'entrée à l'école en fait
maintenant 31. Corrigés depuis la passe 11 : la phrase contradictoire de « Carte scolaire »,
« le dialogue coince », « cette victoire » sans antécédent, la répétition de « Gestion des
établissements », l'objet absent de « Relations avec les familles », et les propositions sans
nombre au troisième paragraphe du résumé.

## Les défauts de la passe 11 : persistent-ils ?

| Défaut | Passe 11 | Passe 12 | Verdict |
|---|---|---|---|
| Base « ceux / personnes qui en parlent, qui donnent un avis, qui évoquent… », au résumé | 12 (dont 2 « de ceux qui en parlent ») | 10 (dont **8** « de ceux qui en parlent ») | **Persiste, et se fige** : 8 phrases sur 9 du 2e paragraphe dans le même moule |
| Même base, dans les synthèses de motifs | 49 | 28 | Net recul |
| Même base, dans les intros de thèmes | 15 | 14 | Stable (plus 12 « la plupart », contre 10) |
| « Fragile » au résumé | 7 | 5 | Recul, mais le défaut persiste (même faute de sens qu'en passe 11) |
| Comptes de personnes en lettres au milieu d'une phrase | 16 | **0** | **Réglé** (par le code) |
| Effet de bord : phrase qui ouvre sur un nombre en lettres et donne d'autres comptes en chiffres | 9 | 15 | S'aggrave |
| Effet de bord : nombre composé coupé en deux par le code | 0 | 1 (« Quarante-6 ») | **Nouveau, grave** |
| Phrases de plus de 60 mots, renvois compris | 4 | 7 | S'aggrave |
| Phrases de plus de 60 mots, renvois retirés | 2 | 1 (62 mots) | Recul |
| Propositions soudées en fin de phrase par un point-virgule | 3 | 14 | Nouveau tic |
| « Subir » dans les définitions | 14 | 14 | Persiste |

## Défauts qui reviennent (par gravité)

### 1. « Quarante-6 personnes » : le code coupe un nombre composé (texte injecté, hors note, mais à corriger d'abord)

Deuxième phrase du résumé : « Quarante-6 personnes portent un jugement positif d'ensemble sur la
scolarisation de leurs enfants ». Le moteur d'IA avait écrit « Quarante-six » (réponses `global` et
`polish`). C'est la passe des nombres qui a remplacé « six » par « 6 ».

**Source : le code** (`spellLeadingNumbers`, `pipeline.ts`). L'expression `COUNTED` commence par
`\b`, et le trait d'union compte comme une frontière de mot. Tout nombre composé est donc touché :
« Dix-sept personnes » deviendrait « Dix-7 personnes », « vingt-trois autres » deviendrait
« vingt-3 autres ». Correction : remplacer `\b` par `(?<![\p{L}-])` (drapeau `u`), et ajouter un
test sur « Quarante-six personnes » et « dix-sept autres ». Le même test doit vérifier qu'aucun
mot n'est touché entre « ».

### 2. Le deuxième paragraphe du résumé : une seule formule, répétée 8 fois

La base n'est plus variée, elle est uniforme. Huit phrases sur neuf suivent le moule « mot de
l'échelle + de ceux qui en parlent + verbe + objet (chiffre) » :

- « Une large majorité de ceux qui en parlent critique l'orientation des élèves (27 sur 28 ; P92), et les absences des enseignants s'attirent des reproches unanimes, mais fragiles, de ceux qui en parlent (25 sur 25 ; P34). » Deux fois la base dans la même phrase. Et ce ne sont pas les reproches qui sont fragiles, c'est l'unanimité (faute déjà relevée à la passe 11).
- « Une large majorité, fragile, de ceux qui en parlent conteste la carte scolaire (24 sur 29 ; P18). » Le même début revient pour la réforme du système éducatif et, au premier paragraphe, pour l'enseignement privé : trois phrases ouvrent sur la même incise.
- « Pour une majorité de ceux qui en parlent, les démarches d'inscription posent problème (24 sur 34 ; P52) ; une majorité de ceux qui en parlent critique de même l'école publique face au privé (24 sur 34 ; P22). » Le titre du motif est collé tel quel comme complément. On ne « critique » pas « l'école publique face au privé » ; on juge l'école publique moins bonne que le privé.
- « tous ceux qui évoquent la scolarisation des enfants handicapés la critiquent, de façon unanime mais fragile (18 sur 18 ; notamment P1) ». « Tous » et « unanime » disent la même chose : cette phrase est identique à celle de la passe 11.

Proposition : « Parmi ceux qui en parlent, une large majorité critique l'orientation des élèves
(27 sur 28 ; P92) ; les absences des enseignants font l'unanimité contre elles (25 sur 25 ; P34),
comme la scolarisation des enfants handicapés (18 sur 18 ; notamment P1). […] Ces trois unanimités
et ces deux larges majorités sont fragiles : une voix suffirait à changer l'étiquette. »

**Source : la consigne et un contrôle du code, inchangés depuis la passe 11.** `methods.ts`,
`global`, règle 7 : son exemple impose « une large majorité de ceux qui en parlent » à chaque
ligne, et la règle interdit le mot de l'échelle seul. La règle 10 impose « fragile » à côté du mot
de l'échelle, et le contrôle des renvois signale toute ligne fragile qui ne le porte pas. Les
synthèses de motifs ont progressé parce que leur règle 11 dit « mets souvent l'objet en sujet » ;
la consigne du résumé n'a pas reçu cette ouverture. À corriger à la source : la base dite une fois
en tête de paragraphe vaut pour toutes ses lignes, et « fragile » peut être dit une fois pour
plusieurs lignes (le contrôle l'accepte alors dans le paragraphe, pas seulement dans la phrase).

### 3. « Onze personnes… et 11 autres » : la règle des nombres crée un mélange dans la phrase

15 phrases ouvrent sur un nombre en lettres et donnent ensuite d'autres comptes en chiffres.
Le contraste saute aux yeux quand c'est le même nombre :

- Qualité des enseignants : « Onze personnes saluent l'implication et le dévouement des enseignants, parfois malgré des moyens limités, et 11 autres leur compétence, leur expérience ou la qualité de l'encadrement. »
- Orientation des élèves : « Six personnes décrivent des familles livrées à elles-mêmes pour l'orientation, sans information ni accompagnement, et 6 jugent peu fiables les conseillers, les enseignants ou la documentation. »
- Accès à l'enseignement supérieur : « Six personnes critiquent les plateformes d'admission, Admission post-bac puis Parcoursup, et 6 autres décrivent un après-bac compliqué, opaque ou rigide ».
- Résumé : « Six personnes font des propositions pour l'orientation des élèves (notamment P54). Le contrôle des enseignants défaillants inspire aussi des propositions à 6 personnes (notamment P5). »

Chaque morceau respecte la règle ; c'est la phrase entière qui sonne faux. **Source : le code
applique la règle, mais la consigne pousse encore à ouvrir une phrase par un compte.** Le levier
est dans la consigne (`summarize` règle 11 et `global`) : « N'ouvre pas une phrase par un nombre
quand elle en compte d'autres : mets l'objet ou le verbe en tête (« L'implication des enseignants
est saluée par 11 personnes, leur compétence par 11 autres ») ». Proposition pour le résumé :
« Six personnes font des propositions sur l'orientation des élèves (notamment P54), autant sur le
contrôle des enseignants défaillants (notamment P5). »

### 4. Propositions soudées par un point-virgule : 14 cas (3 à la passe 11)

Le moteur d'IA a quatre phrases pour dire tous les camps et les propositions. Il colle donc les
propositions à la fin d'une phrase sur un autre sujet. C'est ce qui fait passer 7 phrases au-delà
de 60 mots :

- Démarches d'inscription (61 mots) : « Les démarches d'inscription sont surtout critiquées pour leur répétition : 7 personnes reprochent de fournir chaque année les mêmes documents et 4 de remplir un dossier par service entre mairie, école, cantine et périscolaire ; 4 personnes proposent de garder les informations d'une année sur l'autre. »
- Carte scolaire (62 mots sans renvois) : « Deux avis s'opposent sur la mixité sociale : une personne reproche à la carte scolaire de favoriser l'entre-soi, une autre accuse le rectorat de niveler par le bas au nom de la mixité ; 3 personnes proposent de supprimer la carte scolaire ou de laisser libre le choix de l'école, une autre de tenir compte du domicile des grands-parents. » La mixité et la suppression de la carte n'ont rien à faire dans la même phrase.
- Démarches d'inscription (68 mots), un inventaire de cinq reproches au rythme « pour 2 personnes, […] pour 3, […] pour 3, […] pour 4, […] pour 2 », puis une proposition après le point-virgule.
- Accès aux services administratifs : « Une personne dresse un bilan contrasté : l'inscription de son enfant à l'école a été rapide, mais le rendez-vous à la caisse d'allocations familiales s'est fait attendre ; 3 personnes proposent un guichet unique, un service public adapté à ceux qui travaillent ou une écoute des expatriés qui reviennent. » Les 3 personnes n'ont aucun lien avec le bilan contrasté.

On trouve le même schéma dans Orientation des élèves, Programmes scolaires, Méthodes pédagogiques,
École publique face au privé, Absences des enseignants, Moyens des écoles, Contrôle des enseignants
défaillants et Suivi des élèves en difficulté.

**Source : la consigne** (`prompts.ts`, `summarize` : « 2 à 4 phrases », règle 5 « trois ou quatre
phrases », et règle 7 « chaque camp compté apparaît dans la synthèse »). Les deux règles se
contredisent dès qu'un motif a trois camps et des propositions. Piste : « 2 à 5 phrases ; les
propositions ont leur propre phrase, en dernier », et « au plus trois éléments par énumération ».

### 5. Intros de thèmes : quantificateurs flous et « la plupart »

« Plusieurs personnes » revient 7 fois, « d'autres » 6 fois, « certains » 5 fois : 18 quantificateurs
flous dans 10 intros (12 à la passe 11). « La plupart » passe de 10 à 12. Le pire exemple :

- Orientation et études supérieures : « Plusieurs personnes décrivent des familles mal informées et un parcours opaque, et d'autres critiquent le fonctionnement de l'université, de la sélection au manque de moyens. Plusieurs personnes reprochent une orientation tournée vers le baccalauréat général au détriment des filières professionnelles, et d'autres décrivent des stages difficiles à trouver ou mal encadrés. » Deux phrases dans le même moule, sans aucun nombre, alors que les synthèses en dessous en donnent (6, 9, 7).
- Regard d'ensemble : « La plupart de ceux qui racontent la scolarité de leurs enfants estiment qu'elle se passe bien, mais la plupart de ceux qui parlent du système éducatif le jugent défaillant. » Deux « la plupart » dans la même phrase, et le premier redit l'avis d'ensemble que la règle 8 du résumé interdit de présenter comme « l'avis de la plupart ».
- Familles face à l'institution scolaire : « même si une partie d'entre eux trouvent l'inscription simple ou fluide » (« une partie » : 10 personnes) ; « plusieurs personnes demandent de mieux associer les parents, quand 2 autres rappellent au contraire les parents à leurs propres devoirs » (5 personnes ; « parents » deux fois).

**Source : la consigne** (`methods.ts`, `themes`, règle 4, qui ne propose que « la plupart de ceux
qui parlent de… » ; règle 5, qui interdit de recopier les synthèses, si bien que le moteur d'IA
généralise au lieu de compter). Piste : « donne le nombre de personnes du motif que tu cites ; à
défaut, nomme le motif sans quantifier ».

### 6. « Subir » dans les définitions : 14 fois (14 à la passe 11)

« subir des délais, des erreurs ou des interlocuteurs injoignables », « subir une administration
rigide, opaque, distante ou impuissante », « subir la gêne causée par les grèves des enseignants »
(pléonasme), « subir des classes multiniveaux ou trop hétérogènes », « subir l'exclusion scolaire
d'un enfant malade sans solution », « subir le harcèlement ou dénoncer l'inaction des équipes »…
Une définition dit ce que la personne exprime, pas ce qu'elle vit : « se plaindre de », « dénoncer ».

**Source : la consigne** (`methods.ts`, `review` règle 14, dont l'exemple « en subir les
contraintes » est repris tel quel). Non corrigée depuis la passe 10. Remplacer l'exemple par
« s'en plaindre ».

### 7. Défauts ponctuels de précision

- Niveau d'exigence scolaire, phrase tronquée : « Trois personnes décrivent des enfants qui s'ennuient ou ne sont pas nourris à leur niveau, dont une, par ailleurs très satisfaite de l'école publique de ses enfants. » Il manque le verbe de la relative ; de plus, la phrase « montre ses comptes » (règle 10).
- Financement des études et Gratuité de l'école : la même phrase figure dans les deux motifs (« Une personne nuance : selon elle, il faut beaucoup d'argent […] les grands corps de l'État offrent […] à coût abordable, les étudiants y étant payés »), et la seconde version dit « des carrières à coût abordable », ce qui n'a pas de sens. À voir avec le `methodologue` (les deux motifs se recouvrent).
- Reconnaissance des enseignants : « Le manque de reconnaissance des enseignants est déploré par 3 personnes. Deux personnes saluent pourtant le travail formidable des enseignants […], malgré une reconnaissance « lamentable » de leur hiérarchie. » « Pourtant » annonce une opposition qui n'existe pas : ces deux personnes déplorent elles aussi le manque de reconnaissance.
- Enseignement privé : « une autre propose d'augmenter ces quotas et de mieux le rémunérer ». « Le » renvoie au privé, trois propositions plus haut.
- Recherche de stages : « Trouver un stage est une épreuve pour les personnes qui en parlent » : le nombre manque (2).
- Persistent depuis la passe 10 : « des enseignants démotivés par les changements » (lesquels ?) ; « la décision tombant à quelques mois de la rentrée » (quelle décision ?) ; « confié à des professeurs français » (professeurs de français, ou Français qui enseignent une langue étrangère ?).
- Le vocabulaire du livre de codes passe dans les synthèses : « sans juger ses moyens » (Moyens des écoles), « sans juger leur prise en charge » (Décrochage scolaire), « décrit, sans la juger » (Composition des classes). C'est la langue des définitions, pas celle d'un rapport : « une autre fait de l'éducation une priorité » suffit.
- Soutien scolaire privé, tautologie : « Une personne salue le soutien scolaire privé : elle se félicite qu'il existe désormais une entreprise de cours particuliers. » → « Une personne se félicite qu'existe désormais une entreprise de cours particuliers. »

### 8. Titres

- « Écoles rurales » : la synthèse parle encore d'« écoles de village » (persiste depuis la passe 10).
- « Gestion des établissements », « Encadrement administratif » et « Accès aux services administratifs » restent presque synonymes ; « Financement des études » et « Gratuité de l'école » aussi (même phrase dans les deux, voir 7). Défaut de regroupement plus que de langue : à transmettre au `methodologue`.

## Textes injectés par le code (hors note, à corriger à la source)

- **« Quarante-6 »** : voir le défaut 1. C'est le défaut le plus visible du rapport.
- **Nouvelle ligne « Balayage par définition »** : « 21 motifs du résumé ont été confrontés, avec leur définition, à tous les avis rangés ailleurs ; 88 avis rangés ailleurs y comptent aussi, 3 avis y ont été déplacés, 3 tons corrigés. » Quatre défauts : « rangés ailleurs » deux fois ; l'incise « avec leur définition » alourdit ; « avis » alors que le reste de la Méthode dit « idées » (« 89 idées déplacées ») ; et le lecteur ne sait pas si les 88 avis sont compris dans les 109 idées du codage en double. Proposition : « Balayage par définition : les idées des autres motifs ont été relues à la lumière de la définition des 21 motifs du résumé. 88 y comptent aussi (elles font partie des 109 du codage en double), 3 y ont été déplacées et 3 ont changé de ton. » (Le chiffre entre parenthèses est à vérifier dans le code.)
- **Méthode, « Relecture des motifs »** : « 16 idées changées de camp après un nouvel examen de leur ton au regard de l'objet du motif » → « 16 idées ont changé de ton une fois jugées par rapport à l'objet du motif ». « Camp » reste un mot interne : il revient aussi dans « Indicateurs » (« dans aucun camp », « changeant de camp »). « Livre de codes » est corrigé (« le positif et le négatif y obéissent »), et la fusion n'est plus annoncée deux fois.
- **Résumé, ligne des avis partagés** : « Les avis sont partagés sur trois sujets » écrit le nombre en lettres au milieu de la phrase (`NUMBER_WORDS_FR`, `pipeline.ts`, vers la ligne 1777). Ce n'est pas un compte de personnes, mais la même phrase donne ensuite « 51 participants » : « 3 sujets » serait plus cohérent. Dans cette phrase, « participants qui donnent un avis » côtoie « ceux qui en parlent », juste au-dessus.
- **Mentions « aussi dans « … » »** : justes et lisibles. La note « \* s'exprime aussi dans l'autre sens sur ce motif. » commence par une minuscule après l'astérisque. Proposition : « \* Ce participant s'exprime aussi dans l'autre sens sur ce motif. »

## Règle de style à retenir

Une règle typographique se juge sur la phrase entière, pas sur chaque mot : « Onze personnes…
et 11 autres » respecte la règle et sonne faux. Le levier est la construction (l'objet en tête),
pas la conversion des nombres.
