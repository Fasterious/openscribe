# Personas — Note de conception **V3** (complète, pédagogique & amendée)

> **Ce document est la V3 : la fusion de [`THESE-PERSONA.md`](./THESE-PERSONA.md) (V1, « épurée »)
> et de [`THESE-PERSONA-V2.md`](./THESE-PERSONA-V2.md) (V2, « pédagogique & amendée »).**
> Objectif de la V3 : **ne plus rien perdre**. Elle reprend :
> 1. **tout le détail de la V1** (formalisations, audit complet du code, « À retenir » de chaque
>    référence de littérature, formules, listes d'ablations, annotations de séquencement) — la V2
>    en avait épuré une partie ;
> 2. **toute la pédagogie de la V2** (encarts « En clair » qui expliquent chaque terme et chaque
>    formule sans bagage maths/stats) ;
> 3. **tous les amendements (A1–A8)** et **détails de discussion** (test *k=4* vs *k=5*, variable
>    C11, régime dual, principes produit, roadmap, comparateur) issus des échanges de juin 2026.
>
> Autrement dit : **V3 = V1 (intégral) ∪ V2 (intégral)**, sans soustraction. Là où la V2 avait
> raccourci la V1, la V3 **restaure le texte d'origine** et lui adjoint l'encart pédagogique.
>
> **Cadrage (rappel V1).** Document de cadrage *avant code* : reposer les bases de la découverte
> automatique de personas dans OpenScribe, en s'appuyant sur l'acquis (`lib/persona/clustering.ts`)
> mais **sans s'y limiter**, et en rendant *mesurable* la notion de « meilleur ». Ce n'est **pas**
> un article scientifique ni un état de l'art systématique — c'est une **thèse de conception
> traçable**.
>
> **Format :** squelette **IMRaD** allégé (Introduction → Méthode → Validation → Discussion) +
> encarts pédagogiques + encarts « prior art » légers, orienté décision.
>
> Principe tenu : *on ne minimise pas la complexité, on l'explique.* Si une mécanique complexe
> donne un meilleur résultat, on la garde — mais on la rend compréhensible et contrôlable.
>
> **Statut :** *proposition vivante*, à amender. Rien n'est codé ; aucune ligne du module persona
> actuel n'est modifiée. Source de réflexion : audio de réflexion produit (juin 2026) + dialogue de
> clarification avec un assistant + lecture du code `main`.

---

## Comment lire ce document

Trois types d'encarts ponctuent le texte :

> 💡 **En clair —** traduction sans jargon d'un terme ou d'une formule.

> 🔄 **Amendement (discussion) —** ajout ou changement par rapport à la V1, issu des échanges.

> ⚠️ **Nuance / correction —** un endroit où je précise, ou corrige une explication trop simplifiée.

Un **glossaire exhaustif** en Annexe C reprend *tous* les termes, classés, avec un exemple à chaque fois.

> 📐 **Note de méthode (V3) —** le texte « de fond » (paragraphes, tableaux, formules) est celui de
> la **V1 intégrale** ; les encarts 💡/🔄/⚠️ viennent de la **V2**. Quand la V2 avait condensé un
> passage V1, c'est la version **longue de la V1** qui est conservée ici.

---

## Journal des amendements (V3 vs V2 vs V1)

| # | Amendement | D'où ça vient | Où dans le doc |
| --- | --- | --- | --- |
| A1 | **Régime dual** : décrire d'abord le *cœur de cible* (profil global), puis chercher les *sous-personas*. L'outil ne doit jamais renvoyer un écran vide quand tout le monde se ressemble. | Question « et si tout le monde répond pareil, 1 seul persona ? » | §4.0 (nouveau) |
| A2 | **Ipsatisation OFF par défaut**, activable via un bouton dans l'UI, avec impact re-calculé et visible. + nuance sur son biais mathématique. | Crainte du biais + volonté de contrôle | §4.1, §8 |
| A3 | **Principe directeur produit : pipeline transparent et contrôlable.** Chaque étape visible, chaque terme expliqué inline, chaque réglage activable/désactivable. | Volonté « plein contrôle + compréhension » | §8 (nouveau) |
| A4 | **Décision d'architecture : nouveau module séparé** (`persona v2`), l'actuel est conservé tel quel (référence/démo/baseline). | Crainte de « tout casser » | §7, §9 |
| A5 | **Validation empirique déjà observée** : à *k=5 forcé*, l'algo actuel reconstruit les personas et trouve même une variable oubliée ; la variable C11 est un cas d'école de « 2 répondants à exclure ». | Test dans la discussion | §2.6, §5.1 |
| A6 | **Comparateur de stratégies** dans l'UI : lancer plusieurs réglages côte à côte et comparer. | Demande de comparer ce qui marche | §8 |
| A7 | **Réassignation manuelle** (déplacer un répondant d'un groupe à l'autre, voir l'effet, sans écraser l'analyse) — étape produit ultérieure. | Proposition utilisateur | §9 |
| A8 | **Génération d'une fiche persona qualitative** à partir des résultats — étape produit ultérieure. | Proposition utilisateur | §9 |

> ✅ **Note de complétude (V3 ⊇ V1 ∪ V2) —** la V3 est un **sur-ensemble strict** des deux fichiers.
> En plus de tout le contenu de la V2 (encarts, amendements A1–A8, §4.0, §8, §9, Annexe C glossaire),
> elle **restaure les détails V1 que la V2 avait raccourcis** :
> - **§2.1** : la formalisation complète `M_g ⊆ [n]`, `S_g ⊆ [p]`, `d_g` (directions attendues) ;
> - **§2.4** : le **tableau d'audit complet** (colonne « Lecture critique » détaillée, formule
>   `longueur²×membres×pénalité` visible) *en plus* du décorticage pédagogique par algorithme ;
> - **§2.5** : le texte long des trois failles (l'« Hypothèse forte » + « à confirmer par le harness »
>   pour la faille n°1 ; « l'audio insiste… réponses au hasard, comportements hors-groupe » pour la
>   n°2 ; « encode un arbitrage non documenté, non pilotable… *un seul algo ou un outil pour jouer ?* »
>   pour la n°3) ;
> - **§2.6** : les chemins de fichiers (`app/persona/page.tsx:16`, `app/persona/new/page.tsx:70`),
>   « construite à dessein », « premier chantier (§5) » ;
> - **§3** : les « À retenir » de chaque référence (sélection par cluster ; sous-matrices cohérentes ;
>   surprise/lift + motifs fermés/maximaux ; appartenance douce ; centrage par répondant ; ARI mesure
>   le recouvrement ; stabilité complémentaire de la silhouette) ;
> - **§4.1** : la formule d'ipsatisation `x'_iq = x_iq − moyenne_i` ;
> - **§4.2** : la définition formelle du prédicat `(item, direction)`, `p_k` = taux marginal, et la
>   nuance « modèle nul d'indépendance = simplification, adossée à la stabilité » ;
> - **§4.5** : « rééchantillonner répondants/items », « ARI moyen entre runs » ;
> - **§4.6** : le **curseur `λ`** et l'arbitrage « couverture ↔ spécificité », « laisse l'humain trancher » ;
> - **§5.3** : la **liste explicite des ablations** (brut vs ipsatisé ; surprise vs support brut ;
>   silhouette espace-complet vs subspace ; avec vs sans classe `U`) ;
> - **§5.4** : « sur le jeu étiqueté » ;
> - **§6** : « bornes », « la cible reste un produit utile », « le harness tranche » ;
> - **§7** : les annotations de ROI (« meilleur rapport gain/effort », « débloque les questions
>   ouvertes de l'audio », « chiffre où *et de combien* »).
>
> Seul **changement de fond assumé**, hérité de la V2 : la **normalisation** est passée
> d'« obligatoire » (V1) à « optionnelle / OFF par défaut » (amendement A2). Tout le reste est additif.

---

## 0. TL;DR (pour décider vite)

- **Le bon nom du problème** : *clustering en sous-espaces (subspace / projected clustering)
  de données ordinales (Likert), pour découverte de personas*, avec sélection de variables
  par cluster, robustesse au bruit, et **droit d'exclure** des répondants. Voisins utiles :
  biclustering, modèles à classes latentes (LCA), pattern mining.

> 💡 **En clair —** on cherche des groupes de répondants qui se ressemblent **seulement sur
> quelques questions bien choisies** (leur « sous-espace »), pas sur l'ensemble du questionnaire ;
> et on s'autorise à mettre de côté les répondants qui ne collent à aucun groupe.

- **L'acquis est bon** : `subspace-cohesion` est, sans le nommer, du *frequent-itemset mining*
  (Apriori) — exactement la bonne intuition « **découvrir ensemble les variables discriminantes
  et les groupes** ».

> 💡 **En clair —** « frequent-itemset mining / Apriori » = la technique inventée pour les tickets
> de caisse (« qui achète des couches achète souvent de la bière »). Ici : « qui répond 5 à la Q1
> répond souvent 1 à la Q4 ». On cherche des **combinaisons de réponses fréquentes**.

- **Le maillon manquant central** : il existe une **vérité terrain** (`persona-demo-50.csv`,
  colonne `Persona`, 5 groupes ×10) que le code **jette**. Donc rien ne mesure l'écart entre
  ce qui est trouvé et ce qui devrait l'être. **On ne peut pas repenser sans mesurer.**

> 💡 **En clair —** « vérité terrain » = le corrigé. Les 50 répondants ont été étiquetés à la main
> avec des emojis (🟣🔵🟡🟠🟢). Le code supprime cette colonne avant de calculer ⇒ il ne sait jamais
> s'il est tombé juste.

- **Trois failles méthodologiques** identifiées dans l'existant : (1) la métrique de sélection
  de *k* (silhouette) travaille en *espace complet* et se bat contre la méthode subspace ;
  (2) aucune classe « non assigné » alors qu'il faut pouvoir exclure ; (3) le compromis
  taille↔variables discriminantes est **figé** dans un score caché. **Les trois sont confirmées
  par le test empirique** (§2.6).

- **Proposition** : refondre autour d'un **objectif explicite** (compromis posé formellement),
  scorer les motifs par **surprise statistique** (et non support brut), ajouter une **classe
  bruit**, rendre la **normalisation optionnelle**, et **valider** sur vérité terrain + données
  synthétiques à structure connue.

- **Séquencement** : d'abord le harness de validation + baselines (peu coûteux, très informatif),
  puis le moteur, puis l'UX du compromis. Détails en §7.

- 🔄 **Amendement A1** : avant de chercher des sous-groupes, **décrire le profil global** (cœur de
  cible). S'il n'y a qu'un seul profil, c'est une réponse valable, pas un échec.

- 🔄 **Amendement A4** : on construit ça dans un **module séparé**, sans toucher au persona actuel.

---

## 1. Introduction — contexte & objectif

### 1.1 Pourquoi des personas

Un persona condense des centaines de répondants en quelques fiches actionnables : besoins,
problématiques, contexte d'usage. Si une fiche capture fidèlement un groupe, on peut prioriser
et concevoir un produit *pour ce groupe* plutôt que pour **une moyenne qui ne correspond à
personne**. La valeur n'est donc pas « faire des clusters » mais **faire des clusters dont on
peut faire quelque chose** : assez gros pour compter, assez nets pour se décrire en une fiche.

> 💡 **En clair —** « cluster » = groupe. « Actionnable » = sur lequel on peut décider quelque chose
> (prioriser une fonctionnalité, adapter un design). Un persona de 2 personnes est rarement actionnable.

> **Cadrage B2C vs B2B (audio).** En B2B on se rabat souvent sur la fiche de poste (contexte métier
> homogène ⇒ réponses homogènes : « infirmières » vs « médecins ») — une facilité qui peut masquer
> des personas transverses (le « technophile pressé » existe chez les deux). La méthode visée doit
> *découvrir* la structure, pas la présupposer ⇒ rester **agnostique au domaine**.

> 💡 **En clair —** « agnostique au domaine » = l'algorithme regarde les *comportements de réponse*,
> sans rien savoir du métier ou du titre des gens. Il déduit les groupes, au lieu de plaquer des
> étiquettes connues d'avance.

### 1.2 La tâche, concrètement

Entrée : un **questionnaire quantitatif à échelles de Likert**. Une matrice
**répondants × items**, valeurs ordinales (typiquement 1–5). On ne sait **pas à l'avance**
quelles questions sont discriminantes ni combien de groupes existent.

> 💡 **En clair —** « matrice répondants × items » = ton tableur exporté. Lignes = répondants,
> colonnes = questions, cases = notes. « Ordinale » = il y a un ordre (5 > 4 > … > 1) mais l'écart
> entre 4 et 5 n'est pas une mesure exacte comme des centimètres. C'est le propre des échelles de
> Likert (« Pas du tout d'accord » → « Tout à fait d'accord »).

Sortie souhaitée : un petit ensemble de personas, **chacun défini par**
(a) un sous-ensemble de membres, (b) un sous-ensemble de **variables discriminantes** propres
au groupe, (c) une direction/profil sur ces variables — **plus** un éventuel ensemble de
répondants **inclassables**. C'est ce triplet (membres, variables, directions) qui fait la
fiche persona.

> 💡 **En clair —** « variable discriminante » = une question qui *sépare* les gens en groupes. Si
> tout le monde répond pareil à une question, elle ne discrimine personne (elle ne sert pas à faire
> des groupes). « Direction » = le sens de la réponse (plutôt 5, plutôt 1…).

### 1.3 Le geste qu'on automatise

Historiquement, le researcher pose les réponses sur des échelles et repère « à l'œil » des
convergences de comportement sur certaines questions : *« tiens, ces gens répondent pareil sur
ces questions-là »*. Trop coûteux à la main au-delà de quelques dizaines de répondants. **On
automatise ce repérage de convergences locales** — pas un clustering géométrique générique.

> 💡 **En clair —** un « clustering géométrique générique » (type k-means) regroupe par *distance
> globale* sur toutes les questions. Toi tu cherches des *étincelles d'accord local* sur quelques
> questions. C'est différent, et c'est ce qui justifie l'approche par motifs (Apriori) plutôt que
> par distance.

---

## 2. Problème formel & état du code

> ⚠️ **Note de lecture —** c'est la partie la plus dense. Chaque sous-section a son encart. Prends-la
> bloc par bloc, il n'y a rien d'insurmontable.

### 2.1 Formalisation

Soit `X ∈ {1..L}^(n×p)` : `n` répondants, `p` items Likert (`L`=5 le plus souvent).
On cherche des personas `g = (M_g, S_g, d_g)` où `M_g ⊆ [n]` (membres),
`S_g ⊆ [p]` (variables discriminantes du groupe), `d_g` les directions attendues sur `S_g`,
plus un ensemble `U` (non assignés). C'est du **projected clustering** : chaque cluster vit
dans **son propre sous-espace** `S_g`, et tolère que les membres divergent sur les variables
hors `S_g`.

> 💡 **En clair —** ne te laisse pas impressionner par la notation : c'est juste la description de
> ton fichier. `X` le tableau, `n` le nombre de lignes (répondants), `p` le nombre de colonnes
> (questions), `{1..L}` les notes possibles (1 à 5). Un persona = un trio :
> - `M_g` (**M**embres) : *qui* est dedans (ex. répondants 12, 45, 89) ;
> - `S_g` (**S**ous-espace) : *sur quelles questions* il se définit (ex. Q3, Q4, Q8) ;
> - `d_g` (**d**irection) : *quelles réponses* sur ces questions (ex. « 5 partout »).
>
> `U` = le « bac » des inclassables (les répondants qu'on n'a pas forcés dans un groupe).

### 2.2 Le double compromis (le cœur de l'audio)

Pour un motif candidat (un sous-ensemble de variables + directions), il y a tension entre :

- **support** `|M_g|` — combien de répondants le satisfont → *actionabilité* ;
- **spécificité** `|S_g|` — combien de variables discriminantes → *richesse descriptive* ;
- **cohésion** — à quel point les membres convergent vraiment sur `S_g` ;

et, globalement, entre **couverture** (fraction de répondants assignés) et **pureté**
(ne pas forcer du bruit dans les groupes).

> 💡 **En clair —** ton exemple audio : « 20 personnes / 4 questions communes » vs « 2 personnes /
> 9 questions ». Le **support** = la taille du groupe (20 vs 2). La **spécificité** = le nombre de
> questions partagées (4 vs 9). La **cohésion** = sont-ils *vraiment* serrés sur ces questions.
> **Couverture** = ai-je classé beaucoup de monde ? **Pureté** = mes groupes sont-ils nets ?
> Maximiser l'un fait souvent baisser l'autre : c'est *le* compromis à arbitrer.

L'exemple de l'audio : « 20 personnes / 4 questions communes » vs « 2 personnes / 9 questions »
— le premier est *plus utile* parce qu'**enlever une variable discriminante revient à renoncer
consciemment à un moyen de décrire la réalité**, en échange de membres supplémentaires. C'est un
choix de fond, pas un détail technique. **Ce compromis ne doit pas être figé dans le code : il
doit être posé comme objectif, et idéalement exposé à l'utilisateur.**

Aujourd'hui, ce compromis est **figé** dans le code (une formule cachée). On veut le **sortir au
grand jour** pour que tu puisses « jouer avec ».

### 2.3 Le piège probabiliste (audio 14:40–16:00)

L'audio l'intuitionne très bien : avec **peu** de questions, des petits groupes « identiques »
apparaissent **par hasard** ; avec **beaucoup** de questions, des accords exacts deviennent
**improbables**. Conséquence : **le support brut n'est pas comparable** d'un nombre de
questions à l'autre, ni d'une taille de groupe à l'autre. ⇒ Il faut juger un motif par sa
**surprise** (écart au hasard), pas par son support nu. C'est un levier central (voir §4.2).

> 💡 **En clair — la « surprise », pas à pas (cas d'un motif sur 2 questions, n=100) :**
> 1. L'algo regarde la *popularité* de chaque réponse seule. Ex. « 5 à la Q-rapidité » = 80 % des
>    gens ; « 5 à la Q-export JSON » = 10 % des gens.
> 2. Il calcule ce que donnerait le **pur hasard** si les deux n'avaient aucun lien :
>    80 % × 10 % = 8 %. Sur 100 personnes, il *s'attend* donc à 8 personnes qui cochent les deux.
>    Ce « 8 » = l'**espérance** (le `e` de la formule).
> 3. Il compare au **réel** : s'il trouve 8 personnes → zéro surprise → ce n'est pas un persona.
>    S'il en trouve 25 → énorme surprise → c'est un vrai comportement segmentant → persona.
>
> Pourquoi c'est mieux que compter les têtes : « tout le monde veut une appli rapide » est *banal*
> (pas surprenant), alors que « 25 personnes réclament un export JSON » est *anormal* (surprenant).
> Le support brut leur donnerait le même poids ; la surprise distingue le signal du banal.

> ⚠️ **Nuance / correction (vs la discussion) —** la surprise gère **automatiquement** le cas des
> questions « évidentes » : si une question a 95 % de « 5 », sa popularité marginale est ~0,95, donc
> l'espérance est déjà très haute ⇒ aucune surprise possible ⇒ la question est ignorée comme
> non-discriminante. C'est une **force** (le consensus banal est filtré tout seul). **Mais** cela a
> une conséquence importante traitée en §4.0 : si *toutes* les questions sont consensuelles, la
> surprise ne renvoie *rien* — et il faut alors un autre mécanisme pour ne pas afficher un écran vide.

### 2.4 Ce que fait le code aujourd'hui

Deux algorithmes consomment une **matrice de co-accord** : deux répondants « s'accordent » sur
un item si `|x_iq − x_jq| ≤ 1` (`clustering.ts:31`), et `totalMatrix[i][j]` compte les items
en accord.

> 💡 **En clair —** règle actuelle : deux personnes sont « d'accord » sur une question si l'écart de
> leurs notes est ≤ 1 (4 et 5 → d'accord ; 3 et 5 → pas d'accord). `totalMatrix[i][j]` compte sur
> combien de questions i et j sont d'accord.

**Vue d'ensemble (audit du code existant)** — le détail pédagogique suit juste après :

| Brique | Fichier | Ce qu'elle fait | Lecture critique |
| --- | --- | --- | --- |
| `greedy-correlation` | `clustering.ts:62` | Seed (meilleure paire) + croissance sous seuil dynamique `moyenne+σ` (`:48`), tailles ≈ `n/k` (`:69`) | **Espace complet** (toutes les questions pèsent pareil) ⇒ sensible au bruit ; « effet de chaîne » (tolérance ±1 non transitive) ; tailles forcées |
| `subspace-cohesion` | `clustering.ts:460` | Apriori sur motifs `(var, direction)`, sélection de graines, raffinement « Pattern-KMeans » | **Bonne base.** Mais mining limité aux **extrêmes H/L** (`:303`) ⇒ MH/ML *inertes* ; score de graines figé `longueur²×membres×pénalité` (`:391`) |
| Sélection de *k* | `clustering.ts:199` | Silhouette, distance = `nQ − corrélation` (`:221`,`:232`) | **Distance en espace complet** ⇒ pénalise la structure subspace que l'autre algo cherche (faille n°1, voir §2.5) |
| Signatures | `clustering.ts:168` | Variables à variance intra ≤ 0.8 (`:181`) | Descriptif a posteriori, OK |
| Assignation | `clustering.ts:151`, `:483` | **Tout le monde** est forcé dans un groupe | **Pas de classe « non assigné »** — contredit la volonté d'exclure |

**Algorithme 1 — `greedy-correlation`** (`clustering.ts:62`) : on part de la meilleure paire et on
fait grossir le groupe sous un seuil dynamique `moyenne+σ` (`:48`), avec des tailles forcées ≈ `n/k`
(`:69`).

> 💡 **En clair — le défaut « effet de chaîne » (tolérance ±1 *non transitive*) :**
> « transitif » = si A=B et B=C alors A=C. Ici c'est faux :
> - Alice (5) et Bob (4) : écart 1 → groupés.
> - Bob (4) et Charlie (3) : écart 1 → Charlie rejoint.
> - Mais Alice (5) et Charlie (3) : écart **2** → ils ne sont *pas* d'accord !
>
> De proche en proche, le groupe devient un « blob » qui mélange des avis opposés. C'est le risque
> principal de cet algorithme. S'ajoutent la sensibilité au bruit (toutes les questions pèsent
> pareil, en *espace complet*) et les **tailles forcées** (≈ `n/k`).

**Algorithme 2 — `subspace-cohesion`** (`clustering.ts:460`) : Apriori sur des motifs `(variable,
direction)`, sélection de graines, raffinement « Pattern-KMeans ».

> 💡 **En clair — deux limites pointées dans le code :**
> - **« Mining limité aux extrêmes H/L »** (`:303`) : H = High (≈5), L = Low (≈1). L'algo ne
>   *démarre* un groupe qu'à partir des gens qui répondent aux extrêmes. Un persona « modéré » qui
>   répond systématiquement 4 (MH = Medium-High) ou 2 (ML = Medium-Low) est invisible comme point de
>   départ : on dit qu'il est « inerte ».
> - **« Score de graines figé »** (`:391`) : pour choisir le meilleur motif de départ, le code
>   utilise une formule inventée `longueur² × membres × pénalité`. Pourquoi au carré ? Choix
>   arbitraire du développeur. Cette formule dicte la forme de tes personas en coulisse.

> 💡 **En clair — « graine »** = le tout premier petit motif autour duquel on construit un persona
> (ex. « 5 personnes mettent 5 à trois questions »). On part de la graine, puis on agrège.

**Signatures** (`clustering.ts:168`) : variables à **variance intra ≤ 0.8** (`:181`).

> 💡 **En clair —** une fois le persona formé, on le *décrit* : pour chaque question, on regarde si
> ses membres sont d'accord entre eux. La « variance intra » mesure leur désaccord interne (0 = tous
> la même note ; élevé = ils sont éparpillés). Si la variance est faible (≤ 0,8 = seuil choisi), la
> question devient une « signature » du persona (« ce groupe se définit par : tri sélectif ↑, prix ~ »).
> C'est **descriptif a posteriori** — sain.

### 2.5 Trois failles à corriger en priorité

1. **La métrique se bat contre la méthode.** La silhouette mesure une distance *toutes
   variables confondues*. Or deux membres d'un même persona-subspace divergent justement sur
   les variables **non** pertinentes ⇒ leur distance complète gonfle ⇒ la silhouette
   *sous-récompense* les vrais clusters subspace et pousse vers des solutions « compactes » de
   type `greedy`. **Hypothèse forte : c'est une des raisons pour lesquelles les résultats
   divergent de la vérité terrain plantée.** À confirmer par le harness (§5) — *et déjà confirmé
   empiriquement* (§2.6, test `k=4` vs `k=5`).

> 💡 **En clair — la silhouette et le « k » :**
> - `k` = le nombre de groupes qu'on demande à l'algo de faire.
> - la **silhouette** = la note (de −1 à 1) que l'algo se donne pour juger si ses groupes sont à la
>   fois *serrés* (cohésion) et *bien séparés* des autres. On essaie k=2, 3, 4… et on garde le k qui
>   a la meilleure note.
> - **Le problème** : la silhouette juge sur *toutes* les questions. Or un persona-subspace diverge
>   exprès sur les questions *non pertinentes*. La silhouette voit cette divergence et dit « pas
>   assez serré » → elle pénalise les bons groupes et **pousse vers des solutions « compactes » de
>   type `greedy`**. C'est comme noter un sprinteur sur ses performances au décathlon.

2. **Pas de droit d'exclure.** L'audio insiste : l'algorithme doit pouvoir décider *quels
   répondants ne pas inclure* (réponses au hasard, comportements hors-groupe). Le code force
   l'assignation complète (*tout le monde* dans un groupe).

3. **Compromis caché.** Le score `longueur²×membres×pénalité` (`:391`) encode *un* arbitrage
   particulier, non documenté, non pilotable. L'audio demande explicitement : *« un seul algo,
   ou un outil pour jouer avec ces variables ? »*

### 2.6 L'actif gaspillé : la vérité terrain + la validation empirique

`public/samples/persona-demo-50.csv` et le sample interne (`app/persona/page.tsx:16`)
contiennent une colonne `Persona` (🟣🔵🟡🟠🟢, **5 groupes de 10**) : c'est une **vérité
terrain construite à dessein**. Mais elle est **non numérique** ⇒ exclue automatiquement à la
sélection de colonnes (`app/persona/new/page.tsx:70`) ⇒ **jetée**. On a donc un jeu étiqueté
et **aucune mesure** de recouvrement. C'est le **premier chantier** (§5).

> ⚠️ **Biais du jeu actuel —** groupes **parfaitement équilibrés** (10×5). Dans la vraie vie, tu
> auras un persona de 40 et un de 5. Ce jeu « trop parfait » *masque* la faiblesse « tailles
> inégales » et l'absence de bruit. Un bon jeu de validation doit être *déséquilibré et bruité*
> (voir §5.2).

> 🔄 **Amendement A5 — validation empirique (échange de juin 2026).** En testant l'outil actuel :
> - à **k=4** (choisi par la silhouette par défaut) les personas sont dégradés ; à **k=5 forcé**,
>   l'algo **reconstruit les 5 personas** et **identifie même une variable qui avait été ratée**
>   (corrélation non vue à l'œil). ⇒ **Confirmation directe de la faille n°1** : l'« ouvrier »
>   (le clustering) travaille bien ; c'est le « juge » (la silhouette) qui choisit mal le `k`.
> - sur la variable **C11**, une majorité de répondants sont cohérents mais **2 répondants
>   « cassent » le motif**. En les excluant, on obtiendrait un persona de **8 membres avec 6 variables
>   très corrélées** au lieu d'un groupe dilué. ⇒ La **classe `U`** (exclusion d'outliers) a été
>   **réinventée d'elle-même** : **confirmation directe de la faille n°2.**
>
> **Conséquence forte pour la stratégie : on ne jette pas le moteur actuel.** Il « contient déjà de
> l'or ». L'enjeu est de lui retirer ses deux menottes (le mauvais juge + l'obligation de tout
> classer), et de **comparer** l'ancienne et la nouvelle approche, plutôt que de repartir de zéro à
> l'aveugle.

---

## 3. Prior art (encarts légers — pour ne pas réinventer)

> But : ancrer le vocabulaire et **importer les bons outils**, pas rédiger une revue.

- **Subspace / projected clustering.** Familles de méthodes où chaque cluster est défini sur
  *son propre* sous-ensemble de dimensions (p. ex. PROCLUS, CLIQUE, DOC). Pertinent : nos
  personas sont par construction « locaux » à quelques questions. **À retenir : la sélection de
  variables est par cluster, pas globale.**

> 💡 **En clair —** « ces 15 personnes ont des avis opposés sur 16 questions, MAIS répondent pareil
> aux 4 questions sur l'écologie → persona écolo ». La sélection des questions se fait *par* cluster.

- **Biclustering.** Regroupe simultanément lignes (répondants) et colonnes (items). Conceptuellement
  proche de notre triplet (membres, variables, directions). **À retenir : on cherche des
  sous-matrices cohérentes, pas des partitions globales.**

> 💡 **En clair —** on regroupe lignes **et** colonnes *en même temps* : on découpe un petit
> rectangle dans le tableur (« ce groupe de 30 personnes réagit pareil à ce groupe de 4 questions »).
> Une autre façon mathématique d'arriver au persona.

- **Pattern / itemset mining (Apriori, motifs fermés/maximaux).** Déjà à l'œuvre dans
  `subspace-cohesion`. **À retenir : (1) scorer par surprise/lift plutôt que support brut ;
  (2) utiliser les motifs fermés/maximaux pour éviter l'explosion combinatoire et la redondance.**

> 💡 **En clair —** « lift » = à quel point l'observé dépasse le hasard (25 trouvés / 8 attendus →
> lift ≈ 3). « Motifs fermés/maximaux » = une astuce pour ne garder que les motifs « résumés » et ne
> pas calculer des milliards de variantes redondantes (voir §6).

- **Modèles à classes latentes / mélanges (LCA, latent class).** Modélisent l'appartenance comme
  **probabiliste** (un répondant a une *probabilité* d'appartenir à chaque classe), gèrent
  nativement l'incertitude et les outliers. **À retenir : l'appartenance douce répond à la
  question « et si un répondant matche 0, 1 ou plusieurs personas ? ».**

> 💡 **En clair —** « latent » = caché. On suppose que le vrai persona est invisible, on n'en voit
> que les symptômes (les réponses). Surtout, LCA raisonne en **probabilités** : « ce répondant a
> 70 % de chances d'être Persona A, 30 % Persona B ». C'est ce qui permet les profils hybrides (→ §4.4).

- **Styles de réponse (response styles) & ipsatisation.** Littérature psychométrique : acquiescence
  (tout valider), style extrême, style médian, sur/sous-estimation. Correctif classique : **centrer
  par répondant** (retrancher sa moyenne) avant analyse. **À retenir : neutralise le « sur/sous-
  estimateur » de l'audio** (deux personnes réellement d'accord mais décalées se rapprochent).
  Détaillé en §4.1.

- **Métriques de validation externe.** **Adjusted Rand Index (ARI)**, pureté, NMI : comparent une
  partition trouvée à une partition de référence, corrigées du hasard. **À retenir : c'est avec ça
  qu'on mesure « est-ce que l'algo retrouve mes personas plantés ».**

> 💡 **En clair —** « ARI (Adjusted Rand Index) » = la note de comparaison entre les groupes trouvés
> et ton corrigé. 1 = parfait, 0 = hasard, négatif = pire que le hasard. C'est le « chronomètre ».

- **Stabilité / consensus clustering.** Un cluster « réel » réapparaît sous rééchantillonnage
  (bootstrap). **À retenir : la stabilité est un critère de sélection de modèle *complémentaire* à
  la silhouette, et plus honnête sur « ce groupe existe-t-il vraiment ? ».**

> 💡 **En clair —** un vrai persona *réapparaît* si on relance le calcul sur un échantillon
> légèrement différent (on enlève quelques répondants au hasard). S'il se désagrège, c'était sans
> doute un artefact. La stabilité = test de solidité.

---

## 4. Méthode candidate (refonte autour d'un objectif explicite)

> On garde l'acquis Apriori, on corrige les failles, on **pose l'objectif**. Présenté en
> étapes ; chaque étape est indépendamment testable via le harness (§5).

### 4.0 🔄 Amendement A1 — Régime dual : cœur de cible, *puis* sous-personas

C'est l'amendement le plus important issu de la discussion. La question : *« et si les questions sont
pertinentes mais que tout le monde répond pareil — l'outil doit voir 1 seul persona ? »*

Réponse en deux temps, parce qu'il y a **deux régimes différents** :

1. **Étape 0 — Décrire le profil global (statistique descriptive).** Avant toute recherche de
   sous-groupes, l'outil calcule et affiche le **cœur de cible** : sur quelles questions une large
   majorité (p. ex. ≥ 70–80 %) converge, et dans quel sens. C'est un simple comptage, ça **marche
   même quand il n'y a aucune hétérogénéité**.

2. **Étape 1+ — Découvrir des sous-personas (surprise / subspace).** *Ensuite*, on cherche les
   groupes qui se *détachent* du cœur de cible.

> 💡 **En clair —** la méthode « surprise » est un **détecteur de fractures** : elle a besoin qu'il y
> ait de quoi se détacher. Si 1000 personnes répondent à l'identique, il n'y a pas de fracture → 0
> sous-persona, et c'est *correct*. Mais ce serait absurde de ne *rien* afficher : l'information utile
> est alors « tu as **un seul archétype** (ton product-market fit), le voici ». L'Étape 0 garantit
> cette réponse.

> ⚠️ **Correction (vs la discussion) —** dans les échanges, la conclusion était « l'algo aura raison
> de ne rien trouver ». C'est vrai *pour la recherche de sous-groupes*, mais **incomplet côté produit** :
> ne rien afficher tromperait l'utilisateur. Le régime dual transforme « je n'ai rien trouvé » en
> « voici ton persona unique ». L'idée d'« Étape 0 / persona primaire » évoquée dans la discussion est
> donc adoptée — et **généralisée** : l'Étape 0 tourne *toujours*, pas seulement dans le cas extrême.

### 4.1 Étape de normalisation — optionnelle, en préalable (styles de réponse)

> ⚠️ **Note de numérotation —** la normalisation est un *préalable* facultatif appliqué aux données
> avant le mining. Elle est distincte de l'« Étape 0 » du régime dual (§4.0, le cœur de cible) : pour
> éviter la confusion, elle n'est pas numérotée. La suite garde la numérotation V1 (mining = Étape 1, etc.).

Proposer (et **comparer dans le harness**) :
- **Brut** (référence) ;
- **Centrage par répondant** (ipsatisation : `x'_iq = x_iq − moyenne_i`) pour neutraliser
  sur/sous-estimation et acquiescence ;
