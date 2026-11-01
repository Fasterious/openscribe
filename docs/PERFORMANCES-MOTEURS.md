# Performances des moteurs d'IA

Le relevé de chaque essai, à relire d'un coup d'œil : qualité, durée, coût, contexte nécessaire. Protocole dans
`docs/NOTATION.md` (« Lecture à l'aveugle »). Une note est un repère relatif, pas une vérité.

## ÉcoSol, 20 participants, méthode commune (1/11/2026)

| Moteur | Accès | Note · erreurs (2 lectures) | Relecture humaine | Durée | Coût estimé | Demandes | Jetons envoyés / écrits | Plus grosse demande (entrée / sortie) |
|---|---|---|---|---|---|---|---|---|
| **Claude Sonnet 5.5** | API payante | **7,5** · 1 — **7,5** · 2 | 1 h à 1 h 30 | 12,5 min | 2,96 $ | 54 | 427 000 / 211 000 | 27 000 / 21 000 |
| Claude Opus 5.5 | API payante | **7,5** · 2 — **7** · 3 | 1 h 30 | 12 min | 4,92 $ | 53 | 441 000 / 158 000 | 27 000 / 13 000 |
| Claude Haiku 5.5 | API payante | **6,5** · 2 — **6,5** · 3 | 2 h à 2 h 30 | 19 min | 0,35 $ | 58 | 474 000 / 608 000 | 30 000 / 41 000 |
| Mistral Large 4 | gratuit, bridé | **6** · 7 — **5,5** · 7 | 2 h à 3 h | environ 1 h 20 | 0 (1,20 $ au tarif payant) | 47 | 242 000 / 495 000 | 17 000 / 19 000 |
| **Gemini 3.5 Flash-Lite** | gratuit | **5,5** · 4 — **5,5** · 5 | 3 h 30 à 4 h | 5,5 min | 0 | 64 | 262 000 / 51 000 | 17 000 / 4 400 |
| Ministral 14B | gratuit | **4** · 9 — **3,5** · 10 | 6 à 10 h | 12,5 min | 0 | 66 | 276 000 / 86 000 | non relevé |

Sonnet a tourné avec l'effort moyen demandé (`output_config`), sans preuve que l'accès compatible OpenAI le respecte
(`reasoning_effort` y est ignoré ; un essai sur une demande ne tranche pas). Haiku et Opus sont à leur réglage par défaut, moyen.
Mistral Large 4 : la durée mesure surtout le plafond de l'offre gratuite (20 000 jetons par minute), avec 55 refus de débit.
Non testés : Mistral Small et Medium (paiement à l'usage exigé), OpenAI.

## Contexte nécessaire

Pour 20 participants, la plus grosse demande prend environ 70 000 jetons, réponse comprise (Haiku). Un modèle à 128 000 jetons
de contexte suffit largement ; 1 million n'est pas nécessaire. La taille dépend des lots, pas du corpus entier : sur l'étude
école (378 réponses), les plus grosses demandes montent vers 60 000 jetons d'entrée (balayage), donc viser 128 000 à 200 000.

## Grand débat, école, 378 réponses : tenue sur un gros corpus (1/11/2026)

Gemini 3.5 Flash-Lite gratuit, méthode commune : 292 participants découpés sur 378 en 1 h 40, soit 436 demandes, puis arrêt au
**quota de 500 demandes par jour** (par projet et par modèle, confirmé par Google le 1/11). Le découpage demande environ 1,5
demande par personne : une telle étude s'étale sur **deux jours** en gratuit, reprise sans perte le lendemain matin (vers 9 h à Paris).
Avant correction, un arrêt tombait sur deux réponses invalides de suite (120 participants) ; le quota du jour s'affichait comme une
simple surcharge. Repère pratique : **150 à 200 participants par jour** sur l'offre gratuite de Gemini. Non noté : l'étude n'est pas allée au bout.

Coûts calculés sur les tarifs affichés, sans la mise en cache des demandes (l'accès compatible OpenAI ne la permet pas).
Durée en parallèle à 4 demandes, au débit conseillé par le préréglage.

Les citations sont exactes chez tous les moteurs : ce qui les sépare est le rangement des idées, donc la justesse des
conclusions. Un évaluateur Opus peut garder un goût pour un style proche du sien : le compte d'erreurs, vérifiable, est
l'indicateur le plus solide.
