# Personas — Note de conception **V2** (annotée & amendée)

> **Ce document est une V2 pédagogique de [`THESE-PERSONA.md`](./THESE-PERSONA.md).**
> La V1 reste intacte comme version « épurée » de référence. Cette V2 :
> 1. **explique chaque terme technique et chaque formule** au fur et à mesure (encarts « En clair »),
>    pour qu'on puisse tout suivre sans bagage maths/stats ;
> 2. **intègre les amendements** issus des échanges de juin 2026 (réflexion audio + dialogue
>    de clarification avec un assistant) ;
> 3. **corrige / nuance** quelques explications de ces échanges là où elles étaient imprécises.
>
> **Format :** même squelette **IMRaD** allégé que la V1 (Introduction → Méthode → Validation →
> Discussion) + encarts pédagogiques. **La V2 est un sur-ensemble strict de la V1** : rien n'a été
> retiré sur le fond ; le seul changement de fond est la normalisation, passée d'« obligatoire » (V1)
> à « optionnelle / OFF par défaut » (V2, amendement A2). Voir la note de complétude après le journal
> des amendements.
>
> Principe tenu : *on ne minimise pas la complexité, on l'explique.* Si une mécanique complexe
> donne un meilleur résultat, on la garde — mais on la rend compréhensible et contrôlable.
>
> Statut : *proposition vivante*. Rien n'est codé. Aucune ligne du module persona actuel n'est modifiée.

---

## Comment lire ce document

Trois types d'encarts ponctuent le texte :

> 💡 **En clair —** traduction sans jargon d'un terme ou d'une formule.

> 🔄 **Amendement (discussion) —** ajout ou changement par rapport à la V1, issu des échanges.

> ⚠️ **Nuance / correction —** un endroit où je précise, ou corrige une explication trop simplifiée.

Un **glossaire exhaustif** en Annexe C reprend *tous* les termes, classés, avec un exemple à chaque fois.

---

## Journal des amendements (V2 vs V1)

| # | Amendement | D'où ça vient | Où dans le doc |
| --- | --- | --- | --- |
| A1 | **Régime dual** : décrire d'abord le *cœur de cible* (profil global), puis chercher les *sous-personas*. L'outil ne doit jamais renvoyer un écran vide quand tout le monde se ressemble. | Ta question « et si tout le monde répond pareil, 1 seul persona ? » | §4.0 (nouveau) |
| A2 | **Ipsatisation OFF par défaut**, activable via un bouton dans l'UI, avec impact re-calculé et visible. + nuance sur son biais mathématique. | Ta crainte du biais + volonté de contrôle | §4.1, §8 |
| A3 | **Principe directeur produit : pipeline transparent et contrôlable.** Chaque étape visible, chaque terme expliqué inline, chaque réglage activable/désactivable. | Ta volonté « plein contrôle + compréhension » | §8 (nouveau) |
| A4 | **Décision d'architecture : nouveau module séparé** (`persona v2`), l'actuel est conservé tel quel (référence/démo/baseline). | Ta crainte de « tout casser » | §7, §9 |
| A5 | **Validation empirique déjà observée** : à *k=5 forcé*, l'algo actuel reconstruit tes personas et trouve même une variable que tu avais ratée ; la variable C11 est un cas d'école de « 2 répondants à exclure ». | Ton test dans la discussion | §2.6, §5.1 |
| A6 | **Comparateur de stratégies** dans l'UI : lancer plusieurs réglages côte à côte et comparer. | Ta demande de comparer ce qui marche | §8 |
| A7 | **Réassignation manuelle** (déplacer un répondant d'un groupe à l'autre, voir l'effet, sans écraser l'analyse) — étape produit ultérieure. | Ta proposition | §9 |
| A8 | **Génération d'une fiche persona qualitative** à partir des résultats — étape produit ultérieure (V3). | Ta proposition | §9 |

> ✅ **Note de complétude (V2 ⊇ V1) —** après **deux passes** de vérification, tout le contenu de la V1
> est repris ici.
> *1ʳᵉ passe :* tableau d'audit du code (§2.4, dont la ligne « sélection de *k* »), références
> littérature (PROCLUS/CLIQUE/DOC, NMI, taxonomie des styles de réponse), probabilité de queue
> binomiale (§4.2), 3ᵉ option de normalisation (§4.1), 4 courbes du générateur (§5.2), 2 lignes du
> tableau audio→concept (Annexe A).
> *2ᵉ passe :* la puce **« Séquencement »** du TL;DR, le paragraphe **« pourquoi la surprise est le
> bon levier »** (§4.2), « comparable aussi entre tailles de groupe » (§2.3), « la stabilité aide à
> choisir *k* » (§4.5), l'objectif « tableau méthode × score » (§5.1), « une moyenne qui ne correspond
> à personne » (§1.1).
> Seul **changement de fond assumé** : normalisation optionnelle au lieu d'obligatoire (A2).

---

## 0. TL;DR (pour décider vite)