- éventuellement **standardisation par item** (ramener chaque question à la même échelle).

Décision *data-driven* : on garde la variante qui maximise le recouvrement ARI sur vérité
terrain, **pas par dogme**.

> 💡 **En clair — l'ipsatisation :** certains répondants notent toujours haut (4–5), d'autres toujours
> bas (1–2). L'ipsatisation = retrancher à chaque personne *sa propre moyenne*, pour ne garder que la
> *forme* de ses préférences. Alice (5,4) et Bob (3,2) « disent » tous deux « je préfère X à Y » ;
> après centrage, on voit qu'ils ont la **même structure** de préférence.

> 🔄 **Amendement A2 — OFF par défaut, activable, impact visible.** Conformément à la crainte du
> biais : l'ipsatisation **n'est pas activée par défaut**. C'est un **bouton** dans l'UI ; l'activer
> relance le calcul et montre l'effet (combien de répondants changent de groupe, comment l'ARI bouge).
> On garde aussi la variante brute comme référence, et le harness tranche empiriquement.

> ⚠️ **Nuance / correction — la crainte du biais est fondée, et il y a même un biais que la discussion
> n'a pas mentionné.** Au-delà du « si tu mesures la satisfaction globale type NPS, tu perds l'info de
> niveau » (correct : Alice adore, Bob déteste, et l'ipsatisation les rapproche à tort), l'ipsatisation
> a un **effet mathématique secondaire** : en forçant la moyenne de chaque répondant à 0, elle crée une
> **dépendance négative artificielle** entre les questions (si on monte une réponse, une autre doit
> baisser pour compenser). Cela peut **fabriquer des corrélations qui n'existent pas**. Raison de plus
> pour : OFF par défaut, activation consciente, et comparaison mesurée avant/après. *On ne l'interdit
> pas — on refuse qu'elle agisse dans ton dos.*

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

> 💡 **En clair —** formule de l'espérance : `e = n · Π p_k`. Traduction : « combien de personnes
> *devraient* satisfaire ce motif par pur hasard » = nombre total × (popularité de la 1ʳᵉ condition)
> × (popularité de la 2ᵉ) × … On compare ensuite l'observé `o` à ce `e`. Plus `o` dépasse `e`, plus
> le motif est « surprenant » donc digne d'être un persona.
>
> Deux façons de chiffrer l'écart : le **lift** = `o / e` (« combien de fois plus que le hasard », ex.
> 25/8 ≈ 3×) ; et la **probabilité de queue (binomiale)** = « quelle chance d'observer *au moins* `o`
> par pur hasard » (quasi nulle ⇒ très surprenant). La proba de queue est plus rigoureuse car elle
> tient compte de la taille de l'échantillon.

