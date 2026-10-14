# Une méthode par famille de modèles

Décision d'Arnaud (13/10/2026) : chaque famille de modèles a sa méthode d'analyse,
la meilleure possible pour elle. Améliorer la méthode d'un modèle ne doit jamais
dégrader celle d'un autre. Le code : `src/core/analysis/methods.ts`.

## Le processus

1. **Partir de la meilleure méthode existante.** Une nouvelle famille (Gemini, Groq…)
   commence par une copie de la méthode la mieux notée, pas par une page blanche.
2. **L'affiner sur le corpus réel** (ÉcoSol aujourd'hui), passe après passe, notée par
   le `methodologue` (méthode) et la `plume` (langue). Trois passes au plus par itération.
   Quand les notes ne montent plus, c'est le plafond du modèle : on le dit, on ne force pas.
3. **Essayer les apports sur les autres méthodes.** Ce qu'une méthode a appris est
   testé sur les autres, une par une. On le garde seulement si la note monte ; sinon
   l'autre méthode reste à sa dernière référence.
4. **Fusionner quand deux méthodes convergent**, pour ne pas entretenir deux copies
   identiques.

Ce qui reste commun d'office : les filets du code qui n'agissent que sur une réponse
défectueuse (citation inventée retirée, renvois réparés, réponse mal formée tolérée,
réponse coupée signalée). Ils sont rodés sur les synthèses en cache de chaque méthode
avant d'être gardés : aucun effet sur une réponse saine.

## Les méthodes

| Méthode | Modèles | Diffère de la référence par | Note ÉcoSol (méthode / langue) |
|---|---|---|---|
| `reference` | Sonnet (et par défaut tous les autres) | — | 4,5 / 4 (B10) |
| `ministral` | Ministral 3B, 8B, 14B (Mistral, offre gratuite) | lots 150/75/60/40 ; exemple de regroupement neutre ; citations aux fautes de frappe rattachées au texte d'origine | 3 / 3 (passe 3) |
| `groq` | gpt-oss-120b, gpt-oss-20b, Qwen 3.8 27B (Groq, offre gratuite) | lots très réduits (60/60/30/20, vérification 40, relecture 4) pour tenir sous 8 000 jetons par demande | abandonné : synthèse trop longue (environ une heure) |
| `gptoss` | gpt-oss 20B sur l'ordinateur (Ollama) | réflexion moyenne ; lots 100/50, synthèses par 10, relecture par 4 ; exemple neutre | arrêté : aucune synthèse complète sur un Mac de 24 Go |
| `gemma` | Gemma 4 12B sur l'ordinateur (Ollama) | apports de Gemini (isolés rattachés, règles de titre et de rédaction), titres fourre-tout interdits, lots 150/75 | 3 / — (passe 2) ; sous le seuil, retiré des choix |
| `gemini` | Gemini 3.5 et 3.1 Flash-Lite, 3.8 Flash (Google, offre gratuite) | rattachement des motifs isolés ; règles ajoutées : titres de motif sans « et » ni remplissage, « range d'abord », phrases autonomes, compte = personnes citées | 3,5 / 2,5 (passe 4) |

## Ministral 14B sur ÉcoSol — 13/10/2026

| | P1 | P2 | P3 | Sonnet B10 |
|---|---|---|---|---|
| Lots (regroupement / rangement) | 350 / 200 | 80 / 50 | 150 / 75 | 350 / 200 |
| Idées | 223 | 227 | 227 | 284 |
| Motifs (dont à une personne) | 18 | 53 (18) | 33 (4) | 32 |
| Citations écartées | 4 | 0 | 0 | 0 |
| Idées déplacées à la relecture | 138 | 101 | 54 | 10 |
| Phrases retirées par les contrôles | 24 | 33 | 35 | 0 |
| Note `methodologue` | 2 | 2,5 | 3 | 4,5 |
| Note `plume` | 2,5 | — | 3 | 4 |

Durée : 7 à 10 minutes, une cinquantaine de demandes, gratuit.

Verdict (passe 3) : les cartes, les chiffres et les verbatims sont fiables ; la prose
plafonne (phrases orphelines après un retrait, un même camp compté deux fois, renvois
élargis à tout le motif). Restituable après une heure de relecture humaine ciblée.

### Prochains leviers, dans l'ordre (avis du `methodologue`)

