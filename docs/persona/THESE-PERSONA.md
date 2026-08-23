# Personas — Note de conception (design rationale)

> Document de cadrage **avant code**. Objectif : reposer les bases de la découverte
> automatique de personas dans OpenScribe, en s'appuyant sur l'acquis (`lib/persona/clustering.ts`)
> mais sans s'y limiter, et en rendant *mesurable* la notion de « meilleur ».
>
> Format : squelette IMRaD allégé (Introduction → Méthode → Validation → Discussion),
> encarts « prior art » légers, orienté décision. Ce n'est **pas** un article scientifique
> ni un état de l'art systématique — c'est une thèse de conception traçable.
>
> Statut : *proposition*, à amender. Rien n'est implémenté à ce stade.
> Source de réflexion : audio de réflexion produit (juin 2026) + lecture du code `main`.

---

## 0. TL;DR (pour décider vite)

- **Le bon nom du problème** : *clustering en sous-espaces (subspace / projected clustering)
  de données ordinales (Likert), pour découverte de personas*, avec sélection de variables
  par cluster, robustesse au bruit, et **droit d'exclure** des répondants. Voisins utiles :
  biclustering, modèles à classes latentes (LCA), pattern mining.
- **L'acquis est bon** : `subspace-cohesion` est, sans le nommer, du *frequent-itemset mining*
  (Apriori) — exactement la bonne intuition « découvrir ensemble les variables discriminantes
  et les groupes ».
- **Le maillon manquant central** : il existe une **vérité terrain** (`persona-demo-50.csv`,
  colonne `Persona`, 5 groupes ×10) que le code **jette**. Donc rien ne mesure l'écart entre
  ce qui est trouvé et ce qui devrait l'être. **On ne peut pas repenser sans mesurer.**
- **Trois failles méthodologiques** identifiées dans l'existant : (1) la métrique de sélection
  de *k* (silhouette) travaille en *espace complet* et se bat contre la méthode subspace ;
  (2) aucune classe « non assigné » alors que l'audio réclame de pouvoir exclure ;
  (3) le compromis taille↔variables discriminantes est **figé** dans un score caché.
- **Proposition** : refondre autour d'un **objectif explicite** (compromis posé formellement),
  scorer les motifs par **surprise statistique** (et non support brut), ajouter une **classe
  bruit**, **normaliser les styles de réponse**, et **valider** sur vérité terrain + données
  synthétiques à structure connue.
- **Séquencement** : d'abord le harness de validation + baselines (peu coûteux, très informatif),
  puis le moteur, puis l'UX du compromis. Détails en §7.

---

## 1. Introduction — contexte & objectif

### 1.1 Pourquoi des personas

Un persona condense des centaines de répondants en quelques fiches actionnables : besoins,
problématiques, contexte d'usage. Si une fiche capture fidèlement un groupe, on peut prioriser
et concevoir un produit *pour ce groupe* plutôt que pour une moyenne qui ne correspond à
personne. La valeur n'est donc pas « faire des clusters » mais **faire des clusters dont on
peut faire quelque chose** : assez gros pour compter, assez nets pour se décrire en une fiche.

> **Cadrage B2C vs B2B (audio).** En B2B on se rabat souvent sur la fiche de poste (contexte
> métier homogène ⇒ réponses homogènes). C'est une facilité qui peut masquer des personas
> transverses. La méthode visée doit *découvrir* la structure, pas la présupposer — donc rester
> agnostique au domaine.

### 1.2 La tâche, concrètement

Entrée : un questionnaire quantitatif à échelles de Likert. Une matrice
**répondants × items**, valeurs ordinales (typiquement 1–5). On ne sait **pas à l'avance**
quelles questions sont discriminantes ni combien de groupes existent.

Sortie souhaitée : un petit ensemble de personas, **chacun défini par**
(a) un sous-ensemble de membres, (b) un sous-ensemble de **variables discriminantes** propres
au groupe, (c) une direction/profil sur ces variables — **plus** un éventuel ensemble de
répondants **inclassables**. C'est ce triplet (membres, variables, directions) qui fait la
fiche persona.

### 1.3 Le geste qu'on automatise