- **Le bon nom du problème** : *clustering en sous-espaces (subspace / projected clustering)
  de données ordinales (Likert)*, pour découverte de personas, avec sélection de variables
  par cluster, robustesse au bruit, et **droit d'exclure** des répondants. Voisins utiles :
  biclustering, modèles à classes latentes (LCA), pattern mining.

> 💡 **En clair —** on cherche des groupes de répondants qui se ressemblent **seulement sur
> quelques questions bien choisies** (leur « sous-espace »), pas sur l'ensemble du questionnaire ;
> et on s'autorise à mettre de côté les répondants qui ne collent à aucun groupe.

- **L'acquis est bon** : l'algorithme `subspace-cohesion` existant est, sans le nommer, du
  *frequent-itemset mining* (Apriori). C'est la bonne intuition.

> 💡 **En clair —** « frequent-itemset mining / Apriori » = la technique inventée pour les tickets
> de caisse (« qui achète des couches achète souvent de la bière »). Ici : « qui répond 5 à la Q1
> répond souvent 1 à la Q4 ». On cherche des **combinaisons de réponses fréquentes**.

- **Le maillon manquant central** : il existe une **vérité terrain** (`persona-demo-50.csv`,
  colonne `Persona`, 5 groupes ×10) que le code **jette**. Donc rien ne mesure si l'algo a « bon ».

> 💡 **En clair —** « vérité terrain » = le corrigé. Tu as toi-même étiqueté les 50 répondants
> avec des emojis (🟣🔵🟡🟠🟢). Le code supprime cette colonne avant de calculer ⇒ il ne sait jamais
> s'il est tombé juste.

- **Trois failles** dans l'existant : (1) la métrique qui choisit le nombre de groupes (silhouette)
  travaille « en espace complet » et **se bat contre** la méthode subspace ; (2) aucune classe
  « non assigné » alors qu'il faut pouvoir exclure ; (3) le compromis taille↔précision est **figé**
  dans une formule cachée. **Les trois sont confirmées par ton test** (§2.6).

- **Proposition** : refondre autour d'un **objectif explicite**, scorer les motifs par **surprise
  statistique** (et non par simple comptage), ajouter une **classe bruit**, rendre la **normalisation
  optionnelle**, et **valider** sur vérité terrain + données synthétiques.

- **Séquencement** : d'abord le **harness de validation + baselines** (peu coûteux, très informatif),
  puis le **moteur**, puis l'**UX du compromis**. Détails en §7.

- 🔄 **Amendement A1** : avant de chercher des sous-groupes, **décrire le profil global** (cœur de
  cible). S'il n'y a qu'un seul profil, c'est une réponse valable, pas un échec.

- 🔄 **Amendement A4** : on construit ça dans un **module séparé**, sans toucher au persona actuel.

---

## 1. Introduction — contexte & objectif

### 1.1 Pourquoi des personas

Un persona condense des centaines de répondants en quelques fiches actionnables : besoins,
problématiques, contexte d'usage. Si une fiche capture fidèlement un groupe, on peut concevoir un
produit *pour ce groupe* plutôt que pour **une moyenne qui ne correspond à personne**. La valeur n'est
pas « faire des clusters » mais **faire des clusters dont on peut faire quelque chose** : assez gros
pour compter, assez nets pour se décrire en une fiche.

> 💡 **En clair —** « cluster » = groupe. « Actionnable » = sur lequel on peut décider quelque chose
> (prioriser une fonctionnalité, adapter un design). Un persona de 2 personnes est rarement actionnable.

> **Cadrage B2C vs B2B.** En B2B on se rabat souvent sur la fiche de poste (« infirmières » vs
> « médecins ») — une facilité qui masque des personas transverses (le « technophile pressé » existe
> chez les deux). La méthode doit *découvrir* la structure, pas la présupposer ⇒ rester **agnostique
> au domaine**.

> 💡 **En clair —** « agnostique au domaine » = l'algorithme regarde les *comportements de réponse*,
> sans rien savoir du métier ou du titre des gens. Il déduit les groupes, au lieu de plaquer des
> étiquettes connues d'avance.

### 1.2 La tâche, concrètement

Entrée : une **matrice répondants × items**, valeurs ordinales (typiquement 1–5).

> 💡 **En clair —** « matrice répondants × items » = ton tableur exporté. Lignes = répondants,
> colonnes = questions, cases = notes. « Ordinale » = il y a un ordre (5 > 4 > … > 1) mais l'écart
> entre 4 et 5 n'est pas une mesure exacte comme des centimètres. C'est le propre des échelles de Likert
> (« Pas du tout d'accord » → « Tout à fait d'accord »).

On ne sait **pas à l'avance** quelles questions sont discriminantes ni combien de groupes existent.

Sortie souhaitée : un petit ensemble de personas, **chacun défini par** (a) ses membres, (b) ses
**variables discriminantes** propres, (c) une direction/profil — **plus** un éventuel ensemble de
répondants **inclassables**.

> 💡 **En clair —** « variable discriminante » = une question qui *sépare* les gens en groupes. Si
> tout le monde répond pareil à une question, elle ne discrimine personne (elle ne sert pas à faire
> des groupes). « Direction » = le sens de la réponse (plutôt 5, plutôt 1…).

