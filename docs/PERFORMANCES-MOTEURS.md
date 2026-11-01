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
| Gemini 3.1 Flash-Lite | gratuit | **4** · 9 — **4,5** · 8 | environ 4 h | environ 7 min | 0 | 89, relances comprises | 471 000 / 65 000 | 17 000 / 3 400 |
| Ministral 14B | gratuit | **4** · 9 — **3,5** · 10 | 6 à 10 h | 12,5 min | 0 | 66 | 276 000 / 86 000 | non relevé |

Sonnet a tourné avec l'effort moyen demandé (`output_config`), sans preuve que l'accès compatible OpenAI le respecte
(`reasoning_effort` y est ignoré ; un essai sur une demande ne tranche pas). Haiku et Opus sont à leur réglage par défaut, moyen.
Mistral Large 4 : la durée mesure surtout le plafond de l'offre gratuite (20 000 jetons par minute), avec 55 refus de débit.
Non testés : Mistral Small et Medium (paiement à l'usage exigé), OpenAI.

## Modèles gratuits plus forts que Flash-Lite (1/11/2026)

Essayés avec une clé gratuite : Gemini 3.5, 3.6, 3.7 et 3 Flash répondent à un appel. Sur 3.5 Flash, la synthèse s'arrête à **20
demandes par jour** (14 participants sur 20) ; AI Studio donnait la même limite à 3.6, 3.7 et 3.8 Flash le 13/10. Une synthèse en demande
une soixantaine : environ quatre jours, inutilisable ; ces modèles ne sont donc pas notés. Gemini 3.8 Flash n'a donné que 5
réponses en plus d'un quart d'heure, avec des délais dépassés. Gemma 4 31B : erreurs 500 et 503 à répétition, 3 réponses, écarté. Gemini 4 Argon, 3.1 Pro et Omni Flash : pas d'offre
gratuite. **Gemini 3.5 Flash-Lite reste le meilleur modèle gratuit utilisable.**

## Contexte nécessaire

Pour 20 participants, la plus grosse demande prend environ 70 000 jetons, réponse comprise (Haiku). Pour 378, environ 107 000
(Sonnet, balayage). Il faut donc **128 000 jetons de contexte au minimum, 200 000 pour être tranquille** ; 1 million n'est pas nécessaire.
La taille dépend des lots, pas du corpus entier.

## Grand débat, école, 378 réponses (1/11/2026)

Avec les réglages par défaut de l'application (codage en double) et la lecture à l'aveugle.

| Moteur | Accès | Note · erreurs (2 lectures) | Relecture humaine | Durée | Coût estimé | Demandes | Plus grosse demande (entrée / sortie) |
|---|---|---|---|---|---|---|---|
| Claude Opus 5.5 | API payante | **8** · 2 — **7,5** · 1 | 1 h 30 à 2 h 30 | 29,5 min | 19,12 $ | 457 | 80 000 / 18 000 |
| Claude Sonnet 5.5 | API payante | **7,5** · 2 — **7** · 3 | 1 h 30 à 3 h | 28,5 min | 10,35 $ | 467 | 82 000 / 25 000 |
| Claude Haiku 5.5 | API payante | **6,5** · 7 — **6,5** · 5 | 3 à 4 h | environ 1 h 10 | 1,85 $ | 533 | 85 000 / 45 000 |
| Gemini 3.5 Flash-Lite | gratuit | non notée | | deux jours prévus | 0 | 436, inachevé | 1 600 / 600 à ce stade |

- **Mêmes conditions pour les trois Claude** : API, même code, codage en double, lecture à l'aveugle en lot. Sur un gros corpus, Opus prend un demi-point sur Sonnet pour presque deux
  fois le prix ; Haiku fait deux à trois fois plus d'erreurs. Sonnet reste recommandé, sauf pour qui veut le meilleur résultat quel qu'en soit le prix.
- **Haiku** : durée cumulée, avec deux interruptions (arrêt demandé, puis limite de dépenses du compte). Plus de thèmes que les autres : 98 contre 62 à 75.
- **Limite de dépenses** : l'API s'est coupée à environ 19,75 $ (« You have reached your specified API usage limits »), rouverte par Arnaud quelques minutes après le relèvement.
- **Lectures précédentes** : Sonnet avait 7 et 7, et la version Opus faite sur l'abonnement 7,5 et 7,5. Les premières étaient moins indépendantes (bloc-notes partagé) : les lectures
  ci-dessus, chacune dans son dossier, font foi.
- **Gemini 3.5 Flash-Lite gratuit** : 292 participants découpés sur 378 en 1 h 40, soit 436 demandes, puis arrêt au **quota de 500 demandes par jour** (par projet et par
  modèle, confirmé par Google). Environ 1,5 demande par personne au découpage : deux jours pour une telle étude, reprise sans perte vers 9 h à Paris.
  Repère : **150 à 200 participants par jour**.

**Réserve sur ÉcoSol** : ses synthèses ont tourné sans le codage en double, activé par défaut dans l'application. Les notes de 20 participants mesurent donc un réglage voisin ;
celles du Grand débat, le réglage réel. Le pont l'active avec `--multi-coding`.

Coûts calculés sur les tarifs affichés, sans la mise en cache des demandes (l'accès compatible OpenAI ne la permet pas).
Durée en parallèle à 4 demandes, au débit conseillé par le préréglage.

Les citations sont exactes chez tous les moteurs : ce qui les sépare est le rangement des idées, donc la justesse des
conclusions. Un évaluateur Opus peut garder un goût pour un style proche du sien : le compte d'erreurs, vérifiable, est
l'indicateur le plus solide.