Historiquement, le researcher pose les réponses sur des échelles et repère « à l'œil » des
convergences de comportement sur certaines questions : *« tiens, ces gens répondent pareil sur
ces questions-là »*. Trop coûteux à la main au-delà de quelques dizaines de répondants. **On
automatise ce repérage de convergences locales** — pas un clustering géométrique générique.

---

## 2. Problème formel & état du code

### 2.1 Formalisation

Soit `X ∈ {1..L}^(n×p)` : `n` répondants, `p` items Likert (`L`=5 le plus souvent).
On cherche des personas `g = (M_g, S_g, d_g)` où `M_g ⊆ [n]` (membres),
`S_g ⊆ [p]` (variables discriminantes du groupe), `d_g` les directions attendues sur `S_g`,
plus un ensemble `U` (non assignés). C'est du **projected clustering** : chaque cluster vit
dans **son propre sous-espace** `S_g`, et tolère que les membres divergent sur les variables
hors `S_g`.

### 2.2 Le double compromis (le cœur de l'audio)

Pour un motif candidat (un sous-ensemble de variables + directions), il y a tension entre :

- **support** `|M_g|` — combien de répondants le satisfont → *actionabilité* ;
- **spécificité** `|S_g|` — combien de variables discriminantes → *richesse descriptive* ;
- **cohésion** — à quel point les membres convergent vraiment sur `S_g` ;

et, globalement, entre **couverture** (fraction de répondants assignés) et **pureté**
(ne pas forcer du bruit dans les groupes).

L'exemple de l'audio : « 20 personnes / 4 questions communes » vs « 2 personnes / 9 questions »
— le premier est *plus utile* parce qu'enlever une variable discriminante revient à renoncer
consciemment à un moyen de décrire la réalité, en échange de membres supplémentaires. **Ce
compromis ne doit pas être figé dans le code : il doit être posé comme objectif, et idéalement
exposé à l'utilisateur.**

### 2.3 Le piège probabiliste (audio 14:40–16:00)

L'audio l'intuitionne très bien : avec **peu** de questions, des petits groupes « identiques »
apparaissent **par hasard** ; avec **beaucoup** de questions, des accords exacts deviennent
**improbables**. Conséquence : **le support brut n'est pas comparable** d'un nombre de
questions à l'autre, ni d'une taille de groupe à l'autre. ⇒ Il faut juger un motif par sa
**surprise** (écart au hasard), pas par son support nu. C'est un levier central (voir §4.2).

### 2.4 Ce que fait le code aujourd'hui

Deux algorithmes consomment une **matrice de co-accord** : deux répondants « s'accordent » sur
un item si `|x_iq − x_jq| ≤ 1` (`clustering.ts:31`), et `totalMatrix[i][j]` compte les items
en accord.

| Brique | Fichier | Ce qu'elle fait | Lecture critique |
| --- | --- | --- | --- |
| `greedy-correlation` | `clustering.ts:62` | Seed (meilleure paire) + croissance sous seuil dynamique `moyenne+σ` (`:48`), tailles ≈ `n/k` (`:69`) | **Espace complet** (toutes les questions pèsent pareil) ⇒ sensible au bruit ; « effet de chaîne » (tolérance ±1 non transitive) ; tailles forcées |
| `subspace-cohesion` | `clustering.ts:460` | Apriori sur motifs `(var, direction)`, sélection de graines, raffinement « Pattern-KMeans » | **Bonne base.** Mais mining limité aux **extrêmes H/L** (`:303`) ⇒ MH/ML *inertes* ; score de graines figé `longueur²×membres×pénalité` (`:391`) |
| Sélection de *k* | `clustering.ts:199` | Silhouette, distance = `nQ − corrélation` (`:221`,`:232`) | **Distance en espace complet** ⇒ pénalise la structure subspace que l'autre algo cherche (voir §2.5) |
| Signatures | `clustering.ts:168` | Variables à variance intra ≤ 0.8 | Descriptif a posteriori, OK |
| Assignation | `clustering.ts:151`, `:483` | **Tout le monde** est forcé dans un groupe | **Pas de classe « non assigné »** — contredit la volonté d'exclure |