### 1.3 Le geste qu'on automatise

Historiquement, le researcher repère « à l'œil » des convergences de comportement sur certaines
questions : *« tiens, ces gens répondent pareil sur ces questions-là »*. Trop coûteux à la main
au-delà de quelques dizaines de répondants. **On automatise ce repérage de convergences locales** —
pas un clustering géométrique générique.

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

> 💡 **En clair —** c'est juste la description de ton fichier : `X` le tableau, `n` le nombre de
> lignes (répondants), `p` le nombre de colonnes (questions), `{1..L}` les notes possibles (1 à 5).
> Ne te laisse pas impressionner par la notation.

On cherche des personas `g = (M_g, S_g, d_g)` plus un ensemble `U` (non assignés). C'est du
**projected clustering** : chaque cluster vit dans **son propre sous-espace** `S_g` et **tolère que
ses membres divergent** sur les variables *hors* de `S_g`.

> 💡 **En clair —** un persona = un trio :
> - `M_g` (**M**embres) : *qui* est dedans (ex. répondants 12, 45, 89) ;
> - `S_g` (**S**ous-espace) : *sur quelles questions* il se définit (ex. Q3, Q4, Q8) ;
> - `d_g` (**d**irection) : *quelles réponses* sur ces questions (ex. « 5 partout »).
>
> `U` = le « bac » des inclassables (les répondants qu'on n'a pas forcés dans un groupe).

### 2.2 Le double compromis (le cœur de ta réflexion audio)

Pour un motif candidat, tension entre :

- **support** `|M_g|` — combien de répondants le satisfont → *actionabilité* ;
- **spécificité** `|S_g|` — combien de variables discriminantes → *richesse descriptive* ;
- **cohésion** — à quel point les membres convergent vraiment sur `S_g` ;

et, globalement, entre **couverture** (fraction de répondants assignés) et **pureté** (ne pas forcer
du bruit dans les groupes).

> 💡 **En clair —** ton exemple audio : « 20 personnes / 4 questions communes » vs « 2 personnes /
> 9 questions ». Le **support** = la taille du groupe (20 vs 2). La **spécificité** = le nombre de
> questions partagées (4 vs 9). La **cohésion** = sont-ils *vraiment* serrés sur ces questions.
> **Couverture** = ai-je classé beaucoup de monde ? **Pureté** = mes groupes sont-ils nets ?
> Maximiser l'un fait souvent baisser l'autre : c'est *le* compromis à arbitrer.

Ton arbitrage (audio) : entre « 20 personnes / 4 questions » et « 2 personnes / 9 questions », le
premier est souvent *plus utile* — parce qu'**enlever une variable discriminante revient à renoncer
consciemment à un moyen de décrire la réalité**, en échange de membres supplémentaires. C'est un
choix de fond, pas un détail technique.

Aujourd'hui, ce compromis est **figé** dans le code (une formule cachée). On veut le **sortir au
grand jour** pour que tu puisses « jouer avec ».

### 2.3 Le piège probabiliste (audio 14:40–16:00)

Avec **peu** de questions, des petits groupes « identiques » apparaissent **par hasard** ; avec
**beaucoup** de questions, des accords exacts deviennent **improbables**. ⇒ Le **support brut n'est
pas comparable** d'un nombre de questions à l'autre, **ni d'une taille de groupe à l'autre**. ⇒ Juger
un motif par sa **surprise** (écart au hasard), pas par son support nu.

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
> non-discriminante. C'est une **force** (le consensus banal est filtré tout seul). **Mais** cela a une
> conséquence importante traitée en §4.0 : si *toutes* les questions sont consensuelles, la surprise
> ne renvoie *rien* — et il faut alors un autre mécanisme pour ne pas afficher un écran vide.

### 2.4 Ce que fait le code aujourd'hui

Deux algorithmes consomment une **matrice de co-accord** : deux répondants « s'accordent » sur un
item si `|x_iq − x_jq| ≤ 1`.

> 💡 **En clair —** règle actuelle : deux personnes sont « d'accord » sur une question si l'écart de
> leurs notes est ≤ 1 (4 et 5 → d'accord ; 3 et 5 → pas d'accord). `totalMatrix[i][j]` compte sur
> combien de questions i et j sont d'accord.

**Vue d'ensemble (audit du code existant)** — le détail pédagogique suit juste après :

| Brique | Fichier | Ce qu'elle fait | Lecture critique |
| --- | --- | --- | --- |
| `greedy-correlation` | `clustering.ts:62` | Seed (meilleure paire) + croissance sous seuil `moyenne+σ` (`:48`), tailles ≈ `n/k` (`:69`) | Espace complet ⇒ sensible au bruit ; effet de chaîne ; tailles forcées |
| `subspace-cohesion` | `clustering.ts:460` | Apriori sur motifs `(var, direction)`, graines, raffinement « Pattern-KMeans » | Bonne base. Mining limité H/L (`:303`) ⇒ MH/ML inertes ; score de graines figé (`:391`) |
| Sélection de *k* | `clustering.ts:199` | Silhouette, distance = `nQ − corrélation` (`:221`,`:232`) | Distance en espace complet ⇒ pénalise la structure subspace (faille n°1) |
| Signatures | `clustering.ts:168` | Variables à variance intra ≤ 0.8 (`:181`) | Descriptif a posteriori, OK |
| Assignation | `clustering.ts:151`, `:483` | Tout le monde est forcé dans un groupe | Pas de classe « non assigné » — contredit la volonté d'exclure |