Pourquoi c'est le bon levier : la surprise **normalise automatiquement** pour le nombre de
questions *et* la taille de groupe — ce qui répond directement au piège probabiliste de §2.3.
Un petit groupe très spécifique et un grand groupe peu spécifique deviennent **comparables** sur
une même échelle.

> ⚠️ Le modèle nul d'indépendance est une simplification (les items corrèlent). On l'assume
> comme *heuristique de tri*, et on **adosse la stabilité** (§4.5) pour ne pas se faire avoir
> par des artefacts. (Développé en §6.)

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
  profils rares), pas un échec. C'est exactement l'intuition sur C11 (§2.6).

> 💡 **En clair —** la qualité d'un persona = (force du signal = surprise) × (filtre sur la taille).
> - `τ_taille` (« tau taille ») = taille minimale pour qu'un groupe compte. **Relative**, pas absolue :
>   p. ex. « ≥ 5–8 % des répondants », avec un **plancher** (« mais jamais moins de 3 »). Ainsi sur 50
>   répondants on exige ~5 membres, sur 500 on exige ~40. (C'est la question « 2 sur 10 ≠ 2 sur 100 » :
>   2/10 = 20 % = segment majeur ; 2/100 = 2 % = bruit.)
> - `τ_dim` (« tau dimension ») = nombre minimal de questions discriminantes pour qu'un persona soit
>   descriptible.
> - `f_taille` **pénalise** sous le seuil et **sature** au-dessus (un persona géant n'est pas « 10×
>   meilleur »).