### 2.5 Trois failles à corriger en priorité

1. **La métrique se bat contre la méthode.** La silhouette mesure une distance *toutes
   variables confondues*. Or deux membres d'un même persona-subspace divergent justement sur
   les variables **non** pertinentes ⇒ leur distance complète gonfle ⇒ la silhouette
   *sous-récompense* les vrais clusters subspace et pousse vers des solutions « compactes » de
   type `greedy`. **Hypothèse forte : c'est une des raisons pour lesquelles les résultats
   divergent de la vérité terrain plantée.** À confirmer par le harness (§5).
2. **Pas de droit d'exclure.** L'audio insiste : l'algorithme doit pouvoir décider *quels
   répondants ne pas inclure* (réponses au hasard, comportements hors-groupe). Le code force
   l'assignation complète.
3. **Compromis caché.** Le score `longueur²×membres×pénalité` (`:391`) encode *un* arbitrage
   particulier, non documenté, non pilotable. L'audio demande explicitement : *« un seul algo,
   ou un outil pour jouer avec ces variables ? »*

### 2.6 L'actif gaspillé : la vérité terrain

`public/samples/persona-demo-50.csv` et le sample interne (`app/persona/page.tsx:16`)
contiennent une colonne `Persona` (🟣🔵🟡🟠🟢, **5 groupes de 10**) : c'est une **vérité
terrain construite à dessein**. Mais elle est **non numérique** ⇒ exclue automatiquement à la
sélection de colonnes (`app/persona/new/page.tsx:70`) ⇒ **jetée**. On a donc un jeu étiqueté
et **aucune mesure** de recouvrement. C'est le premier chantier (§5).

> ⚠️ Biais du jeu actuel : groupes **parfaitement équilibrés** (10×5). Cela **masque** la
> faiblesse « tailles inégales » et l'absence de bruit. Un bon jeu de validation doit être
> *déséquilibré et bruité* (voir §5.2).

---

## 3. Prior art (encarts légers — pour ne pas réinventer)

> But : ancrer le vocabulaire et **importer les bons outils**, pas rédiger une revue.

- **Subspace / projected clustering.** Familles de méthodes où chaque cluster est défini sur
  *son propre* sous-ensemble de dimensions (p. ex. PROCLUS, CLIQUE, DOC). Pertinent : nos
  personas sont par construction « locaux » à quelques questions. À retenir : *la sélection de
  variables est par cluster, pas globale*.
- **Biclustering.** Regroupe simultanément lignes (répondants) et colonnes (items). Conceptuellement
  proche de notre triplet (membres, variables, directions). À retenir : on cherche des
  **sous-matrices cohérentes**, pas des partitions globales.
- **Pattern / itemset mining (Apriori, motifs fermés/maximaux).** Déjà à l'œuvre dans
  `subspace-cohesion`. À retenir : (1) scorer par **surprise/lift** plutôt que support brut ;
  (2) utiliser les **motifs fermés/maximaux** pour éviter l'explosion combinatoire et la
  redondance.
- **Modèles à classes latentes / mélanges (LCA, latent class).** Modélisent l'appartenance comme
  **probabiliste** (un répondant a une *probabilité* d'appartenir à chaque classe), gèrent
  nativement l'incertitude et les outliers. À retenir : l'**appartenance douce** répond à la
  question « et si un répondant matche 0, 1 ou plusieurs personas ? ».
- **Styles de réponse (response styles) & ipsatisation.** Littérature psychométrique : acquiescence
  (tout valider), style extrême/médian, sur/sous-estimation. Correctif classique : **centrer
  par répondant** (retrancher sa moyenne) avant analyse. À retenir : neutralise le « sur/sous-
  estimateur » de l'audio (deux personnes réellement d'accord mais décalées se rapprochent).
- **Métriques de validation externe.** **Adjusted Rand Index (ARI)**, pureté, NMI : comparent une
  partition trouvée à une partition de référence, corrigées du hasard. À retenir : c'est avec ça
  qu'on mesure « est-ce que l'algo retrouve mes personas plantés ».