**Algorithme 1 — `greedy-correlation`** (`clustering.ts:62`) : on part de la meilleure paire et on
fait grossir le groupe.

> 💡 **En clair — le défaut « effet de chaîne » (tolérance ±1 *non transitive*) :**
> « transitif » = si A=B et B=C alors A=C. Ici c'est faux :
> - Alice (5) et Bob (4) : écart 1 → groupés.
> - Bob (4) et Charlie (3) : écart 1 → Charlie rejoint.
> - Mais Alice (5) et Charlie (3) : écart **2** → ils ne sont *pas* d'accord !
>
> De proche en proche, le groupe devient un « blob » qui mélange des avis opposés. C'est le risque
> principal de cet algorithme.

**Algorithme 2 — `subspace-cohesion`** (`clustering.ts:460`) : Apriori sur des motifs `(variable,
direction)`, sélection de graines, raffinement.

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

**Signatures** (`clustering.ts:168`) : variables à **variance intra ≤ 0.8**.

> 💡 **En clair —** une fois le persona formé, on le *décrit* : pour chaque question, on regarde si
> ses membres sont d'accord entre eux. La « variance intra » mesure leur désaccord interne (0 = tous
> la même note ; élevé = ils sont éparpillés). Si la variance est faible (≤ 0,8 = seuil choisi), la
> question devient une « signature » du persona (« ce groupe se définit par : tri sélectif ↑, prix ~ »).

### 2.5 Trois failles à corriger en priorité

1. **La métrique se bat contre la méthode.** La silhouette mesure une distance *toutes questions
   confondues*.

> 💡 **En clair — la silhouette et le « k » :**
> - `k` = le nombre de groupes qu'on demande à l'algo de faire.
> - la **silhouette** = la note (de −1 à 1) que l'algo se donne pour juger si ses groupes sont à la
>   fois *serrés* (cohésion) et *bien séparés* des autres. On essaie k=2, 3, 4… et on garde le k qui
>   a la meilleure note.
> - **Le problème** : la silhouette juge sur *toutes* les questions. Or un persona-subspace diverge
>   exprès sur les questions *non pertinentes*. La silhouette voit cette divergence et dit « pas
>   assez serré » → elle pénalise les bons groupes et **pousse vers des solutions « compactes » de
>   type `greedy`**. C'est comme noter un sprinteur sur ses performances au décathlon.

2. **Pas de droit d'exclure.** Le code force *tout le monde* dans un groupe.
3. **Compromis caché** (la formule `longueur²×membres×pénalité`).

### 2.6 L'actif gaspillé + ta validation empirique

`persona-demo-50.csv` contient une colonne `Persona` (5 groupes ×10) : c'est la **vérité terrain**,
et elle est **jetée** (non numérique → exclue à la sélection de colonnes). On a donc un corrigé et
**aucune mesure** de l'écart.

> ⚠️ **Biais du jeu actuel —** groupes **parfaitement équilibrés** (10×5). Dans la vraie vie, tu
> auras un persona de 40 et un de 5. Ce jeu « trop parfait » *masque* la faiblesse face aux tailles
> inégales.