### 4.4 Étape 3 — Appartenance douce (optionnel, mais répond à l'audio)

Au lieu d'une assignation dure, reporter pour chaque répondant une **force d'appartenance** à
chaque persona (à la LCA). Conséquence directe : un répondant peut matcher **0** persona (→ `U`),
**1** (cas net), ou **plusieurs** (personas qui se recouvrent — l'audio se le demande
explicitement). À arbitrer côté produit (§6) : richesse vs lisibilité de la fiche.

> 💡 **En clair —** « appartenance dure » = un répondant est rangé dans 1 seul groupe, point.
> « Appartenance douce » = on dit « 80 % Persona A, 20 % Persona B » (à la LCA). Ça gère les profils
> hybrides et les répondants qui matchent 0, 1 ou plusieurs personas.

> 🔄 **Amendement (validé dans la discussion) —** par **défaut : dur et lisible** (« un persona = une
> fiche »). Le **doux en option**, affiché comme un détail (les pourcentages) pour qui veut creuser.
> C'est l'arbitrage approuvé.

### 4.5 Étape 4 — Sélection de modèle : subspace-aware + stabilité

- **Corriger la silhouette** : évaluer la cohésion de chaque cluster sur **son propre
  sous-espace `S_g`**, pas en espace complet — pour ne plus pénaliser la structure recherchée
  (sinon on reproduit la faille n°1, déjà confirmée par le test `k=4` vs `k=5`, §2.6).