1. **Rédaction** : un modèle plus fort (Mistral Small ou Medium, payant) sur les seules
   étapes d'écriture serait plus rentable que d'affiner encore les consignes. Décision
   d'Arnaud. Côté code, sans regret : retirer avec une phrase celle qui s'appuie sur elle
   (connecteur en tête) ; refuser deux chiffres pour un même camp.
2. **Rangement guidé par la question** (interne / externe) ; « idem » rattaché à la
   réponse précédente du même participant.
3. **Thèmes** : cible de 6 à 8 (validée) ; un thème à une ou deux personnes passe en
   signaux isolés.

Fausses alertes du contrôle des nombres relevées au passage (communes à toutes les
méthodes) : un nombre pris dans un autre nombre, « 5 000 » écrit avec une espace.

## Gemini 3.5 Flash-Lite sur ÉcoSol — 13/10/2026

Choisi pour son quota gratuit (15 demandes par minute, 500 par jour) : 3.8 Flash est limité
à 20 demandes par jour, une synthèse n'y tient pas. Méthode de départ : copie exacte de la référence.

| | P1 (référence) | P2 | P3 | P4 | Sonnet B10 |
|---|---|---|---|---|---|
| Changement | — | rattachement des isolés, règles de titre et de rédaction | « ne range que si le titre décrit l'idée » | retour à « range d'abord » ; règle de compte réécrite ; filets communs | — |
| Motifs (à une personne) | 79 (41) | 36 (4) | 61 (20) | 36 (4) | 32 |
| Défauts d'audit | 1 | 21 | 2 | 6 | 0 |
| Phrases retirées | 15 | 11 | 2 | 10 | 0 |
| Note `methodologue` | 2,5 | 3 | — | **3,5** | 4,5 |
| Note `plume` | 2,5 | 2 | — | 2,5 | 4 |

Durée : 2 à 6 minutes par passe, gratuit. Verdict (passe 4) : restituable après environ
45 minutes de relecture ciblée (intros de deux thèmes, propositions absentes du résumé,
comptes de personnes dans deux intros, un motif fourre-tout).

Leçons :
- Les deux modèles légers échouent à l'opposé au regroupement : Ministral fait des
  fourre-tout avec un grand lot, Gemini morcelle. La même consigne ne convient pas aux deux :
  c'est ce qui justifie une méthode par famille.
- La structure dépend du regroupement, la prose de la synthèse et des filets du code : en
  changeant l'un sans l'autre (P3 puis P4), on attribue chaque effet à sa cause.