> 🔄 **Amendement A5 — ta validation empirique (échange de juin 2026).** Tu as observé, en testant
> l'outil actuel :
> - à **k=4** (choisi par la silhouette par défaut) les personas sont dégradés ; à **k=5 forcé**,
>   l'algo **reconstruit tes 5 personas** et **identifie même une variable que tu avais ratée**
>   (corrélation que tu n'avais pas vue). ⇒ **Confirmation directe de la faille n°1** : l'« ouvrier »
>   (le clustering) travaille bien ; c'est le « juge » (la silhouette) qui choisit mal le k.
> - sur la variable **C11**, une majorité de répondants sont cohérents mais **2 répondants
>   « cassent » le motif**. En les excluant, on obtiendrait un persona de **8 membres avec 6 variables
>   très corrélées** au lieu d'un groupe dilué. ⇒ Tu as **réinventé toi-même la classe `U`**
>   (exclusion d'outliers) : **confirmation directe de la faille n°2.**
>
> **Conséquence forte pour la stratégie : on ne jette pas le moteur actuel.** Il « contient déjà de
> l'or ». L'enjeu est de lui retirer ses deux menottes (le mauvais juge + l'obligation de tout classer),
> et de **comparer** l'ancienne et la nouvelle approche, plutôt que de repartir de zéro à l'aveugle.

---

## 3. Prior art (encarts légers — pour ne pas réinventer)

> But : ancrer le vocabulaire et **importer les bons outils**, pas rédiger une revue.

- **Subspace / projected clustering** (p. ex. PROCLUS, CLIQUE, DOC). Chaque cluster est défini sur
  *son propre* sous-ensemble de questions.

> 💡 **En clair —** « ces 15 personnes ont des avis opposés sur 16 questions, MAIS répondent pareil
> aux 4 questions sur l'écologie → persona écolo ». La sélection des questions se fait *par* cluster.

- **Biclustering.**

> 💡 **En clair —** on regroupe lignes **et** colonnes *en même temps* : on découpe un petit
> rectangle dans le tableur (« ce groupe de 30 personnes réagit pareil à ce groupe de 4 questions »).
> Une autre façon mathématique d'arriver au persona.

- **Modèles à classes latentes / mélanges (LCA).**

> 💡 **En clair —** « latent » = caché. On suppose que le vrai persona est invisible, on n'en voit que
> les symptômes (les réponses). Surtout, LCA raisonne en **probabilités** : « ce répondant a 70 % de
> chances d'être Persona A, 30 % Persona B ». C'est ce qui permet les profils hybrides (→ §4.4).

- **Pattern / itemset mining (Apriori, motifs fermés/maximaux).** Déjà à l'œuvre. À retenir :
  scorer par **surprise/lift** plutôt que support brut ; utiliser les **motifs fermés/maximaux**
  pour éviter l'explosion combinatoire.

> 💡 **En clair —** « lift » = à quel point l'observé dépasse le hasard (25 trouvés / 8 attendus →
> lift ≈ 3). « Motifs fermés/maximaux » = une astuce pour ne garder que les motifs « résumés » et ne
> pas calculer des milliards de variantes redondantes (voir §6).

- **Styles de réponse & ipsatisation.** Littérature psychométrique : acquiescence (tout valider),
  style extrême, style médian, sur/sous-estimation. Correctif classique = centrer par répondant
  (→ détaillé en §4.1).
- **Métriques de validation externe : ARI, pureté, NMI** (comparent une partition trouvée à une
  partition de référence, en corrigeant du hasard).

> 💡 **En clair —** « ARI (Adjusted Rand Index) » = la note de comparaison entre les groupes trouvés
> et ton corrigé. 1 = parfait, 0 = hasard, négatif = pire que le hasard. C'est le « chronomètre ».

- **Stabilité / consensus clustering.**

> 💡 **En clair —** un vrai persona *réapparaît* si on relance le calcul sur un échantillon
> légèrement différent (on enlève quelques répondants au hasard). S'il se désagrège, c'était sans
> doute un artefact. La stabilité = test de solidité.

---

## 4. Méthode candidate (refonte autour d'un objectif explicite)

> On garde l'acquis Apriori, on corrige les failles, on **pose l'objectif**. Chaque étape est
> indépendamment testable via le harness (§5).

### 4.0 🔄 Amendement A1 — Régime dual : cœur de cible, *puis* sous-personas

C'est l'amendement le plus important issu de la discussion. Ta question : *« et si les questions sont
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

### 4.1 Étape de normalisation — optionnelle (styles de réponse)

> 💡 **En clair — l'ipsatisation :** certains répondants notent toujours haut (4–5), d'autres toujours
> bas (1–2). L'ipsatisation = retrancher à chaque personne *sa propre moyenne*, pour ne garder que la
> *forme* de ses préférences. Alice (5,4) et Bob (3,2) « disent » tous deux « je préfère X à Y » ;
> après centrage, on voit qu'ils ont la **même structure** de préférence.

Trois variantes à proposer et **comparer dans le harness** : **brut** (référence) ; **centrage par
répondant** (ipsatisation) ; éventuellement **standardisation par item** (ramener chaque question à
la même échelle). On garde celle qui maximise l'ARI sur la vérité terrain — par la mesure, pas par dogme.

> 🔄 **Amendement A2 — OFF par défaut, activable, impact visible.** Conformément à ta crainte :
> l'ipsatisation **n'est pas activée par défaut**. C'est un **bouton** dans l'UI ; l'activer relance
> le calcul et montre l'effet (combien de répondants changent de groupe, comment l'ARI bouge). On
> garde aussi la variante brute comme référence, et le harness tranche empiriquement.

> ⚠️ **Nuance / correction — ta crainte du biais est fondée, et il y a même un biais que la discussion
> n'a pas mentionné.** Au-delà du « si tu mesures la satisfaction globale type NPS, tu perds l'info de
> niveau » (correct : Alice adore, Bob déteste, et l'ipsatisation les rapproche à tort), l'ipsatisation
> a un **effet mathématique secondaire** : en forçant la moyenne de chaque répondant à 0, elle crée une
> **dépendance négative artificielle** entre les questions (si on monte une réponse, une autre doit
> baisser pour compenser). Cela peut **fabriquer des corrélations qui n'existent pas**. Raison de plus
> pour : OFF par défaut, activation consciente, et comparaison mesurée avant/après. *On ne l'interdit
> pas — on refuse qu'elle agisse dans ton dos.*

### 4.2 Étape de mining — motifs scorés par **surprise** (≠ support brut)

Reprendre le mining, mais : **inclure MH/ML** (réponses modérées, pas seulement les extrêmes) et
**remplacer le score figé par la surprise** (§2.3).

> 💡 **En clair —** formule de l'espérance : `e = n · Π p_k`. Traduction : « combien de personnes
> *devraient* satisfaire ce motif par pur hasard » = nombre total × (popularité de la 1ʳᵉ condition)
> × (popularité de la 2ᵉ) × … On compare ensuite l'observé `o` à ce `e`. Plus `o` dépasse `e`, plus
> le motif est « surprenant » donc digne d'être un persona.
>
> Deux façons de chiffrer l'écart : le **lift** = `o / e` (« combien de fois plus que le hasard », ex.
> 25/8 ≈ 3×) ; et la **probabilité de queue (binomiale)** = « quelle chance d'observer *au moins* `o`
> par pur hasard » (quasi nulle ⇒ très surprenant). La proba de queue est plus rigoureuse car elle
> tient compte de la taille de l'échantillon.

**Pourquoi c'est le bon levier :** la surprise **normalise automatiquement** pour le nombre de
questions *et* pour la taille de groupe — c'est exactement la réponse au piège probabiliste du §2.3.
Du coup, un petit groupe très spécifique et un grand groupe peu spécifique deviennent **comparables
sur une même échelle**.

### 4.3 Étape de sélection — objectif multi-critère + classe bruit

```
qualité(g) = surprise(S_g, d_g) · f_taille(|M_g|)
   sous contraintes |M_g| ≥ τ_taille  et  |S_g| ≥ τ_dim
objectif : maximiser Σ_g qualité(g) sur des personas peu redondants,
           en reportant couverture = |∪ M_g| / n  et l'ensemble U des non assignés.
```

> 💡 **En clair —** la qualité d'un persona = (force du signal = surprise) × (filtre sur la taille).
> - `τ_taille` (« tau taille ») = taille minimale pour qu'un groupe compte. **Relative**, pas absolue :
>   p. ex. « ≥ 5–8 % des répondants », avec un **plancher** (« mais jamais moins de 3 »). Ainsi sur 50
>   répondants on exige ~5 membres, sur 500 on exige ~40. (C'est ta question « 2 sur 10 ≠ 2 sur 100 » :
>   2/10 = 20 % = segment majeur ; 2/100 = 2 % = bruit.)
> - `τ_dim` (« tau dimension ») = nombre minimal de questions discriminantes pour qu'un persona soit
>   descriptible.
> - `f_taille` **pénalise** sous le seuil et **sature** au-dessus (un persona géant n'est pas « 10×
>   meilleur »).

- **Tailles hétérogènes autorisées** : on ne force plus `≈ n/k`.
- **Classe `U` (non assignés)** : un répondant n'entre dans `g` que si son score de match dépasse un
  seuil de confiance ; sinon → `U`. C'est exactement ton intuition sur C11 (§2.6).

### 4.4 Étape d'appartenance douce (optionnelle)

> 💡 **En clair —** « appartenance dure » = un répondant est rangé dans 1 seul groupe, point.
> « Appartenance douce » = on dit « 80 % Persona A, 20 % Persona B » (à la LCA). Ça gère les profils
> hybrides et les répondants qui matchent 0, 1 ou plusieurs personas.

> 🔄 **Amendement (validé dans la discussion) —** par **défaut : dur et lisible** (« un persona = une
> fiche »). Le **doux en option**, affiché comme un détail (les pourcentages) pour qui veut creuser.
> C'est l'arbitrage que tu as approuvé.

### 4.5 Étape de sélection de modèle — subspace-aware + stabilité

- **Corriger la silhouette** : juger chaque cluster sur **son propre sous-espace `S_g`**, pas en
  espace complet (sinon on reproduit la faille n°1, déjà confirmée par ton test k=4 vs k=5).
- **Ajouter la stabilité** (bootstrap) : un persona qui réapparaît sous rééchantillonnage est
  crédible. La stabilité aide aussi à **choisir le nombre de groupes sans imposer un `k`** d'avance.

> 💡 **En clair —** « bootstrap » = relancer le calcul plusieurs fois en retirant/ré-piochant quelques
> répondants, et regarder si les mêmes personas ressortent. Solide = on garde ; instable = on se méfie.

### 4.6 Étape d'exposition du compromis (« l'outil pour jouer »)

> 💡 **En clair — « front de Pareto » :** quand deux objectifs s'opposent (personas *précis* vs
> personas *qui couvrent beaucoup de monde*), il n'y a pas une seule meilleure solution, mais une
> petite famille de bons compromis. On en présente 2–3 (réglage « fin / moyen / large ») et tu choisis
> selon ton contexte.