- **Ajouter la stabilité** : bootstrap (rééchantillonner répondants/items), re-clusteriser,
  mesurer la **reproductibilité** des personas (p. ex. ARI moyen entre runs). Un persona stable
  est crédible ; un persona qui se désagrège sous resampling est probablement un artefact. La
  stabilité aide aussi à choisir le nombre de groupes sans imposer un `k`.

> 💡 **En clair —** « bootstrap » = relancer le calcul plusieurs fois en retirant/ré-piochant quelques
> répondants, et regarder si les mêmes personas ressortent. Solide = on garde ; instable = on se méfie.

### 4.6 Étape 5 — Exposer le compromis (« l'outil pour jouer »)

Répondre à *« un seul algo ou un outil pour jouer ? »* : **les deux**. Un réglage par défaut
raisonnable, **plus** un contrôle :
- soit **un curseur** `λ` (« peu de gros groupes grossiers ↔ beaucoup de petits groupes nets »)
  qui déplace l'arbitrage **couverture ↔ spécificité** ;
- soit l'affichage de **2–3 solutions de Pareto** pré-calculées (comme le multi-*k* actuel) entre
  lesquelles l'utilisateur bascule.

C'est cohérent avec l'UX existante (tags *k* cliquables, multi-*k* pré-calculé) — on généralise
le principe « **pré-calcule plusieurs vues, laisse l'humain trancher** ».