- Rattacher les motifs isolés un par un (« même objet qu'un motif existant, ou aucun ? »)
  marche mieux qu'une consolidation libre sur une longue liste pour un modèle léger.

## gpt-oss 20B sur l'ordinateur (Ollama, Mac 24 Go) — 14/10/2026

| | P1 (référence) | P2 | P3 | P4 |
|---|---|---|---|---|
| Changement | — | lots et exemple de Ministral | regroupement raté redemandé (filet commun) | réflexion moyenne, lots 100/50 |
| Motifs | 1 fourre-tout de 264 idées | 15 (237 idées dans un) | 1 groupe malgré la relance | 41, regroupement correct |
| Fin | synthèse qui boucle | complète, ~38 min | — | réponses coupées à l'écriture (synthèses par 40, puis relecture par 12 et par 4) |

Environ 4 heures pour aucune synthèse complète notée. Une demande d'écriture prend jusqu'à
27 minutes : la réflexion de gpt-oss boucle au-delà de 16 000 jetons, même sur 4 textes.
Les titres des grands motifs sortent en anglais malgré la consigne. Verdict : plafond du
modèle sur cette machine, on arrête (décision d'Arnaud, 14/10).

Acquis communs : filet du regroupement dégénéré ; délai de 30 minutes par demande en local ;
écrire dans `docs/` ou `fixtures/` ne recharge plus la page pendant une analyse.

## Gemma 4 12B sur l'ordinateur (Ollama, Mac 24 Go) — 14/10/2026

| | P1 (référence) | P2 | P3 | Sonnet B10 |
|---|---|---|---|---|
| Changement | — | apports de Gemini, titres fourre-tout interdits, lots 150/75 | lots 250/120 | — |
| Motifs (à une personne) | 34 | 74 (43) | 151 (117) | 32 |
| Défauts d'audit | 3 | 1 | 2 | 0 |
| Note `methodologue` | 2,5 | **3** | non notée (structure inutilisable) | 4,5 |
| Note `plume` | 3 | — | — | 4 |

Environ 40 minutes par passe. Gemma va au bout sans réflexion, mais boucle sur une longue
réponse (regroupement de 295 idées, relecture répétant 27 déplacements 590 fois) et morcelle
dès qu'on réduit les lots. Le découpage coupe des réserves de ce qu'elles nuancent malgré la consigne.

**Verdict (14/10) : modèles locaux retirés des choix proposés.** Seuil fixé par Arnaud : un moteur
n'est proposé qu'à 3,5/5 au moins (le niveau de Gemini Flash-Lite), idéalement 4, et sans
être pénible à utiliser ; les entretiens alourdiront encore les données. Le code reste prêt
(`LOCAL_ENGINES_OFFERED` dans `src/core/providers/presets.ts`) : à rouvrir avec un modèle local
plus solide ou une machine plus grosse.

Acquis communs : une relecture des motifs qui boucle est ignorée pour son lot ; la phrase de
camp ajoutée par le code nomme le motif au lieu de « le critiquent ».

### Essais croisés (étape 3 du processus)

| Apport | Essayé sur | Résultat | Décision |
|---|---|---|---|
| Règles de rédaction de Gemini (phrases autonomes, compte = personnes citées) | Ministral | methodologue 3 → 2, plume 3 → 3 ; 12 phrases de thème sans renvoi | **Rejeté**, Ministral garde sa v3 |
| Rattachement des motifs isolés | Ministral | non essayé : Ministral n'a que 4 motifs isolés | — |
| Apports de Gemini (isolés, titres, rédaction) | Gemma | methodologue 2,5 → 3 ; mais 74 motifs dont 43 à une personne | Gardé (Gemma retiré ensuite) |
| Tout apport | Référence | non essayé : la référence n'a aucun des défauts visés (avis du `methodologue`) | — |

### Chantiers communs (toutes méthodes, à roder sur les caches dont Sonnet B10)

1. Phrase du code sur les sujets qui divisent : ne pas l'ajouter quand le modèle les a déjà
   nommés en d'autres mots (aujourd'hui : titre exact seulement).
2. Consensus rétablis : un motif consensuel d'au moins 4 personnes figure dans l'intro de son
   thème ; une proposition d'au moins 3 personnes figure dans le résumé.
3. Comptes de personnes dans les intros de thème : remplacer un compte non vérifié par le
   compte calculé plutôt que d'afficher « À vérifier ».
4. Renvois en double en fin de paragraphe après les filets (« (cf. P5). (cf. P5, P19) »).
5. Un motif d'au moins 8 personnes aux avis partagés : poser la question « un seul objet ? ».

## Ce que la grille révèle sur la référence elle-même (14/10/2026, soir)

Notée avec `docs/NOTATION.md` par trois lectures concordantes, la synthèse Sonnet B10 a 3/5. Les mêmes
défauts reviennent dans les trois lectures, et chez Gemini : ce sont des défauts de la **méthode**,
pas d'un modèle. Pistes à essayer sur la référence (gardées seulement si la note monte) :

1. **Motifs coupés selon le ton** : deux motifs sur la vie du groupe, l'un unanime en positif (9 sur 9),
   l'autre unanime en négatif (7 sur 7), portent sur le même objet ; le découpage fabrique deux unanimités
   contraires. Règle à essayer au regroupement : « un motif ne rassemble jamais des idées parce qu'elles
   ont le même ton ; l'éloge et la critique d'un même objet vont dans le même motif ».
2. **Fourre-tout d'éloges** : un motif unanime (8 sur 8) rassemble des satisfecit sans objet commun. Un « bravo » sans objet n'est pas un motif : à classer en signal isolé.
3. **Gouvernance émiettée** : décision, pilotage, rôles et réunions internes séparés ; les critiques
   de la décision tombent ailleurs, et « Processus de décision » passe à tort dans « Ce qui a marché ».
4. **Renvois faux** dans quelques synthèses (une personne citée pour un autre objet).
5. Verbatims d'un mot, incompréhensibles seuls : déjà écartés de la règle 5 du découpage,
   à contrôler par le code.

## Opus 5.5 et le grand prompt (14/10/2026, soir)

Grille `docs/NOTATION.md`, `methodologue` et `plume` sur Opus (réflexion moyenne), deux lectures
pour la méthode. Réglages : température 0, graine fixe (pipeline) ; Opus joué par des sous-agents,
une passe par demande, sans script.

| Synthèse | Méthode | Langue | Relecture humaine | Remarques |
|---|---|---|---|---|
| Sonnet B10, méthode de référence (pipeline) | 3 · 3 · 3 (élevée) | 3 | 1 h 30 à 2 h | plafonné : motifs coupés selon le ton (deux unanimités contraires), fourre-tout d'éloges |
| Gemini 3.5 Flash-Lite P4 (pipeline) | 2,5 | — | ~3 h | faux consensus, tons faux |
| Opus 5.5, référence avec découpage par lots de 10 personnes (méthode `lots`) | 3 · 3 (plafond) | 3,5 | 1 h 30 à 2 h 30 | 22 demandes au lieu de 42 ; mêmes défauts de regroupement ; aucun gain de qualité |
| **Opus 5.5, grand prompt en une demande** | **3,5 · 3,5** | **4** | 45 min à 1 h | 143 citations exactes sur 146 (une majuscule changée) ; aucun fourre-tout ni motif coupé selon le ton ; mais idées perdues et comptes incomplets (personne ne vérifie) |
| Opus 5.5, méthode de référence (pipeline) | 3 (plafond) · 3,5 | 3,5 | 1 h 30 | 277 idées, 37 motifs, 0 défaut d'audit ; couverture quasi complète, renvois justes ; mais les mêmes défauts de regroupement que Sonnet |

Leçons provisoires :
- **Voir tout le corpus aide le regroupement.** Le pipeline regroupe des libellés avec un seul exemple ;
  le grand prompt regroupe en lisant toutes les réponses. Les défauts qui plafonnent la référence
  (ton, fourre-tout) disparaissent. Piste pour le pipeline : donner au regroupement plus de contexte
  par idée (la réponse entière, la question), et la règle « l'éloge et la critique d'un même objet vont ensemble ».
- **Le code reste indispensable pour l'exhaustivité** : sans couverture ni comptage par le code, le
  grand prompt perd des idées et oublie des personnes. L'idéal serait les deux : la lecture d'ensemble
  du modèle, les contrôles du code.
- **Un motif de propositions** (8 personnes, un seul avis) s'affiche « 1 avis · peu d'avis » : l'en-tête
  doit dire combien de personnes proposent quand le motif n'a presque pas d'avis (défaut commun au
  rendu du pipeline).
- **Renvois** : « (cf. P2) » et « (par ex. P2) » hachaient le texte (`plume`) ; une seule forme désormais,
  « (P2, P14) », et « (notamment P2) » quand la phrase compte plus de personnes que les renvois.

### Défauts des consignes signalés par le moteur lui-même (Opus, 14/10)

Un modèle fort lit les consignes de près et signale leurs trous ; à corriger dans une prochaine
version de la référence (gardée seulement si la note monte) :
1. **Thèmes** : on exige « trois personnes » avec une idée de chacune entre crochets, mais les données
   ne disent pas à qui appartient chaque idée (seulement la liste des personnes du motif). Donner
   l'auteur de chaque idée citée dans les synthèses des motifs.
2. **Synthèse de motif** : l'exemple de réponse ne montre pas le format d'une opposition
   (`{"a","b","about"}`) ; Opus a écrit `{"ids":[…],"about"}`. Filet commun ajouté (les deux formes
   sont lues) ; l'exemple reste à compléter dans la consigne.
3. **Synthèse de motif** : « les chiffres sont calculés, n'en calcule pas d'autres » et « donne le nombre
   exact de personnes derrière chaque affirmation » se lisent comme contradictoires ; préciser que le
   nombre de personnes d'une phrase se compte sur ses crochets.

**Conclusion (14/10, soir).** Avec la méthode de référence, Opus ne fait qu'un peu mieux que Sonnet
(3 et 3,5 contre 3, 3, 3) : les défauts qui plafonnent la note sont **les mêmes avec les deux modèles**
(une unanimité fabriquée parce que l'avis contraire est rangé dans un motif voisin, la communication
émiettée en huit motifs, un fourre-tout d'éloges). Ils viennent donc de la méthode, à l'étape du
regroupement, et non du modèle. Le grand prompt, qui regroupe en lisant tout le corpus, ne les a pas.
Prochaine expérience, sur la référence : un regroupement qui voit plus de contexte et qui suit les
règles « un objet, quel que soit le ton », « pas de motif d'éloges sans objet », « un même constat
(par exemple “trop tard”) ne se disperse pas ». Elle ne sera gardée que si la note monte (deux lectures).

Le tic « Toutes les personnes qui en parlent » en tête des intros de thème vient de notre consigne
des thèmes (qui impose cette formule pour un consensus) : à reformuler à la source.
4. **Contrôle des comptes** : la vérification des renvois (Opus, passe « lots ») signale six phrases dont
   le nombre de personnes correspondait aux renvois (G1, G11, G13, G26, G32) ; probables fausses alertes
   du contrôle de comptage, qui font récrire des phrases justes sans leur chiffre. À reproduire sur le
   cache et corriger dans le code.

**Découper plusieurs personnes par demande** (question d'Arnaud, 14/10) : à qualité égale, deux fois
moins de demandes. Pas d'effet sur la note, puisque le défaut qui plafonne se joue au regroupement.
La méthode `lots` reste disponible pour un moteur dont le quota de demandes est serré ; elle n'entre
pas dans la référence. Le gain de qualité est ailleurs : dans ce que le modèle voit quand il regroupe
(le grand prompt lit tout le corpus d'un coup).

## Méthode candidate « contexte » (14/10/2026, nuit)

Changements, sur la seule étape de regroupement (découpage repris du cache, pour isoler l'effet) :
verbatims et ton de chaque libellé au regroupement ; règles « l'éloge et la critique d'un même objet
vont ensemble », « appréciation d'ensemble » à part, « un même reproche ne se disperse pas » ;
vérification des unanimités (idées de ton contraire rangées ailleurs).

| Moteur | Méthode : référence → contexte | Langue : référence → contexte |
|---|---|---|
| Opus 5.5 | 3 · 3,5 → 3 · 3,5 | 3,5 → 4 |
| Sonnet | 3 · 3 · 3 → 3 · 3 | 3 → 3,5 |

**Verdict : pas adoptée comme référence** (la note de méthode ne monte pas, règle du processus).
Elle reste disponible comme candidate. Ce qu'elle a appris :
- Opus a bien réuni ce que la consigne visait (choix opposés dans un même motif,
  reproches de retard rassemblés, avis positif sur la façon de débattre rangé avec les désaccords) :
  chez Opus, **le plafond ne vient plus du regroupement**, mais d'avis positifs codés « suggestion »
  au découpage (un avis positif sur une action de terrain, suivi d'une idée pour la suite).
- Sonnet garde l'ambiance et les tensions dans deux motifs, et sa vérification des unanimités ne
  déplace rien : la consigne ne suffit pas à un modèle moins fort.
- Le motif « Appréciation d'ensemble » est jugé fourre-tout par les évaluateurs : à retirer.
- La demande de vérification des unanimités répète les candidates pour chaque motif (221 000
  caractères) : à alléger (une seule liste de candidates).

Défauts qui reviennent dans toutes les lectures, toutes méthodes (prochains chantiers, par ordre) :
1. **Découpage** : une critique formulée comme un manque (« pas assez de… ») est codée « suggestion » ;
   un avis positif suivi d'une proposition n'est codé que « suggestion ». Règle à ajouter au découpage
   (exemple neutre, hors corpus).
2. **Personne prolixe** : le résumé présente trois propositions d'une seule personne comme celles
   « des participants ». Le code connaît l'auteur : lui faire écrire « une personne propose ».
3. **« la plupart » au lieu du chiffre** dans les intros de thème : la consigne des thèmes l'impose ;
   la remplacer par le compte calculé.
4. **Phrase orpheline** après un retrait par le code (une reprise qui renvoie à une phrase retirée) : retirer aussi
   la phrase qui en dépend (filet déjà présent pour les connecteurs, à étendre aux reprises).
5. **« (notamment P5) »** pour une seule personne citée : écrire le renvoi sans « notamment » quand un
   seul participant est cité, et compter correctement.