Concrètement : un **réglage par défaut** raisonnable **+** soit un **curseur** (« peu de gros groupes
grossiers ↔ beaucoup de petits groupes nets »), soit l'affichage de **2–3 solutions de Pareto** entre
lesquelles basculer (on généralise le principe des tags `k` cliquables déjà présents).

---

## 5. Protocole de validation (le socle)

> **Rien ne se décide sans mesure.** Ce harness est le premier livrable, *avant* toute refonte du
> moteur.

> 💡 **En clair — « harness »** = banc d'essai automatisé. Un programme qui lance l'algo des milliers
> de fois sur des données dont on connaît la réponse, et lui donne une note objective. Il remplace le
> « ça a l'air bien » par « ARI = 0,82 ».

### 5.1 Validation externe sur vérité terrain

- Récupérer la colonne `Persona` comme **référence** (aujourd'hui jetée).
- Mesurer **ARI** et **pureté** entre clusters trouvés et personas plantés.
- **Baselines** : `greedy-correlation` et `subspace-cohesion` actuels, plus un k-means/k-modes naïf.
  Objectif : un tableau « méthode × score » qui **chiffre** l'écart constaté jusqu'ici qualitativement.

> 💡 **En clair — « baseline »** = point de comparaison minimal (le placebo). Si le nouvel algo
> sophistiqué ne bat pas l'algo bête, il ne sert à rien. **Et** ton test du §2.6 fournit déjà une
> baseline qualitative : « à k=5, l'actuel reconstruit mes personas » — le nouveau devra faire *aussi
> bien, mais sans qu'on ait à forcer le k à la main**.

### 5.2 Données synthétiques à structure connue (générateur)

Générateur paramétrable, avec des « boutons » : `n`, `p`, nb de vrais personas, **tailles inégales**,
nb de variables discriminantes/persona, **nb de variables de bruit**, **% de répondants aléatoires**,
intensité du **style de réponse**.

Puis tracer **ARI vs chaque bouton** → transformer tes questions ouvertes en courbes :
- « +N questions de bruit casse-t-il l'algo ? » → ARI vs nb de variables de bruit ;
- « combien d'outliers avant dérive ? » → ARI vs % de répondants aléatoires ;
- « l'ajout de répondants perturbe-t-il ? » → ARI vs `n` ;
- « les styles de réponse polluent-ils ? » → ARI vs intensité, **avec et sans** ipsatisation.

> 💡 **En clair —** au lieu de tester sur de vraies données imprévisibles, on fabrique de faux
> sondages *dont on connaît la vérité*, en y injectant volontairement du bruit et des trolls, pour
> voir à quel moment l'algo « craque ».

### 5.3 Ablations

> 💡 **En clair — « ablation »** = on retire une brique (ipsatisation, classe U, surprise…) et on
> regarde si le score baisse. Si retirer une brique ne change rien → elle est inutile → on la
> supprime. Ça garde le code léger.

### 5.4 Critères de succès (à caler ensemble)

Ordre de grandeur proposé : **ARI ≥ 0,7** en régime « propre », et **dégradation lente** (pas de
falaise) quand on injecte bruit/outliers — la *robustesse* compte autant que le pic.

> 💡 **En clair —** 1,0 = perfection ; 0,7 = très fiable. « Pas de falaise » = si tu ajoutes 5 trolls,
> le score doit passer de 0,70 à ~0,68, pas s'effondrer à 0,10. La robustesse distingue le prototype
> de labo de l'outil pro.

---

## 6. Discussion — limites, risques, arbitrages produit

- **Explosion combinatoire** du mining quand `p` grandit.

> 💡 **En clair —** plus il y a de questions, plus le nombre de combinaisons à tester explose ; le
> calcul peut geler. Garde-fous : **motifs fermés/maximaux** (ne garder que les motifs « résumés »,
> pas leurs sous-variantes redondantes) et **caps de profondeur** (« arrête de chercher au-delà de
> tant de questions combinées »). À surveiller dès le générateur §5.2 (grand `p`).

- **Modèle nul imparfait** (items corrélés).

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
>   dit « regarde par ici »), pas une preuve. On confirme ensuite par la stabilité et par ton jugement.

