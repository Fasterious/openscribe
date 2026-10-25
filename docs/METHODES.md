# Une méthode commune, un réglage par famille de modèles

**Décision d'Arnaud (25/10/2026)** : l'algorithme le plus abouti sert partout. La méthode mise au point sur l'étude
école de l'Observatoire (« consultation », passes 1 à 17) devient la **méthode commune** de toute l'application :
les nouvelles synthèses la suivent, l'Observatoire aussi. Ce qui change d'un moteur à l'autre n'est plus une méthode
mais un **réglage** posé dessus (taille des lots, exemple de consigne, règles ajoutées à la suite), avec les mêmes
étapes pour tous. Modifier la méthode commune (`COMMUNE` dans `src/core/analysis/methods.ts`) modifie d'un coup
l'Observatoire et la Synthèse, pour tous les moteurs.

- Identifiants : `commune` (moteurs sans réglage : Claude, Opus, Sonnet…), `commune-gemini`, `commune-ministral`,
  `commune-groq`, `commune-gptoss`, `commune-gemma`, `commune-qwen`. `consultation` est la méthode commune sous son
  premier nom (l'étude école publiée).
- Les réglages reprennent ce qui avait été prouvé sur la référence (ÉcoSol) ; ils restent à re-mesurer sur la
  méthode commune. Un apport qui ne fait pas monter la note est retiré du réglage.
- Les anciennes méthodes (ci-dessous, du 13 au 17/10) sont figées pour les analyses enregistrées avec elles.
- Preuve de non-régression de l'Observatoire (25/10) : l'étude école rejouée depuis son cache avec `--method
  commune` redonne les mêmes 1 051 idées, 73 thèmes et grands thèmes (seule la demande du résumé change, à cause du
  vocabulaire « thèmes » du 18/10, sans rapport avec la méthode).

### Essayer un vrai moteur avec le pont (25/10)

Le pont rejoue une analyse complète avec un vrai moteur, les réglages de son préréglage (débit, graine, format JSON) et
la méthode de l'application pour ce modèle (`methodForModel`) :

```bash
NODE_USE_ENV_PROXY=1 npx tsx scripts/bridge.ts <fichier.csv> <dossier> --preset gemini --model gemini-3.5-flash-lite \
  --question "…" --export <dossier>/etude.openscribe.json --name "…"
```

La clé est lue dans l'environnement, jamais en argument : `OPENSCRIBE_KEY_<PRESET>` (ex. `OPENSCRIBE_KEY_GEMINI`) ou
`GEMINI_API_KEY`, `MISTRAL_API_KEY`, `ANTHROPIC_API_KEY`. `--rpm` règle le débit (par défaut, celui de l'offre gratuite),
`--method` force une méthode. Les réponses vont dans `<dossier>/cache.json` : une relance ne repaie rien.

### Preuve côté Synthèse : un questionnaire à deux questions (25/10)

Corpus réel d'une autre forme que l'école : 50 personnes du Grand débat 2019 (Licence Ouverte) qui répondent chacune à
deux questions (chercher une formation, scolariser son enfant), région en attribut ; échantillon tiré au hasard
(graine 20261025), hors échantillon de l'école. Même découpage pour les deux méthodes (cache commun), modèle joué par
des sous-agents (niveau Opus), rapports anonymisés (A, B) ; deux lectures `methodologue` dans des ordres inverses,
une lecture `plume`. Fichiers : dépôt de l'Observatoire, `2026-10-essai-synthese/`.

| | Méthode commune | Référence (ancienne méthode de la Synthèse) |
|---|---|---|
| Idées · thèmes · grands thèmes | 387 · 40 · 8 | 380 · 37 · 7 |
| `methodologue`, lecture 1 | **7/10** · 3 erreurs qui changent une conclusion | 6/10 · 4 erreurs |
| `methodologue`, lecture 2 | **7/10** · 4 erreurs (une discutable) | 6/10 · 3 erreurs |
| `plume` | **7/10** (style « magazine » à reprendre) | 5/10 (« la plupart » 17 fois au lieu du nombre) |
| Relecture humaine estimée | 1 h à 1 h 30 | 2 h 30 à 3 h |

Ce qui fait la différence, selon les deux lectures : un résumé hiérarchisé (ce qui marche, bloque, divise, ce qu'on
propose), un livre de codes par thème, la section « Hors question » (la référence intègre du hors-sujet à trois
thèmes). Défauts communs aux deux, venus du découpage partagé : une réserve coupée de l'éloge qu'elle nuance (un
jugement positif suivi d'une critique du collège), une idée de la première question rangée sous la seconde. Défauts propres à la méthode
commune : deux fausses unanimités (une voix contraire rangée ailleurs), un détail surinterprété repris dans le résumé.
Prochains leviers : la réserve qui suit un éloge au découpage ; une vérification des unanimités du résumé.

## Historique : une méthode par famille de modèles (13-24/10)

Décision d'Arnaud (13/10/2026) : chaque famille de modèles a sa méthode d'analyse,
la meilleure possible pour elle. Améliorer la méthode d'un modèle ne doit jamais
dégrader celle d'un autre. Le code : `src/core/analysis/methods.ts`.

### Le processus

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

### Les méthodes

| Méthode | Modèles | Diffère de la référence par | Note ÉcoSol (méthode / langue) |
|---|---|---|---|
| `reference` | Sonnet (et par défaut tous les autres) | — | 4,5 / 4 (B10) |
| `ministral` | Ministral 3B, 8B, 14B (Mistral, offre gratuite) | lots 150/75/60/40 ; exemple de regroupement neutre ; citations aux fautes de frappe rattachées au texte d'origine | 3 / 3 (passe 3) |
| `groq` | gpt-oss-120b, gpt-oss-20b, Qwen 3.8 27B (Groq, offre gratuite) | lots très réduits (60/60/30/20, vérification 40, relecture 4) pour tenir sous 8 000 jetons par demande | abandonné : synthèse trop longue (environ une heure) |
| `gptoss` | gpt-oss 20B sur l'ordinateur (Ollama) | réflexion moyenne ; lots 100/50, synthèses par 10, relecture par 4 ; exemple neutre | arrêté : aucune synthèse complète sur un Mac de 24 Go |
| `gemma` | Gemma 4 12B sur l'ordinateur (Ollama) | apports de Gemini (isolés rattachés, règles de titre et de rédaction), titres fourre-tout interdits, lots 150/75 | 3 / — (passe 2) ; sous le seuil, retiré des choix |
| `gemini` | Gemini 3.5 et 3.1 Flash-Lite, 3.8 Flash (Google, offre gratuite) | rattachement des motifs isolés ; règles ajoutées : titres de motif sans « et » ni remplissage, « range d'abord », phrases autonomes, compte = personnes citées | 3,5 / 2,5 (passe 4) |
| `consultation` | Opus 5.5 (Observatoire : consultations publiques, grand public) | « Hors question » ; ton jugé par rapport à l'objet du motif (raison d'un choix, comparaison, regret d'une limite) ; seconde relecture des motifs qui ont reçu une idée ; résumé : équilibre des avis, 8 lignes, mot de l'échelle avec son nombre, entre parenthèses, base « qui donnent un avis » ; chaque camp compté (contrôle : camp cité à moins de 80 % signalé) ; lignes oubliées signalées ; phrases du code en une phrase | École (Grand débat) : 3 / 3,5 (passes 3 à 7, plafond) |

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
6. **Couverture des longues réponses** : le passage non couvert est renvoyé seul, sans la phrase qui le
   précède ; une liste d'exemples qui illustre une critique (« on n'ouvre aucune perspective, par exemple… »)
   est alors lue comme des avis positifs. Donner au modèle le texte qui précède le passage (comme `before`
   à la relecture des motifs). Vu deux fois sur ÉcoSol (Sonnet, découpage de référence et v2).

## Chantiers 1 à 3 : méthode candidate « contexte2 » (14/10/2026, nuit)

Sur la base de « contexte » : règle de ton au découpage (une critique formulée comme un manque est
négative ; un avis suivi d'une proposition donne deux idées), verbatims des propositions et questions
au résumé avec « une personne propose », chiffre du motif au lieu de « la plupart » dans les thèmes.
Passes complètes (découpage compris).

| Méthode | Opus : méthode · langue | Sonnet : méthode · langue |
|---|---|---|
| Référence | 3 · 3,5 — 3,5 | 3 · 3 · 3 — 3 |
| contexte | 3 · 3,5 — 4 | 3 · 3 — 3,5 |
| contexte2 | 3,5 · 3 — 4 | 3 · 3 — 3,5 |
| Grand prompt (une demande, Opus) | 3,5 · 3,5 — 4 | — |

**Verdict : palier.** Trois variantes de la méthode en plusieurs étapes donnent la même note de méthode
(3 à 3,5 chez Opus, 3 chez Sonnet), à l'intérieur du bruit de l'évaluateur. La langue gagne un
demi-point avec « contexte », sur les deux modèles, sans perte de méthode. Les défauts qui restent
changent d'une passe à l'autre (jugements de ton et de rangement au cas par cas) ou viennent du code :

1. Couverture des longues réponses sans contexte : ton inversé (vu sur les deux modèles).
2. Phrase de code « Les avis s'opposent sur… » répétée dans le résumé, et phrase orpheline (« Cette
   dernière… ») quand le code retire celle qui la précède.
3. Contrôle des comptes : plusieurs fausses alertes par passe, qui font récrire des phrases justes.
4. Effet de bord de la règle « une personne propose » : le résumé met en avant des pistes isolées au
   lieu de la plus partagée ; et « écris le chiffre » rend les intros de thème répétitives. Règles à
   retirer de la v2.
5. La règle de ton au découpage ne prend qu'en partie (éloges encore codés « suggestion »).

Conclusion : les consignes ne feront plus monter la note de méthode ; les gains restants sont dans le
code (points 1 à 3) et dans la structure (le grand prompt, qui lit tout, reste devant : une synthèse
hybride, lecture d'ensemble par le modèle et contrôles par le code, est la piste suivante).

### Corrections dans le code (14/10/2026, nuit) — communes à toutes les méthodes

1. **Contrôle des comptes** : « presque toutes les personnes » n'est plus lu comme « toutes » (contrôlé
   comme « la plupart », trois personnes citées) ; un pluriel dans un propos rapporté (« relève que certains
   colistiers… ») n'est plus pris pour un compte, sauf après « tandis que » ou « alors que ». Les autres
   alertes jugées fausses par les modèles se sont révélées justes une fois rejouées avec les vraies
   personnes (deux idées de la même personne comptées pour deux).
2. **Phrases du code** : le rattrapage final n'ajoute plus une seconde phrase « Les avis s'opposent sur… »
   quand la relecture a reformulé les titres ; « les critiques se rejoignent mais les remèdes s'opposent »
   devient « les pistes proposées s'opposent » (on n'affirme plus un constat commun) ; une reprise
   (« Cette dernière », « La seconde »…) part avec la phrase qu'elle reprend.
3. **Couverture** : chaque passage non couvert arrive avec ce qui le précède dans la réponse (`before`),
   pour en juger le sens et le ton.

À valider sur une passe ÉcoSol (Opus, méthode « contexte ») avant de conclure.

## Méthode « consultation » sur l'Observatoire, école (Grand débat 2019) — 14-15/10/2026

Première étude publique : 378 réponses tirées au sort parmi 21 868. Moteur Opus 5.5 joué par des
sous-agents, une passe sans script ; deux lectures `methodologue` et une `plume` par passe (Opus).
Le découpage est repris du cache jusqu'à la passe 7, pour ne faire varier que le reste.

| Passe | Ce qui change | Méthode (moyenne) | Langue | Cause du plafond |
|---|---|---|---|---|
| 1 | référence | 3 | 3,5 | ton jugé hors de l'objet du motif |
| 2 | méthode « consultation » | 3 (3,5) | 3,5 | éloge d'un autre objet compté dans un motif voisin |
| 3 | relecture refaite | 3 (3,33) | 3,5 | idée déplacée vers un motif voisin faute de voir le bon (ouvert par un autre lot) |
| 4 | seconde relecture des arrivées ; raison d'un choix et comparaison ; regret d'une limite | 3 (3,25) | 3,5 | motif dit unanime, ses critiques restées dans un motif voisin |
| 5 | unanimités vérifiées ; un objet ne se découpe pas selon le jugement ; résumé contrôlé | 3 (3,42) | 3,5 | une demande de plus d'exigence comptée comme éloge |
| 6 | « réclamer davantage » ; pas de « Choix de X » à côté de X | 3,5 et 3 (3,25 et 3,5) | 3,5 | lectures divergentes : regret qu'une règle manque compté contre elle |
| 7 | relecture des tons des seuls motifs du résumé | 3 et 3 (3,33 et 3,67) | 3,5 | idem, et un principe général compté comme éloge |
| 8 | dédoublonnage : éloge et critique qui se recouvrent gardés tous deux ; livre de codes (définition écrite avant de juger) | 3 et 3 (3,25 et 3,25) | 3,5 | critiques du privé restées dans « École publique face au privé », ses éloges formant un motif « unanime » |
| 9 | « un ou deux objets ? » pour « X face à Y » et les motifs partagés ; livre de codes relu d'un bloc (fusions, règles de partage, paires relues ensemble) | 3 et 3 (3,42 et 3,17) | 3,5 | même mécanisme déplacé : éloges de l'école publique dans « Expérience globale », critiques de la qualité des enseignants dans « Contrôle des enseignants défaillants » |
| 10 | codage en double (option du chercheur) : une idée qui répond à deux définitions est copiée dans le second motif | 3 et 3 (3,08 et 3,0) | 4 | passe invalidée : un bug de code appliquait les fusions de la réconciliation aux mauvais motifs (renumérotation) ; une copie revenue chez son original |
| 11 | rejeu corrigé : fusions par titre, copie chez son original retirée, définitions des motifs cibles fournies aux relectures | 3 et 3 (3,5 et 3,17) | 3,5 | handicap et administration corrigés ; éloges de l'école publique toujours dans « Expérience globale », plaintes d'éloignement hors de « Proximité » : aucune paire relue ne couvrait ces frontières |
| 12 | balayage par définition : les 21 motifs promis au résumé confrontés, avec leur définition, à tous les avis rangés ailleurs | 3 et 3 (3,33 et 3,33) | 3,5 | les quatre défauts des passes 8 à 11 levés ; le balayage crée trois fausses lignes « divise » (Gratuité de l'école reçoit le coût du supérieur) |
| 13 | passe finale, sur 10 : même code d'analyse que la passe 12 (rejouée depuis le cache, résultat identique), rapport régénéré avec les mentions « à vérifier » et « fragile » du code | **7/10 et 7/10** (7,17 et 7,0) · 2 erreurs du résumé · structure saine | **6,5/10** | « critique la réforme » pour des personnes qui en réclament ; « École publique face au privé » mêle critiques du public et du privé dans un camp |

**Verdict à la passe 7 : palier, non publié.** La moyenne monte doucement (3,25 → 3,67) mais chaque
passe bute sur une ou deux idées limites, différentes d'une passe à l'autre ; aucune n'a changé le sens
du rapport, plusieurs ont changé une étiquette. Les deux lectures de la passe 7 désignent la même
cause profonde, hors de portée des relectures : **le découpage**, gardé du cache, absorbe des éloges
dans la critique qui les suit quand elle porte sur un autre objet. Prochain levier, préparé mais non joué
(Arnaud a arrêté après la passe 7) : le découpage lui-même. Le `methodologue` a trouvé une cause dans le
code : le dédoublonnage retire une idée contenue dans une plus longue même de ton opposé, si bien qu'un
éloge cité dans la critique qui le suit disparaît des comptes. La passe 8 (commit ecf1903, retiré en
0da320b faute d'avoir été éprouvé) gardait deux avis opposés qui se recouvrent, séparait toujours éloge
et critique, gardait un jugement partiel comme tel et nommait le regret d'une règle ; découpage par lots
de 10 personnes et 6 000 caractères. À rejouer en premier sur la prochaine étude.

Ce qui reste acquis, utile à toutes les études de l'Observatoire :
- **Relecture des motifs** : une idée ne voit pas toujours le bon motif au premier tour (lots parallèles) :
  la seconde relecture des arrivées est indispensable ; deux changements sur une même idée se cumulent.
- **Ton jugé par rapport à l'objet** : raison d'avoir choisi un autre objet, comparaison (chaque moitié
  avec son objet), regret qu'une règle limite un objet apprécié, réclamer davantage de ce qu'on regrette.
  Ces règles ont corrigé chaque fois le cas visé ; elles ne rattrapent pas une idée mal découpée.
- **Phrases du code** (méthode « consultation ») : une seule phrase pour ce qui divise, titres sans
  guillemets, propositions contraires nommées par leur objet ; communes : « fragile » seul, contre-courant
  dit par son camp, nombres composés lus en entier, compte réécrit accepté pour son premier renvoi.
- **Résumé** : l'équilibre des avis en personnes (avec total et recouvrement) ouvre le résumé ; le mot de
  l'échelle s'entend « de ceux qui en parlent » ; les lignes oubliées et « fragile » sont signalés à la
  vérification des renvois.

Questions pour Arnaud (décisions de méthode) :
- « Fragile » sur une unanimité de 20 personnes ou plus (une voix change l'étiquette, par construction) :
  le `methodologue` propose de ne l'afficher que sous 10 avis environ. Règle de `CLAUDE.md`, non changée.
- Le plafond « avis dans le mauvais camp sur un motif du résumé » s'applique-t-il quand l'étiquette ne
  change pas ? Les lectures divergent (passe 6). La grille ne tranche pas ; non changée.
- Contrôle « toutes les personnes » : il exige que tous soient cités, et la vérification des renvois
  remplace alors un vrai « toutes » (motif unanime) par un sous-compte. À revoir pour les motifs unanimes.

### Bilan et allègement (15/10/2026, à la demande d'Arnaud)

Sept passes pour aucun gain prouvé de la note : moyennes de 3,25 à 3,67, dans le bruit de l'évaluateur ;
langue à 3,5 de bout en bout. Les passes 4 à 7 (de l'ordre de 20 millions de jetons de sous-agents, estimation)
ont corrigé chaque fois le cas signalé sans lever le plafond, parce que la cause était en amont (le découpage).

Retiré de la méthode « consultation », faute d'effet mesuré : la vérification des unanimités et son filtre
lexical (trois passes sans un seul déplacement, pour une demande de 110 Ko), la relecture des tons des motifs
du résumé (trois idées corrigées, aucun plafond levé), et deux règles de synthèse (phrase-chapeau, une phrase
par camp : la langue n'a pas bougé). Gardé : ce qui a corrigé un défaut observé et ne coûte presque rien
(seconde relecture des arrivées, règles de ton par rapport à l'objet, contrôles du résumé, phrase du code
sur ce qui divise, règle contre « des personnes ») et tous les correctifs du code.

Leçon, devenue règle dans `CLAUDE.md` : trois passes au plus pour prouver une amélioration, deux lectures
dès la première ; sans gain net, on s'arrête, on remonte en amont et on retire ce qu'on a ajouté.

### Passes 8 et 9 (16/10/2026, à la demande d'Arnaud : « optimiser au plus intelligent, trois itérations au plus »)

**Diagnostic chiffré avant de coder.** Sur le cache de la passe 7, le moteur avait rendu 188 éloges au
découpage ; le code n'en gardait que 151. Le dédoublonnage (« deux idées qui se recouvrent : on garde la
plus longue ») retirait 31 éloges, dont 24 contenus dans une critique plus longue qui portait sur un autre
objet. Les motifs touchés étaient ceux du résumé (bilan d'ensemble, enseignants, école publique) : la cause
désignée par les lectures de la passe 7, enfin mesurée. Plan validé par le `methodologue` avant de coder.

**Passe 8** (code commun : 0 ; méthode « consultation » : 2 apports).
- Dédoublonnage : un éloge et une critique qui se recouvrent restent deux avis, sauf citations presque
  identiques (la courte couvre 80 % de la longue). 25 éloges revenus ; 4 paires tombent dans un même motif,
  toutes de vrais avis partagés (vérifié à la relecture). Le résumé passe de 34 à 47 jugements positifs
  d'ensemble.
- Livre de codes : à la relecture, le moteur écrit pour chaque motif, avant de juger ses idées, ce qui y
  compte comme favorable, défavorable ou hors camp (pratique du livre de codes en analyse qualitative :
  définition, critères d'inclusion et d'exclusion). La définition suit le motif (synthèse, vérification des
  renvois) et s'affiche sous son titre : une erreur de camp devient vérifiable contre une ligne écrite,
  au lieu de dépendre du cadrage implicite de chaque lecteur.
- Résultat : 3 et 3 (plafond), moyennes 3,25 et 3,25. Les deux nouveautés font ce qu'elles visaient
  (éloges revenus, erreurs démontrables), mais le plafond revient par la passe 4 : les éloges du privé
  forment un motif « unanime » pendant que ses critiques restent dans « École publique face au privé ».
  Les définitions de ces motifs voisins se chevauchent.

**Passe 9** (méthode « consultation » : 3 apports).
- La question « un ou deux objets ? » (déjà posée aux titres en « et ») l'est aussi aux titres « X face à
  Y » et aux motifs aux avis partagés d'au moins 8 personnes : deux séparations (école publique /
  enseignement privé ; gratuité de l'école / frais d'études).
- Réconciliation du livre de codes : après la relecture, toutes les définitions sont relues d'un bloc (une
  demande) ; le moteur propose des fusions et des règles de partage entre motifs voisins (8 paires au plus) ;
  le code fusionne et fait relire chaque paire ensemble avec sa règle. Ici 1 fusion, 7 paires, 22 idées
  déplacées ou recodées.
- L'exemple « que certaines nuancent ailleurs (notamment P…) » du résumé est pris parmi les personnes qui
  nuancent vraiment.
- Résultat : 3 et 3 (plafond), moyennes 3,42 et 3,17. Le privé (13 sur 15) et la gratuité sont corrigés,
  la traçabilité monte à 4, aucune phrase retirée, aucune citation déformée ; mais le même mécanisme
  réapparaît sur d'autres paires (école publique / expérience globale, qualité / contrôle des enseignants,
  proximité / carte scolaire), que la réconciliation n'avait pas retenues parmi ses 8 paires.

**Langue** (`plume`) : 3,5 aux deux passes. Ses défauts venaient surtout de phrases injectées par le code,
corrigées à la source : livre de codes en phrase lisible (« Compte comme positif : … »), « notamment »
limité à trois exemples et jamais devant une liste complète, une seule phrase pour les propositions
contraires, chiffre nu à côté du mot de l'échelle (« 29 sur 35 »), attaques variées demandées.

**Conclusion (16/10).** Deux itérations sur les trois permises, sans gain de note : 3/5 plafonné à chaque
passe depuis la passe 1, moyennes de 3,17 à 3,67 dans le bruit de l'évaluateur. Les apports ont corrigé
chaque fois le défaut visé et rendu le rapport plus vérifiable ; ils n'ont pas levé le plafond parce que
celui-ci se joue sur une poignée d'idées limites entre motifs voisins, et qu'un corpus de 942 idées en
74 motifs en contient toujours quelques-unes. Trois leviers restent, tous de méthode, donc à trancher par
Arnaud :
1. **Codage en double** (proposé par les deux lectures) : une idée qui satisfait la définition de deux
   motifs compte dans les deux (la cause chez l'un, l'effet chez l'autre). Aujourd'hui une idée n'a qu'un
   motif (principe « une idée, un motif » de la méthode des idées atomiques).
2. **Balayage par définition** : pour chaque motif d'au moins 8 personnes, chercher dans les autres motifs
   les idées qui remplissent sa définition. Coûteux (une demande par motif, avec candidats filtrés) ;
   c'est la version avec définitions de la vérification des unanimités retirée à la passe 7.
3. **Seuil d'entrée au résumé** : un motif de 4 avis (« Proximité de l'école ») n'a rien à y faire ;
   exiger 8 avis au moins pour les lignes de forces et de freins.
Et une question sur la grille elle-même : le plafond est binaire ; deux lectures donnent 3,42 et 3,17 de
moyenne pour la même passe. La note « réelle » de la méthode sur ce corpus est entre 3 et 3,5.

**Décisions d'Arnaud (16/10, soir).** Pas de seuil d'entrée au résumé (les échantillons ne sont pas toujours
grands ; un petit motif y a sa place avec son chiffre). Les apports des passes 8 et 9 sont gardés : la règle des
trois passes protège les jetons, pas le résultat. Le codage en double devient une **option du chercheur**,
désactivée par défaut (« Une idée peut compter dans deux motifs », réglages avancés) : à la relecture et à la
réconciliation, une idée qui satisfait la définition de deux motifs est copiée dans le second avec le ton jugé
par rapport à lui ; l'original ne bouge pas, chaque motif compte des personnes, deux motifs au plus par idée,
la citation figure sous les deux titres avec « aussi dans ». À essayer sur l'école (passe 10) quand Arnaud le
demandera : environ 4 millions de jetons de sous-agents.

### Passes 10 et 11 (16-17/10/2026) : le codage en double

**Passe 10** (option `multiCoding`, cache de la passe 9) : 20 copies, 8 paires, 3 fusions. Notes 3 et 3
(plafond ; moyennes 3,08 et 3,0), langue 4 (meilleure note à ce jour). Invalidée : après la relecture des
paires, le code renumérote les motifs par taille, puis appliquait les fusions proposées par le moteur sur les
nouveaux numéros. Le handicap (20 personnes, unanime) a fondu dans « Démarches d'inscription », l'encadrement
administratif dans « Qualité des enseignants » ; le Résumé s'en trouvait faux sur deux lignes. Une copie est
aussi revenue dans le motif de son original (déplacée par une paire) : la citation s'affichait deux fois.
Les deux lectures ont trouvé le bug par la même preuve (le motif de la raison d'une fusion n'était pas celui
de son titre) : la relecture indépendante a servi de test d'intégration.

**Corrections de code (communes).** Les fusions se retrouvent par le titre capturé à la demande ; une copie
qui finit chez son original disparaît ; une copie qui n'ajouterait qu'une personne déjà comptée dans ce camp
du motif cible n'est pas faite ; avec l'option, les titres des motifs cibles portent leur définition dans la
relecture (le moteur ne pouvait pas savoir si l'autre définition réclamait l'idée). Trois tests de bout en
bout : fusion sous renumérotation, copie ramenée chez elle, copie redondante.

**Passe 11** (rejeu depuis le cache ; les consignes de relecture ayant changé, relectures, réconciliation et
tout l'aval ont été rejoués : environ 5 millions de jetons de sous-agents). 30 copies (24 à 26 justes selon
la lecture, 2 dans le mauvais camp, 3 redondantes), 6 paires, 2 fusions justes. Notes 3 et 3 (plafond ;
moyennes 3,5 et 3,17), langue 3,5. Corrigés par rapport aux passes 8 à 10 : l'administration a quitté
« Qualité des enseignants » (avis partagés justifiés), le handicap a son motif et sa ligne au Résumé (18 sur
18), les fusions touchent les bons motifs. Le plafond tient à deux frontières qu'aucune paire relue ne
couvrait : les éloges de l'école publique restés dans « Expérience globale » (8 idées ; « École publique face
au privé » passerait de « bloque » à « divise »), et les plaintes d'éloignement restées dans Handicap, Carte
scolaire ou Écoles rurales (« Proximité » passerait de « divise » à « bloque »). Le codage en double répare
les paires qu'il voit ; il ne voit que celles que la réconciliation a retenues parmi ses 8.

**Langue** : 4 puis 3,5. Les textes injectés par le code ont été corrigés à la source (ligne Méthode,
« aussi dans » sous les deux exemplaires, « personnes » dans les lignes de faits, fusions annoncées une fois,
comptes de personnes en chiffres au milieu des phrases). Reste au moteur : la base « de ceux qui en parlent »
répétée à chaque phrase du Résumé (règles 7 et 10 de la consigne `global`, et « fragile » exigé par le
contrôle des renvois), des phrases-inventaires de plus de 60 mots (4), « subir » dans les définitions.

**Conclusion (17/10).** Le cycle de trois passes (8, 9, 11 ; la 10 ne compte pas) est clos sans gain de note :
3/5 plafonné, moyennes 3,17 à 3,5. Chaque passe a corrigé le défaut visé et le rapport est plus vérifiable
(définitions, copies visibles, fusions justes) ; le plafond se déplace vers la frontière voisine que la passe
ne regardait pas. Le levier suivant est le **balayage par définition** (levier 2 de la liste du 16/10) : pour
chaque motif du Résumé, chercher dans les autres motifs les idées qui remplissent sa définition et les copier
(ou les déplacer). C'est une décision de méthode et un coût (une demande par motif du Résumé, une quinzaine,
avec tous les libellés d'idées) : soumise à Arnaud. Sans elle, la méthode « consultation » sur ce corpus vaut
3 à 3,5 selon la lecture, et l'étude reste non publiée (seuil 3,5 sans plafond).

### Passe 12 (17/10/2026) : le balayage par définition

**Le levier.** Proposé le 16/10 et accepté par Arnaud le 17/10 : faire entrer la posture du correcteur dans
la chaîne. Après la réconciliation, chaque motif promis au résumé (six premiers de chaque liste, plus tout
motif listé d'au moins 12 avis, 21 au plus) reçoit sa définition, la taille de ses deux camps et tous les avis
rangés ailleurs, par lots de trois motifs (7 demandes d'environ 60 000 jetons). Le code ne garde que le ton
d'une idée d'un motif balayé, et l'entrée d'un avis rangé ailleurs dans un motif balayé (copie avec le codage
en double, sinon déplacement) ; une proposition ou une question garde sa catégorie.

**Premier essai, écarté avant les synthèses par un contrôle par script.** « Proximité » (8 avis) n'était pas
balayée, sortie des 21 par un tri par taille ; 78 copies, presque toutes du camp déjà majoritaire ; aucun
éloge du public ajouté. Corrigé : les motifs montrés par les listes passent d'abord ; la consigne donne la
taille des deux camps et fait chercher d'abord le plus petit. Ce contrôle a évité de payer l'aval sur un état
faux.

**Résultat** (88 copies, 3 déplacements, 3 tons corrigés). Notes 3 et 3 (plafond ; moyennes 3,33 et 3,33),
langue 3,5. Les quatre défauts qui plafonnaient les passes 8 à 11 sont levés aux deux lectures : les éloges
de l'école publique comptent dans « École publique face au privé » (10 contre 24), les plaintes d'éloignement
dans « Proximité » (qui quitte « Ce qui divise »), « Enseignement privé » n'est plus dit unanime (12 sur 14),
le regret de la carte scolaire compte en sa faveur. Sur les 88 copies relues une à une, 75 à 77 sont justes.

**Le nouveau plafond vient du balayage lui-même.** La règle « cherche d'abord le camp le moins nombreux »
pousse à remplir un camp vide : « Gratuité de l'école » reçoit cinq critiques du coût des études supérieures
et passe d'unanime à « divise », ce qui défait la séparation de la passe 9 ; « Accès aux services
administratifs » et « Écoles rurales » deviennent « divise » par des copies à sens unique. Le premier essai,
sans cette règle, gonflait le camp majoritaire. Les deux biais sont symétriques : le moteur ne sait pas
doser seul.

**Levier suivant, à soumettre à Arnaud.** Une relecture des seules copies qui changent une étiquette du
résumé (ici 7 motifs, une demande ou deux) : le motif avant et après, les copies en cause, la question
« la définition les réclame-t-elle sans doute possible ? ». C'est le geste du correcteur sur le résidu, au
coût le plus bas, mais l'aval (synthèses, résumé, appuis) est à rejouer : environ 5 millions de jetons pour
une passe 13. Deux points relevés en passant : « fragile » ne s'applique jamais à « avis partagés »
(`isFragile`), ce que la règle « une voix change l'étiquette » couvrirait pourtant (décision commune à toutes
les méthodes, à roder d'abord sur les caches ÉcoSol) ; la consigne de synthèse demande le nombre exact de
personnes et interdit de recopier les chiffres de "facts", contradiction signalée par plusieurs lots du
moteur.

**Décision d'Arnaud (17/10) : pas de passe 13.** La note devient un repère relatif sur 10 (`docs/NOTATION.md`) :
sur l'école, la passe 12 garde ses notes sur 5 (moyennes 3,33 aux deux lectures, langue 3,5, avec 3 étiquettes du
résumé jugées fausses) jusqu'à une lecture sur 10.
L'étude est publiée telle quelle, avec ses limites, et les étiquettes qui dépendent d'avis comptés dans deux
motifs sont marquées « à vérifier » par le code. La méthode, étape par étape : `docs/METHODE.md`.

Gardé dans la méthode « consultation » (décision d'Arnaud) : le
dédoublonnage corrigé (une erreur du code, pas une règle de plus), le livre de codes (une demande, zéro
étape de plus, transparence jugée réelle par les deux lectures), la réconciliation (une demande plus une
par paire), les séparations. Rien n'a changé pour la référence ni pour les autres méthodes : seuls les
filets communs ont bougé (« d'une X à l'autre » n'est plus un compte ; « notamment » : trois exemples au
plus, et un compte écrit prime sur « tous » ; réponses identiques entre personnes signalées dans la
Méthode), rodés sur le cache de l'école, à rejouer sur les caches ÉcoSol avant la prochaine certification.


### Passe 13 (17/10/2026) : passe finale, notée sur 10

**Demande d'Arnaud.** Une seule passe, avec tout ce qui est prêt, notée directement sur 10 ; on garde la note
obtenue. Le code d'analyse n'a pas changé depuis la passe 12 : rejouée sur le commit d09a4cb, la passe 13
reprend toutes ses réponses du cache (aucune demande nouvelle au moteur) et donne les mêmes idées, motifs et
thèmes. C'est aussi la preuve de reproductibilité : mêmes données, même configuration, même résultat.

**Notes** (lectures indépendantes, sans voir les notations antérieures) : méthode **7/10** aux deux lectures
(critères 7,5 · 7,5 · 6,5 · 7 · 7,5 · 7 et moyenne 7,0), **2 erreurs du résumé**, structure saine (9 motifs
sur 73 à une personne, aucun fourre-tout) ; langue **6,5/10**. Relecture humaine estimée : 1 h 30 à 3 h.

**Les deux erreurs, trouvées par les deux lectures.** « Réforme du système éducatif » : le résumé dit que
20 personnes critiquent la réforme, alors que 14 jugent le système figé et que certaines réclament une
réforme ; la définition met dans le même camp le refus et la demande. « École publique face au privé » : le
camp négatif réunit des critiques du public et des critiques du privé. Les deux portent déjà « à vérifier ».
Signalé aussi : « Accès aux services administratifs » est partagé par des copies à sens unique.

**Ce que les lectures disent des mentions de doute, et ce qui a changé dans l'affichage (sans rejeu).**
« Fragile » était posé sur chaque « unanime » (29 motifs sur 47) : une voix de moins en fait une « large
majorité », la conclusion tient ; il n'y est plus affiché (`fragileShown`), et il apparaît désormais dans
toutes les listes du résumé, pas seulement « Ce qui divise ». « À vérifier » n'apparaissait que dans les
listes : une ligne du code le rappelle sous le résumé. Un réglage qui retirait « à vérifier » quand
l'étiquette serait plus nette sans les copies a été essayé puis retiré : il effaçait la mention sur
« École publique face au privé », l'une des deux erreurs. La note porte sur le rapport d'avant ces retouches
(`run-opus-13/rapport-note.md`).

**Leviers relevés, non joués (ils changent ce qu'on envoie au moteur, donc une nouvelle passe).**
- Langue : la règle 7 du résumé impose « de ceux qui en parlent » à chaque ligne (8 fois en 9 phrases) ;
  poser la base une fois par paragraphe. `highlightLine` écrit « large majorité (fragile) », que le moteur
  recopie en incise ; et « fragile » y suit encore le calcul brut, « unanime » compris.
- Méthode : une définition de motif ne doit pas réunir dans un camp deux positions opposées (refuser une
  réforme et en réclamer une) ; le codage en double doit rester symétrique (copier les inscriptions ratées
  comme les réussies).

### Passes 15 à 16c — synthèses des motifs (17/10/2026)

| Passe | Changement | `methodologue` | Erreurs du résumé | `plume` (motifs) |
|---|---|---|---|---|
| 14b | référence publiée | 7 · 7 | 2 | 6 |
| 15 | plus de « de ceux qui en parlent », l'échelle avec son nombre | 7 · 7 | 2 | 7 |
| 16b | exemples fictifs ; chaque camp compté ; contrôle de couverture des camps (80 %) | 7 · 7,5 | 1 | 7 |
| 16c | fausses alertes des comptes corrigées (16 : 5 phrases justes retirées ; 16c : 0) | — | 1 | — |

Gardé : tout ce qui précède (chacun a corrigé un défaut observé). L'erreur restante (« école publique face au
privé ») vient de la définition du motif, qui réunit dans un camp « juger le public moins bon » et « dénoncer
l'inégalité entre les deux » : décision de méthode soumise à Arnaud. Restent pour la langue : « qui donnent un
avis » répété (46 fois), des passifs « par N personnes », « 18 sur 18 » écrit par `highlightLine`.