> 💡 **En clair — « front de Pareto » :** quand deux objectifs s'opposent (personas *précis* vs
> personas *qui couvrent beaucoup de monde*), il n'y a pas une seule meilleure solution, mais une
> petite famille de bons compromis. On en présente 2–3 (réglage « fin / moyen / large ») et tu choisis
> selon ton contexte.

---

## 5. Protocole de validation (le socle)

> **Rien ne se décide sans mesure.** Ce harness est le premier livrable, *avant* toute refonte
> du moteur : il quantifie où l'existant échoue et sert de juge à toute évolution.

> 💡 **En clair — « harness »** = banc d'essai automatisé. Un programme qui lance l'algo des milliers
> de fois sur des données dont on connaît la réponse, et lui donne une note objective. Il remplace le
> « ça a l'air bien » par « ARI = 0,82 ».

### 5.1 Validation externe sur vérité terrain

- Récupérer la colonne `Persona` de `persona-demo-50.csv` comme **référence** (aujourd'hui jetée).
- Mesurer **ARI** et **pureté** entre clusters trouvés et personas plantés.
- **Baselines** : `greedy-correlation` et `subspace-cohesion` actuels, plus un k-means/k-modes
  naïf comme repère bas. Objectif : un tableau « méthode × score » qui *chiffre* l'écart que
  l'audio a constaté qualitativement.

> 💡 **En clair — « baseline »** = point de comparaison minimal (le placebo). Si le nouvel algo
> sophistiqué ne bat pas l'algo bête, il ne sert à rien. **Et** le test du §2.6 fournit déjà une
> baseline qualitative : « à k=5, l'actuel reconstruit les personas » — le nouveau devra faire *aussi
> bien, mais sans qu'on ait à forcer le k à la main*.

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

> 💡 **En clair —** au lieu de tester sur de vraies données imprévisibles, on fabrique de faux
> sondages *dont on connaît la vérité*, en y injectant volontairement du bruit et des trolls, pour
> voir à quel moment l'algo « craque ».

### 5.3 Ablations

Isoler la contribution de chaque levier : **brut vs ipsatisé** ; **surprise vs support brut** ;
**silhouette espace-complet vs subspace** ; **avec vs sans classe `U`**. **On ne garde un levier
que s'il améliore le score**, pas par principe.

> 💡 **En clair — « ablation »** = on retire une brique (ipsatisation, classe U, surprise…) et on
> regarde si le score baisse. Si retirer une brique ne change rien → elle est inutile → on la
> supprime. Ça garde le code léger.

### 5.4 Critères de succès (à fixer ensemble)

À discuter, mais ordre de grandeur proposé : sur le **jeu étiqueté**, **ARI ≥ 0,7** dans le régime
« propre », et **dégradation lente** (pas de falaise) quand on injecte bruit/outliers — la
*robustesse* compte autant que le pic.

> 💡 **En clair —** 1,0 = perfection ; 0,7 = très fiable. « Pas de falaise » = si tu ajoutes 5 trolls,
> le score doit passer de 0,70 à ~0,68, pas s'effondrer à 0,10. La robustesse distingue le prototype
> de labo de l'outil pro.

---

## 6. Discussion — limites, risques, arbitrages produit

- **Explosion combinatoire** du mining quand `p` grandit → bornes, motifs fermés/maximaux,
  caps de profondeur. À surveiller dès le générateur (§5.2 grand `p`).

> 💡 **En clair —** plus il y a de questions, plus le nombre de combinaisons à tester explose ; le
> calcul peut geler. Garde-fous : **motifs fermés/maximaux** (ne garder que les motifs « résumés »,
> pas leurs sous-variantes redondantes) et **caps de profondeur** (« arrête de chercher au-delà de
> tant de questions combinées »).

- **Modèle nul imparfait** (items corrélés) → la surprise est une *heuristique de tri*, pas une
  vérité ; la stabilité (§4.5) sert de garde-fou.

> 💡 **En clair — pourquoi « modèle nul », et pourquoi « imparfait » :**
> - « **modèle nul** » = l'hypothèse « il n'y a rien, tout est pur hasard ». C'est le point de
>   référence pour mesurer la surprise. Il est « nul » au sens de *vide / absence d'effet*, pas au
>   sens de « mauvais ».
> - « **imparfait** » = ce point de référence suppose que les questions sont *indépendantes*. Or, dans
>   un vrai questionnaire, elles sont liées par la logique humaine (« l'appli est rapide » et « l'appli
>   est efficace » → on répond pareil par bon sens, pas par hasard). L'algo, lui, ne comprend pas le
>   sens des phrases : il peut crier « surprise ! » alors qu'il a juste redécouvert que tes deux
>   questions sont cohérentes → **faux persona**.
> - **garde-fou** : la **stabilité** (§4.5). La surprise est une *heuristique de tri* (un radar qui
>   dit « regarde par ici »), pas une preuve. On confirme ensuite par la stabilité et par le jugement métier.

- **Appartenance douce / personas chevauchants** : gain analytique réel, **mais** tension avec
  le récit produit « un persona = une fiche actionnable ». Arbitrage : par défaut dur et lisible,
  détail doux en option (§4.4).
- **UX du compromis** : curseur/Pareto = puissance, mais risque de surcharge cognitive. Garder
  un défaut qui « marche tout seul ».
- **Petits `n`** : l'audio parle de centaines, mais parfois moins → puissance statistique limitée ;
  le plancher `τ_taille` et la stabilité évitent de sur-interpréter ; l'outil doit pouvoir dire
  « pas assez de données pour conclure ».
- **La vérité terrain est une construction humaine** : retrouver *tes* étiquettes n'est pas
  retrouver une vérité objective. L'ARI est *un* signal, à croiser avec la stabilité et le
  jugement métier — pas un juge absolu.
- **Risque de sur-ingénierie** : la cible reste un produit utile. Si les baselines corrigées
  (silhouette subspace + classe `U`) suffisent sur le harness, on s'arrête là. **Le harness tranche.**

---

## 7. Décision & séquencement (amendé)

> 🔄 **Amendement A4 — architecture : un module séparé, l'actuel conservé.**
> Décision : **ne pas modifier le module persona actuel.** On construit la refonte à côté
> (nouveau moteur + nouveau parcours), l'ancien reste accessible comme **référence / démo / baseline**
> — ce que le test du §2.6 justifie pleinement (l'actuel « contient de l'or »).
>
> Recommandation d'implémentation (quand on y sera) : un nouveau `lib/persona-v2/` (le moteur) et une
> nouvelle route (p. ex. `/persona-lab` ou `/persona/v2`), **mais en réutilisant les composants de
> visualisation existants** (radar, heatmap, échelles de Likert, légende) plutôt qu'en les dupliquant.
>
> ⚠️ **Petit challenge —** garder l'ancien « au cas où » est sain, *à condition* de ne pas figer deux
> produits divergents pour toujours. Quand le v2 battra le v1 sur le harness, le v1 devient
> officiellement la *démo legacy*. Sinon on maintient deux moteurs à vie.

Ordre par **ROI décroissant / coût croissant** — chaque étape produit une mesure avant la suivante :

1. **Harness de validation + baselines** (§5.1, §5.3). Peu coûteux, très informatif : chiffre
   *où et de combien* l'existant échoue. **Prérequis de tout le reste.**
2. **Générateur synthétique** (§5.2). Débloque les réponses aux questions ouvertes de l'audio.
3. **Corrections à fort levier, faible risque** : silhouette **subspace-aware** (§4.5) +
   **classe `U`** (§4.3) + activation **MH/ML** (§4.2) + **Étape 0 (cœur de cible)** (§4.0).
   Probablement le meilleur rapport gain/effort. (Les deux premières sont déjà *validées* par le
   test du §2.6.)
4. **Scoring par surprise** (§4.2) en remplacement du score figé.
5. **Normalisation optionnelle** (§4.1), gardée seulement si l'ablation le justifie.
6. **Appartenance douce** (§4.4) + **UX du compromis** (§4.6) + **comparateur** (§8) : en dernier,
   une fois le moteur fiable et mesuré.

> Garde-fou : on ne passe à l'étape *n+1* que si l'étape *n* a **amélioré une métrique** du
> harness (ou clarifié une décision). Pas d'ajout « parce que c'est élégant ».

---

## 8. 🔄 Amendement A3 — Principes produit : transparence, contrôle, pédagogie

C'est le fil rouge demandé : l'outil doit **accompagner l'utilisateur dans la compréhension** du
processus, pas être une boîte noire. Aligné avec la valeur OpenScribe « pipelines en étapes
vérifiables, pas de boîte noire unique » (BLUEPRINT §1).

1. **Pipeline explicite et inspectable.** Reprendre le principe du `pipeline-stepper` du module CSV :
   chaque étape (normalisation → mining → scoring → sélection → assignation → cœur de cible) est une
   **carte visible** dans l'UI, avec son résultat intermédiaire et un « pourquoi » en une phrase.

2. **Chaque terme expliqué inline.** Tout mot technique affiché (silhouette, surprise, `U`, subspace…)
   a une infobulle « En clair » comme celles de ce document. La pédagogie est *dans le produit*, pas
   seulement dans la doc.

3. **Tout réglage activable / désactivable, avec impact recalculé.** Ipsatisation, classe `U`, choix
   de la métrique, seuils `τ` : chaque bascule relance et **montre l'effet** (qui change de groupe,
   comment l'ARI/la stabilité bougent). C'est le « plein contrôle ».

4. 🔄 **Amendement A6 — Comparateur de stratégies.** Pouvoir lancer 2–3 configurations **côte à côte**
   (ex. « brut vs ipsatisé », « avec vs sans classe U », « surprise vs support ») et comparer les
   résultats et les scores. C'est le harness, mais **rendu à l'utilisateur** pour qu'il voie « ce qui
   marche, ce qui ne marche pas ».

5. **Défaut qui marche tout seul.** Toute cette puissance reste optionnelle : un débutant obtient un
   bon résultat sans rien régler ; un pro peut tout ouvrir. *Simple à utiliser, puissant à maîtriser.*

> ⚠️ **Garde l'équilibre —** transparence ne veut pas dire *tout montrer en même temps*. Le risque
> est la surcharge. Règle : le pipeline et les réglages sont **disponibles mais repliés** par défaut.

---

## 9. 🔄 Roadmap produit (amendée)

| Horizon | Élément | Note |
| --- | --- | --- |
| **V1 (figé)** | Module persona actuel | Conservé tel quel : référence, démo, baseline du harness. Non modifié. |
| **V2 (cette refonte)** | Nouveau moteur + parcours : régime dual, classe `U`, métrique subspace, surprise, normalisation optionnelle, pipeline transparent, comparateur | Précédé du harness (§7). |
| **V3 (idées validées, plus tard)** | **A7 — Réassignation manuelle** : déplacer un répondant d'un groupe à l'autre dans l'UI, voir l'effet sur le persona, **sans écraser l'analyse initiale** (mode « what-if »). | Proposition utilisateur. Pont naturel entre l'algo et le jugement humain. |
| **V3** | **A8 — Fiche persona qualitative** : générer une fiche descriptive (récit, besoins, citations) à partir des résultats quantitatifs. | Proposition utilisateur. Probablement un appel LLM, cohérent avec les autres modules. |

> 💡 **En clair — pourquoi A7 (réassignation) est puissant :** l'algo n'a jamais le dernier mot. Si tu
> *sais* qu'un répondant appartient au groupe 1, tu l'y mets et l'outil te montre instantanément
> l'impact (le persona devient-il plus net ? la signature change-t-elle ?). C'est l'inverse de la boîte
> noire : l'humain et la machine collaborent. À cadrer côté UX (sans doute pas dès la première version
> du nouveau moteur).