- **Appartenance douce / personas chevauchants** : gain analytique réel, mais tension avec « un
  persona = une fiche actionnable ». → défaut dur et lisible, doux en option (§4.4).
- **UX du compromis** : curseur/Pareto = puissance, mais risque de surcharge cognitive. Garder un
  défaut qui « marche tout seul ».
- **Petits `n`** : puissance statistique limitée ; le plancher `τ_taille` et la stabilité évitent de
  sur-interpréter ; l'outil doit pouvoir dire « pas assez de données pour conclure ».
- **La vérité terrain est une construction humaine** : retrouver *tes* étiquettes n'est pas retrouver
  une vérité objective. L'ARI est *un* signal, à croiser avec la stabilité et le jugement métier.
- **Risque de sur-ingénierie** : si les baselines corrigées (silhouette subspace + classe `U`)
  suffisent sur le harness, on s'arrête là.

---

## 7. Décision & séquencement (amendé)

> 🔄 **Amendement A4 — architecture : un module séparé, l'actuel conservé.**
> Décision : **ne pas modifier le module persona actuel.** On construit la refonte à côté
> (nouveau moteur + nouveau parcours), l'ancien reste accessible comme **référence / démo / baseline**
> — ce que ton test du §2.6 justifie pleinement (l'actuel « contient de l'or »).
>
> Recommandation d'implémentation (quand on y sera) : un nouveau `lib/persona-v2/` (le moteur) et une
> nouvelle route (p. ex. `/persona-lab` ou `/persona/v2`), **mais en réutilisant les composants de
> visualisation existants** (radar, heatmap, échelles de Likert, légende) plutôt qu'en les dupliquant.
>
> ⚠️ **Petit challenge —** garder l'ancien « au cas où » est sain, *à condition* de ne pas figer deux
> produits divergents pour toujours. Quand le v2 battra le v1 sur le harness, le v1 devient
> officiellement la *démo legacy*. Sinon on maintient deux moteurs à vie.

