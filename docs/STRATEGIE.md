# OpenScribe — Stratégie

> Décisions de cadrage, août 2026. Ce document existe pour que ces arbitrages ne
> vivent pas uniquement dans une conversation. Il complète le [BLUEPRINT](../BLUEPRINT.md),
> qui décrit *ce que fait* le produit ; celui-ci décrit *où il va et pourquoi*.

---

## 1. Thèse

> **OpenScribe transforme des centaines de contributions humaines en une décision
> compréhensible, traçable et contestable.**

- **Wedge** — l'analyse de réponses ouvertes. C'est la première raison de venir.
- **Horizon** — la délibération collective : écouter → comprendre → décider.
- **Terrain** — la démocratie est un terrain d'expérimentation, pas le marché initial.
  Les organisations qui doivent décider ensemble (associations, collectifs,
  équipes, institutions) viennent avant les institutions politiques.

Les quatre modules ne sont pas quatre produits ; ce sont les étapes d'un même
cycle. Transcription et Workshop **collectent**, l'Analyse CSV **comprend**,
Persona **représente**. La brique manquante est **décider** (consensus,
compromis, priorisation) — c'est la direction, pas un module de plus.

---

## 2. Cinq principes

Ils sont à la fois la ligne de conduite technique et l'argument commercial.

1. **L'IA ne décide jamais.** Les comptages sont calculés en code, pas affirmés
   par un modèle. C'est déjà le cas dans le pipeline CSV
   (`app/api/csv-analysis/cluster/route.ts`, reconstruction de traçabilité).
2. **Toute conclusion est traçable** jusqu'aux contributions humaines qui l'ont
   produite. Un chiffre non cliquable est un chiffre non vérifiable.
3. **Les minorités restent visibles.** Consensus ≠ majorité. Une position tenue
   par peu de personnes, mais tenue de façon constante, doit apparaître.
4. **Le participant ne paie jamais** et n'a pas besoin de compte.
5. **Le cœur est auditable.** On facture l'échelle et l'exploitation, jamais le
   mécanisme par lequel un groupe comprend ce qu'il pense.

---

## 3. Modèle économique

**Hybride.** Ni BYOK strict, ni tout gratuit.

| Qui | Ce qu'il obtient | Prix |
| --- | --- | --- |
| Participant | Contribuer à une consultation | 0 €, sans compte |
| Découverte | Palier gratuit sur la clé de l'hébergeur, sous quota mesuré | 0 € |
| BYOK | Sa propre clé Mistral / Gemini, sans limite d'usage | 0 € |
| Organisation | Volume, espaces privés, accompagnement | payant |
| Prestation | Cadrage + analyse + restitution d'une consultation | 500–1 500 € |

Le BYOK n'est pas abandonné : il devient le **mode illimité** et l'argument de
confiance (« vos clés, vos données »), au lieu d'être la seule porte d'entrée.

**Licence : AGPL-3.0 + double licence commerciale.** Copyright détenu en propre,
donc relicenciable. L'AGPL couvre l'usage réseau. Toute contribution externe
exigera un CLA ou un DCO — sans quoi la double licence devient impossible dès la
première PR fusionnée.

---

## 4. Objectif à trois mois (fin novembre 2026)

> **Une consultation réelle, publiée sur une URL openscribe.fr, citable, et qui
> sert de preuve commerciale.**

La seule preuve d'usage réelle à ce jour est confidentielle (consultation
cliente). Il n'y a donc aucun cas publiable — et sans cas publiable, ni boucle de
notoriété, ni conversation commerciale qui commence par « voici ce que ça donne ».

**La réponse n'est pas de prospecter, c'est de fabriquer la vitrine** : lancer sa
propre consultation, sur sa propre question, auprès de son réseau. Collecte par
formulaire, 80–200 réponses, consentement acquis par construction, publication du
résultat. La restitution *est* le support marketing, et le pied de page est la
boucle d'acquisition.

Le premier client payant se déduit de la vitrine, pas l'inverse.

---

## 5. Feuille de route

| Lot | Objectif | Fenêtre |
| --- | --- | --- |
| **0** | Ne rien perdre, ne rien exposer : gitignore, commits, RLS, endpoints | fait / en cours |
| **1** | De quoi publier : métriques consensus-divergence-minorités, lien public `/r/<token>`, livrable propre | sept. 2026 |
| **Vitrine** | La consultation publique citable | fin sept. → oct. |
| **2** | Enlever les portes : compteur d'usage, clé serveur + quota, magic link, robustesse du pipeline | oct. |
| **3** | Ouvrir : AGPL, dépôt public, récit civique | nov. → janv. 2027 |
| après | Liaison transcription → analyse, brique « décider » | 2027 |

Le compteur d'usage (Lot 2) doit atterrir **avant** l'analyse de la vitrine :
c'est elle qui donnera le coût réel d'une analyse à 150 participants, donc le
seul chiffre légitime pour calibrer le palier gratuit.

Calendrier de fond : présidentielle des **18 avril et 2 mai 2027**. Les
organisations arbitrent leurs outils à l'automne 2026 – janvier 2027, ce qui
place la fenêtre de crédibilité bien avant le scrutin.

---

## 6. Ce qui est gelé

- **Persona V2** (`lib/persona-v2/`) : c'est le code le plus rigoureux du dépôt,
  et la pièce la plus défendable intellectuellement. Il est committé, accessible,
  étiqueté bêta — et l'investissement s'arrête là jusqu'à ce que le wedge soit
  prouvé. V1 reste le moteur par défaut tant que V2 ne persiste pas ses résultats.
- **Liaison transcription → analyse** : la connexion qui transformerait « quatre
  applications » en « un pipeline ». Forte, mais elle ne sert pas l'objectif des
  trois mois.

---

## Voir aussi

- [Backlog complet](./BACKLOG.md) — les 49 cartes, par lot, avec propriétaire
- [Board Trello Open Scribe](https://trello.com/b/ZyWDMYVz/open-scribe) — privé ; généré depuis `scripts/trello-backlog.mjs`
- [Sécurité — RLS et surfaces publiques](./SECURITE-RLS.md)
- [BLUEPRINT — vision, architecture, état du code](../BLUEPRINT.md)
- [Thèses Persona V1/V2/V3](./persona/)