---

## Annexe A — Intuition de l'audio → concept → action

| Intuition (audio) | Concept établi | Action proposée |
| --- | --- | --- |
| Trouver ensemble questions discriminantes + groupes | Subspace / projected clustering | Garder & généraliser le mining (§4.2) |
| « 20×4 » vs « 2×9 » | Compromis support × dimensionnalité | Objectif explicite + curseur/Pareto (§4.3, §4.6) |
| Taille minimale pour être actionnable | Contrainte de support min (relative) | `τ_taille` de 1er plan (§4.3) |
| Exclure les répondants au hasard | Classe bruit / outliers | Classe `U` + seuil de confiance (§4.3) — *validé par C11* |
| Sur/sous-estimateurs décalés | Styles de réponse / ipsatisation | Centrage **optionnel**, testé, OFF par défaut (§4.1) |
| « +N questions = bruit qui parasite » | Robustesse à la dimensionnalité | Surprise (§4.2) + courbes ARI (§5.2) |
| Groupes de tailles différentes | Clusters déséquilibrés | Lever le forçage `n/k` (§4.3) |
| Coexistence gros/grossier & petit/net | Front de Pareto | Exposer 2–3 solutions (§4.6) |
| « Tous les groupes même taille ? » | (Non) partition équilibrée | Non : tailles libres (§4.3) |
| « 1 seul persona si tout le monde répond pareil ? » | Statistique descriptive vs découverte | **Régime dual / Étape 0** (§4.0) |
| « 1 algo ou un outil pour jouer ? » | Optimisation multi-objectif + transparence | Défaut + contrôle + comparateur (§4.6, §8) |
| Comprendre le processus | Pas de boîte noire | Pipeline explicite + termes expliqués inline (§8) |