Séquencement par **ROI décroissant / coût croissant** — chaque étape produit une mesure avant la
suivante :

1. **Harness de validation + baselines** (§5.1, §5.3). Chiffre où l'existant échoue. Prérequis de tout.
2. **Générateur synthétique** (§5.2).
3. **Corrections à fort levier, faible risque** : silhouette **subspace-aware** + **classe `U`** +
   **MH/ML** + **Étape 0 (cœur de cible)**. (Les deux premières sont déjà *validées* par ton test.)
4. **Scoring par surprise** (§4.2).
5. **Normalisation optionnelle** (§4.1), gardée seulement si l'ablation le justifie.
6. **Appartenance douce + UX du compromis + comparateur** (§4.4, §4.6, §8).

> Garde-fou : on ne passe à l'étape *n+1* que si l'étape *n* a **amélioré une métrique** du harness
> (ou clarifié une décision).

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
   comment l'ARI/la stabilité bougent). C'est ton « plein contrôle ».

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
| **V3 (idées validées, plus tard)** | **A7 — Réassignation manuelle** : déplacer un répondant d'un groupe à l'autre dans l'UI, voir l'effet sur le persona, **sans écraser l'analyse initiale** (mode « what-if »). | Ta proposition. Pont naturel entre l'algo et le jugement humain. |
| **V3** | **A8 — Fiche persona qualitative** : générer une fiche descriptive (récit, besoins, citations) à partir des résultats quantitatifs. | Ta proposition. Probablement un appel LLM, cohérent avec les autres modules. |

> 💡 **En clair — pourquoi A7 (réassignation) est puissant :** l'algo n'a jamais le dernier mot. Si tu
> *sais* qu'un répondant appartient au groupe 1, tu l'y mets et l'outil te montre instantanément
> l'impact (le persona devient-il plus net ? la signature change-t-elle ?). C'est l'inverse de la boîte
> noire : l'humain et la machine collaborent. À cadrer côté UX (sans doute pas dès la première version
> du v2).

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
| « 1 algo ou un outil pour jouer ? » | Multi-objectif + transparence | Défaut + contrôle + comparateur (§4.6, §8) |
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
| **`U` (non assignés)** | Bac des répondants exclus (trolls, profils rares) | 2 répondants C11 |
| **Outlier** | Répondant atypique (troll, échelle inversée, ultra-niche) | clique tout à 1 |
| **Ipsatisation** | Centrer chaque répondant sur sa moyenne (annule son « style ») | (5,4) → (+0,5 ; −0,5) |
| **`τ_taille` / `τ_dim`** | Seuils minimaux : taille de groupe / nb de questions | ≥ 5–8 % de n ; ≥ 3 questions |
| **Front de Pareto** | Famille de bons compromis quand 2 objectifs s'opposent | « fin / moyen / large » |
| **Appartenance dure / douce** | 1 seul groupe / pourcentages multi-groupes | « A » vs « 80 % A, 20 % B » |
| **ARI (Adjusted Rand Index)** | Note de comparaison aux étiquettes vraies | 0 = hasard, 1 = parfait |
| **Pureté** | % d'un cluster appartenant au même vrai groupe | 0,9 |
| **Baseline** | Algo de comparaison minimal (placebo) | k-means naïf |
| **Harness** | Banc d'essai automatisé | lance l'algo 1000× |
| **Ablation** | Retirer une brique pour mesurer son utilité | sans ipsatisation : −0 ? |
| **Stabilité / bootstrap** | Le persona réapparaît-il sous rééchantillonnage ? | relancer sur 45/50 |
| **Cœur de cible (Étape 0)** | Le profil global majoritaire, décrit même sans sous-groupes | « 80 % veulent X » |
| **Explosion combinatoire** | Trop de combinaisons à calculer quand `p` grandit | 100 questions |
| **Motifs fermés/maximaux** | Garder les motifs « résumés », pas les redondants | anti-explosion |

---

*V2 rédigée à partir des échanges de juin 2026. La V1 ([`THESE-PERSONA.md`](./THESE-PERSONA.md))
reste la référence épurée. Prochaine étape inchangée : valider/amender cette thèse, puis le §7.1
(harness) — sans toucher au moteur actuel.*
