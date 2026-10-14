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