## Annexe B — Pointeurs code (état `main`)

- Matrice de co-accord ±1 : `lib/persona/clustering.ts:31`
- Seuil dynamique `moyenne+σ` : `lib/persona/clustering.ts:48`
- `greedy-correlation` (fonction) : `lib/persona/clustering.ts:62` · tailles `≈ n/k` : `:69`
- `subspace-cohesion` (fonction) : `lib/persona/clustering.ts:460`
- Sélection de *k* (silhouette) : `lib/persona/clustering.ts:199` · distance espace complet : `:221`, `:232`
- Mining limité H/L : `lib/persona/clustering.ts:303`
- Score de graines figé : `lib/persona/clustering.ts:391`
- Signatures (variance intra ≤ 0.8) : `lib/persona/clustering.ts:181`
- Assignation forcée (pas de classe bruit) : `lib/persona/clustering.ts:151`, `:483`
- Vérité terrain jetée : `app/persona/new/page.tsx:70` (+ sample `app/persona/page.tsx:16`)

## Annexe C — Glossaire exhaustif (tous les termes, avec exemple)

| Terme | En clair | Exemple |
| --- | --- | --- |
| **Donnée ordinale (Likert)** | Notes ordonnées mais sans écart exact | « Pas d'accord » (1) → « D'accord » (5) |
| **Matrice répondants × items** | Ton tableur : lignes = gens, colonnes = questions | 50 lignes × 11 colonnes |
| **`n` / `p` / `L`** | Nb répondants / nb questions / note max | n=50, p=11, L=5 |
| **Clustering** | Regrouper les répondants qui se ressemblent | « les écolos » |
| **Espace complet** | Comparer sur *toutes* les questions | 11/11 |
| **Sous-espace (subspace)** | Comparer sur *quelques* questions choisies par groupe | 4 questions sur 11 |
| **Variable discriminante** | Question qui sépare les gens en groupes | « lis-tu beaucoup ? » |
| **Biclustering** | Grouper lignes ET colonnes ensemble | un rectangle dans le tableur |
| **Classes latentes (LCA)** | Persona caché, déduit par probabilités | « 70 % A, 30 % B » |
| **Itemset mining / Apriori** | Trouver des combinaisons de réponses fréquentes | « 5 à Q1 ⇒ souvent 1 à Q4 » |
| **Graine (seed)** | Petit motif de départ d'un persona | « 5 personnes, 3 réponses communes » |
| **Matrice de co-accord** | Compte sur combien de questions deux personnes sont d'accord (écart ≤ 1) | i & j d'accord sur 7/11 |
| **Transitivité (non)** | A≈B et B≈C n'implique pas A≈C (effet de chaîne) | 5–4–3 : 5 et 3 pas d'accord |
| **`k`** | Nombre de groupes demandés | k=5 |
| **Silhouette** | Note (−1 à 1) jugeant cohésion + séparation des groupes | 0,42 |
| **Cohésion / Séparation** | Membres serrés / groupes éloignés entre eux | — |
| **Variance intra** | Désaccord *à l'intérieur* d'un groupe (0 = tous pareil) | 0,2 = très d'accord |
| **Signature** | Questions qui décrivent un persona (faible variance intra) | « tri sélectif ↑ » |
| **Support** | Taille d'un groupe / motif | 20 personnes |
| **Spécificité** | Nb de variables discriminantes d'un persona | 4 questions |
| **Couverture** | Fraction de répondants classés | 90 % |
| **Pureté** | Netteté des groupes (peu de bruit dedans) | — |
| **Surprise / lift** | Écart entre observé et hasard attendu | 25 trouvés / 8 attendus = ×3 |
| **Modèle nul** | Hypothèse « tout est hasard », sert de référence | indépendance des questions |
| **Espérance `e = n·Π p_k`** | Effectif attendu par pur hasard | 100 × 0,8 × 0,1 = 8 |
| **Probabilité de queue (binomiale)** | Chance d'observer *au moins* `o` par hasard | ≈ 0 ⇒ très surprenant |
| **`U` (non assignés)** | Bac des répondants exclus (trolls, profils rares) | 2 répondants C11 |
| **Outlier** | Répondant atypique (troll, échelle inversée, ultra-niche) | clique tout à 1 |
| **Ipsatisation** | Centrer chaque répondant sur sa moyenne (annule son « style ») | (5,4) → (+0,5 ; −0,5) |
| **Standardisation par item** | Ramener chaque question à la même échelle | — |
| **`τ_taille` / `τ_dim`** | Seuils minimaux : taille de groupe / nb de questions | ≥ 5–8 % de n ; ≥ 3 questions |
| **Front de Pareto** | Famille de bons compromis quand 2 objectifs s'opposent | « fin / moyen / large » |
| **Curseur `λ`** | Réglage couverture ↔ spécificité | gros/grossier ↔ petit/net |
| **Appartenance dure / douce** | 1 seul groupe / pourcentages multi-groupes | « A » vs « 80 % A, 20 % B » |
| **ARI (Adjusted Rand Index)** | Note de comparaison aux étiquettes vraies | 0 = hasard, 1 = parfait |
| **Pureté (validation)** | % d'un cluster appartenant au même vrai groupe | 0,9 |
| **NMI** | Autre mesure de recouvrement de partitions | — |
| **Baseline** | Algo de comparaison minimal (placebo) | k-means naïf |
| **Harness** | Banc d'essai automatisé | lance l'algo 1000× |
| **Ablation** | Retirer une brique pour mesurer son utilité | sans ipsatisation : −0 ? |
| **Stabilité / bootstrap** | Le persona réapparaît-il sous rééchantillonnage ? | relancer sur 45/50 |
| **Cœur de cible (Étape 0)** | Le profil global majoritaire, décrit même sans sous-groupes | « 80 % veulent X » |
| **Explosion combinatoire** | Trop de combinaisons à calculer quand `p` grandit | 100 questions |
| **Motifs fermés/maximaux** | Garder les motifs « résumés », pas les redondants | anti-explosion |

---

*V3 = fusion intégrale de la V1 ([`THESE-PERSONA.md`](./THESE-PERSONA.md), référence épurée) et de la
V2 ([`THESE-PERSONA-V2.md`](./THESE-PERSONA-V2.md), pédagogique & amendée), rédigée à partir des
échanges de juin 2026. Aucun détail V1 n'est perdu ; toute la pédagogie et les amendements V2 sont
conservés. Prochaine étape inchangée : valider/amender cette thèse, puis attaquer le §7.1 (harness) —
sans toucher au moteur actuel tant qu'on n'a pas de mesure.*