- **Stabilité / consensus clustering.** Un cluster « réel » réapparaît sous rééchantillonnage
  (bootstrap). À retenir : la **stabilité** est un critère de sélection de modèle *complémentaire*
  à la silhouette, et plus honnête sur « ce groupe existe-t-il vraiment ? ».

---

## 4. Méthode candidate (refonte autour d'un objectif explicite)

> On garde l'acquis Apriori, on corrige les failles, on **pose l'objectif**. Présenté en
> étapes ; chaque étape est indépendamment testable via le harness (§5).

### 4.1 Étape 0 — Normalisation (styles de réponse)

Proposer (et **comparer dans le harness**) :
- **Brut** (référence) ;
- **Centrage par répondant** (ipsatisation : `x'_iq = x_iq − moyenne_i`) pour neutraliser
  sur/sous-estimation et acquiescence ;
- éventuellement standardisation par item.

Décision *data-driven* : on garde la variante qui maximise le recouvrement ARI sur vérité
terrain, pas par dogme.

### 4.2 Étape 1 — Mining de motifs, scorés par surprise (≠ support brut)

Reprendre le mining de `subspace-cohesion`, mais :
- **inclure MH/ML** (directions modérées), pas seulement les extrêmes H/L — pour capturer les
  personas « modérés » aujourd'hui invisibles (`:303`) ;
- remplacer le score figé par un score de **surprise statistique**. Pour un motif `P` (ensemble
  de prédicats `(item, direction)`) satisfait par `o` répondants observés : sous un modèle nul
  d'indépendance, l'effectif attendu est `e = n · Π p_k` (où `p_k` = taux marginal de
  satisfaction du prédicat `k`). On juge `P` par son **lift** `o/e` et/ou la **probabilité de
  queue** (binomiale : « proba d'observer ≥ o par hasard »). **Faible proba ⇒ motif surprenant
  ⇒ persona réel.**

Pourquoi c'est le bon levier : la surprise **normalise automatiquement** pour le nombre de
questions *et* la taille de groupe — ce qui répond directement au piège probabiliste de §2.3.
Un petit groupe très spécifique et un grand groupe peu spécifique deviennent **comparables** sur
une même échelle.

> ⚠️ Le modèle nul d'indépendance est une simplification (les items corrèlent). On l'assume
> comme *heuristique de tri*, et on **adosse la stabilité** (§4.5) pour ne pas se faire avoir
> par des artefacts.

### 4.3 Étape 2 — Sélection sous objectif multi-critère + classe bruit

Définir un **score de qualité par persona** et un **objectif global** explicites, p. ex. :

```
qualité(g) = surprise(S_g, d_g) · f_taille(|M_g|)
   sous contraintes |M_g| ≥ τ_taille  et  |S_g| ≥ τ_dim
objectif : maximiser Σ_g qualité(g) sur un ensemble de personas peu redondants,
           en reportant couverture = |∪ M_g| / n  et l'ensemble U des non assignés.
```

- `f_taille` pénalise sous `τ_taille` (seuil d'**actionabilité**, ex. 5–8 % de `n` ou un
  plancher absolu) et **sature** au-delà (un persona géant n'est pas « 10× meilleur »).
- **Tailles hétérogènes autorisées** : on ne force plus `≈ n/k`.
- **Classe `U` (non assignés)** : un répondant n'entre dans `g` que si son score de match
  dépasse un seuil de confiance ; sinon il va dans `U`. `U` est une **information** (bruit,
  profils rares), pas un échec.

### 4.4 Étape 3 — Appartenance douce (optionnel, mais répond à l'audio)

Au lieu d'une assignation dure, reporter pour chaque répondant une **force d'appartenance** à
chaque persona (à la LCA). Conséquence directe : un répondant peut matcher **0** persona (→ `U`),
**1** (cas net), ou **plusieurs** (personas qui se recouvrent — l'audio se le demande
explicitement). À arbitrer côté produit (§6) : richesse vs lisibilité de la fiche.

### 4.5 Étape 4 — Sélection de modèle : subspace-aware + stabilité

- **Corriger la silhouette** : évaluer la cohésion de chaque cluster sur **son propre
  sous-espace `S_g`**, pas en espace complet — pour ne plus pénaliser la structure recherchée.
- **Ajouter la stabilité** : bootstrap (rééchantillonner répondants/items), re-clusteriser,
  mesurer la **reproductibilité** des personas (p. ex. ARI moyen entre runs). Un persona stable
  est crédible ; un persona qui se désagrège sous resampling est probablement un artefact. La
  stabilité aide aussi à choisir le nombre de groupes sans imposer un `k`.

### 4.6 Étape 5 — Exposer le compromis (« l'outil pour jouer »)

Répondre à *« un seul algo ou un outil pour jouer ? »* : **les deux**. Un réglage par défaut
raisonnable, **plus** un contrôle :
- soit **un curseur** `λ` (« peu de gros groupes grossiers ↔ beaucoup de petits groupes nets »)
  qui déplace l'arbitrage couverture↔spécificité ;
- soit l'affichage de **2–3 solutions de Pareto** pré-calculées (comme le multi-*k* actuel) entre
  lesquelles l'utilisateur bascule.

C'est cohérent avec l'UX existante (tags *k* cliquables, multi-*k* pré-calculé) — on généralise
le principe « pré-calcule plusieurs vues, laisse l'humain trancher ».

---

## 5. Protocole de validation (le socle)

> **Rien ne se décide sans mesure.** Ce harness est le premier livrable, *avant* toute refonte
> du moteur : il quantifie où l'existant échoue et sert de juge à toute évolution.

### 5.1 Validation externe sur vérité terrain

- Récupérer la colonne `Persona` de `persona-demo-50.csv` comme **référence** (aujourd'hui jetée).
- Mesurer **ARI** et **pureté** entre clusters trouvés et personas plantés.
- **Baselines** : `greedy-correlation` et `subspace-cohesion` actuels, plus un k-means/k-modes
  naïf comme repère bas. Objectif : un tableau « méthode × score » qui *chiffre* l'écart que
  l'audio a constaté qualitativement.

### 5.2 Données synthétiques à structure connue (générateur)

Construire un générateur paramétrable (vérité terrain par construction) avec **boutons** :
`n`, `p`, nb de vrais personas, **tailles inégales**, nb de variables discriminantes par persona,
**nb de variables de bruit injectées**, **% de répondants aléatoires**, intensité du **style de
réponse** (sur/sous-estimation).

Puis tracer **ARI vs chaque bouton** → transformer les questions ouvertes de l'audio en courbes :
- « +N questions de bruit casse-t-il l'algo ? » → ARI vs nb de variables de bruit ;
- « combien d'outliers avant dérive ? » → ARI vs % aléatoires ;
- « l'ajout de répondants perturbe-t-il ? » → ARI vs `n` ;
- « les styles de réponse polluent-ils ? » → ARI vs intensité (avec/sans ipsatisation).

### 5.3 Ablations

Isoler la contribution de chaque levier : brut vs ipsatisé ; surprise vs support brut ;
silhouette espace-complet vs subspace ; avec vs sans classe `U`. **On ne garde un levier que
s'il améliore le score**, pas par principe.

### 5.4 Critères de succès (à fixer ensemble)

À discuter, mais ordre de grandeur proposé : sur le jeu étiqueté, **ARI ≥ 0.7** dans le régime
« propre », et **dégradation lente** (pas de falaise) quand on injecte bruit/outliers — la
*robustesse* compte autant que le pic.

---

## 6. Discussion — limites, risques, arbitrages produit

- **Explosion combinatoire** du mining quand `p` grandit → bornes, motifs fermés/maximaux,
  caps de profondeur. À surveiller dès le générateur (§5.2 grand `p`).
- **Modèle nul imparfait** (items corrélés) → la surprise est une *heuristique de tri*, pas une
  vérité ; la stabilité (§4.5) sert de garde-fou.
- **Appartenance douce / personas chevauchants** : gain analytique réel, **mais** tension avec
  le récit produit « un persona = une fiche actionnable ». Arbitrage à faire : par défaut dur et
  lisible, détail doux en option ?
- **UX du compromis** : curseur/Pareto = puissance, mais risque de surcharge cognitive. Garder
  un défaut qui « marche tout seul ».
- **Petits `n`** : l'audio parle de centaines, mais parfois moins → puissance statistique limitée ;
  le plancher `τ_taille` et la stabilité évitent de sur-interpréter.
- **La vérité terrain est une construction humaine** : retrouver *tes* étiquettes n'est pas
  retrouver une vérité objective. L'ARI est *un* signal, à croiser avec la stabilité et le
  jugement métier — pas un juge absolu.
- **Risque de sur-ingénierie** : la cible reste un produit utile. Si les baselines corrigées
  (silhouette subspace + classe `U`) suffisent, on s'arrête là. Le harness tranche.

---

## 7. Décision & séquencement (proposé)

Ordre par **ROI décroissant / coût croissant** — chaque étape produit une mesure avant la suivante :

1. **Harness de validation + baselines** (§5.1, §5.3). Peu coûteux, très informatif : chiffre
   *où et de combien* l'existant échoue. **Prérequis de tout le reste.**
2. **Générateur synthétique** (§5.2). Débloque les réponses aux questions ouvertes de l'audio.
3. **Corrections à fort levier, faible risque** : silhouette **subspace-aware** (§4.5) +
   **classe `U`** (§4.3) + activation **MH/ML** (§4.2). Probablement le meilleur rapport
   gain/effort.
4. **Scoring par surprise** (§4.2) en remplacement du score figé.
5. **Normalisation styles de réponse** (§4.1), gardée seulement si l'ablation le justifie.
6. **Appartenance douce** (§4.4) + **UX du compromis** (§4.6) : en dernier, une fois le moteur
   fiable et mesuré.

> Garde-fou : on ne passe à l'étape *n+1* que si l'étape *n* a **amélioré une métrique** du
> harness (ou clarifié une décision). Pas d'ajout « parce que c'est élégant ».

---

## Annexe A — Intuition de l'audio → concept → action

| Intuition (audio) | Concept établi | Action proposée |
| --- | --- | --- |
| Trouver ensemble questions discriminantes + groupes | Subspace / projected clustering | Garder & généraliser le mining (§4.2) |
| « 20×4 » vs « 2×9 » | Compromis support × dimensionnalité | Objectif explicite + curseur/Pareto (§4.3, §4.6) |
| Taille minimale pour être actionnable | Contrainte de support min | `τ_taille` de 1er plan (§4.3) |
| Exclure les répondants au hasard | Classe bruit / outliers | Classe `U` + seuil de confiance (§4.3) |
| Sur/sous-estimateurs décalés | Styles de réponse / ipsatisation | Centrage par répondant, testé (§4.1) |
| « +N questions = bruit qui parasite » | Robustesse à la dimensionnalité | Surprise (§4.2) + courbes ARI (§5.2) |
| Groupes de tailles différentes | Clusters déséquilibrés | Lever le forçage `n/k` (§4.3) |
| Coexistence gros/grossier & petit/net | Front de Pareto | Exposer 2–3 solutions (§4.6) |
| « 1 algo ou un outil pour jouer ? » | Optimisation multi-objectif | Défaut + contrôle (§4.6) |
| « Tous les groupes même taille ? » | (Non) partition équilibrée | Non : tailles libres (§4.3) |

## Annexe B — Pointeurs code (état `main`)

- Matrice de co-accord ±1 : `lib/persona/clustering.ts:31`
- Seuil dynamique `moyenne+σ` : `lib/persona/clustering.ts:48`
- Tailles `≈ n/k` (greedy) : `lib/persona/clustering.ts:69`
- Silhouette en espace complet : `lib/persona/clustering.ts:221`, `:232`
- Mining limité H/L : `lib/persona/clustering.ts:303`
- Score de graines figé : `lib/persona/clustering.ts:391`
- Assignation forcée (pas de classe bruit) : `lib/persona/clustering.ts:151`, `:483`
- Vérité terrain jetée : `app/persona/new/page.tsx:70` (+ `app/persona/page.tsx:16`)

---

*Rédigé comme base de discussion. Prochaine étape : valider/amender cette thèse, puis
attaquer le §7.1 (harness) — toujours sans toucher au moteur tant qu'on n'a pas de mesure.*
