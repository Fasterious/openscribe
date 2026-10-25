# Lire un rapport : audit et spécification d'interaction

Casquette `ux-designer`, 18 octobre 2026. Objet : le rapport d'une synthèse en lecture, tel que le grand public
le voit dans l'Observatoire (`#/observatoire/ecole-grand-debat-2019`, `ObservatoryPage` → `ReportTab` en mode
`published`) et tel que le chercheur le voit dans le module Synthèse (même `ReportTab`).

Ce document ne change pas le contenu du rapport. Il porte sur la manière d'interagir avec lui : déplier, replier,
se repérer, comprendre une marque de méthode. Les propositions qui touchent la méthode ou le vocabulaire sont
signalées comme **décisions à prendre**, avec la casquette qui doit les valider (`methodologue`, `plume`) ou
Arnaud. Aucune n'est tranchée ici.

Sommaire : 1. Ce qu'on garde · 2. Audit chiffré · 3. Les cinq causes racines · 4. Ce que disent les bonnes
pratiques · 5. Spécification · 6. « De justesse » et « à vérifier », cas par cas · 7. Risques et ce qu'il ne faut
pas faire · 8. Décisions à prendre · 9. Liste priorisée · 10. Sources.

---

## 1. Ce qu'on garde (et pourquoi)

- **Le déroulé sur place**, au même endroit, avec le même composant à chaque niveau (une ligne par personne, la
  réponse entière sous le verbatim). C'est ce qui rend la lecture rigoureuse : on ne quitte jamais la phrase qui
  avance un chiffre pour aller voir ses preuves. La recherche le confirme : envoyer le lecteur sur une autre page
  ou dans un panneau lui fait perdre sa place (Baymard, sous-pages).
- **Le résumé et les listes en haut**, qui donnent « la température » en quelques écrans.
- **Le repli qui ramène le lecteur là où il avait déplié** (`useFoldBack`) : mesuré, il fonctionne (la pastille
  revient à 436 px du haut sur ordinateur, à 531 px sur mobile, à l'endroit d'où on l'avait ouverte).
- **Les éléments natifs `<details>`** : ils s'impriment dépliés (déjà géré), et la recherche du navigateur
  (Ctrl+F) les ouvre d'elle-même dans Chrome et Edge.
- **« Questions soulevées »**, même avec un seul avis (demande d'Arnaud).

---

## 2. Audit chiffré

Mesures faites dans Chromium (Playwright), étude « L'école vue par les familles », 73 motifs, 10 thèmes,
1 051 idées. Ordinateur : 1 440 × 900. Mobile : 390 × 844 (écran tactile).

### 2.1 La page

| Mesure | Ordinateur | Mobile |
|---|---|---|
| Hauteur de la page, tout replié | 13 379 px (15 écrans) | 24 700 px (29 écrans) |
| Hauteur, tout déplié (comme à l'impression) | 92 897 px (103 écrans) | 169 681 px (201 écrans) |
| Résumé + listes (« la température ») | ≈ 3 800 px (4 écrans) | ≈ 8 200 px (10 écrans), dont listes 6 692 px |
| « Vue d'ensemble » (cartes des thèmes) | 602 px | 1 237 px |
| Partie détaillée (10 thèmes, sous les cartes) | ≈ 7 100 px (8 écrans) | ≈ 11 550 px (14 écrans) |
| Nœuds HTML au chargement | 10 260 | 10 260 |
| Déclencheurs d'infobulle rendus au chargement | 1 526 (un fournisseur Radix chacun) | idem |

### 2.2 Les parcours

**Parcours A : lire le résumé, ouvrir la pastille ❝ 46.**
- Le volet ajoute 1 918 px (2,1 écrans) sur ordinateur, 2 948 px (3,5 écrans) sur mobile.
- « Replier » est en bas, à 2,1 écrans (ordinateur) et 3,5 écrans (mobile) de la pastille. Au clavier :
  **49 tabulations** entre la pastille et « Replier ».
- « Replier » mesure 45 × 20 px : sous le minimum de 24 px exigé par WCAG 2.2 (critère 2.5.8, niveau AA).
- Après « Replier », **le focus clavier est perdu** (il retombe sur `<body>`) : la personne au clavier ou au
  lecteur d'écran repart du haut de la page.
- Le volet n'a pas de titre : rien ne dit que ces 48 lignes sont « les avis positifs du motif Expérience globale
  de scolarisation ». Au milieu du volet, on ne sait plus ce qu'on lit.
- Défaut d'affichage : quand le volet est ouvert, le texte qui reprend dessous commence par un point orphelin
  (« . La critique la plus partagée… »).

**Parcours B : lire une liste (« Ce qui bloque »), puis « Et aussi ».**
- 6 lignes affichées, puis « Et aussi : » suivi de 34 titres en texte brut (926 caractères) ; « Ce que proposent
  les participants » : 42 titres (1 155 caractères). Aucun ne se déplie ni ne mène au motif.
- Dans « Ce que proposent les participants », la phrase sous « Orientation des élèves » dit « critiquée par 27 des
  28 personnes », et la pastille à côté affiche **❝ 6** (les 6 auteurs de propositions). Le lecteur attend 27 :
  la pastille ne dit pas ce qu'elle déroule.

**Parcours C : « fragile » et « à vérifier » sur « Enseignement privé ».**
- L'infobulle de « fragile » : « Il suffirait qu'une personne change d'avis pour que l'étiquette bascule. Sur de
  petits effectifs, une seule voix pèse lourd ; le code fait le calcul pour chaque motif. Citez le chiffre plutôt
  que l'étiquette, et relisez les citations. » Elle ne dit ni quelle étiquette, ni vers quoi, ni pourquoi 12 sur
  14 est concerné. « Petits effectifs » est même faux pour « Carte scolaire » (24 sur 29) ou « Réforme du système
  éducatif » (20 sur 24).
- L'infobulle de « à vérifier » : « 6 de ces avis comptent aussi dans un autre motif ; sans eux, ce serait
  « unanime » … Relisez les citations marquées « aussi dans » ». Dans le motif ouvert, **8** verbatims portent
  « aussi dans », pas 6 : deux d'entre eux (P252, P279) sont des originaux dont la copie est ailleurs et
  n'entrent pas dans le calcul. Le lecteur ne peut pas retrouver les 6.
- Le même motif porte trois marques : « fragile », « Minorité constante » (P192, P261) et « À vérifier ». Les trois
  tiennent aux deux mêmes avis négatifs, qui sont **tous deux des copies** venues d'autres motifs. Trois
  avertissements séparés pour une seule histoire.

**Parcours D : ouvrir un thème, puis un motif, lire, replier, passer au suivant.**
- Il faut d'abord descendre jusqu'aux cartes « Vue d'ensemble » (4 142 px sur ordinateur, 8 665 px sur mobile),
  toucher une carte : la page saute à la section du thème.
- Ouvrir « Qualité des enseignants » ajoute 2 865 px sur ordinateur (3,2 écrans) et **6 629 px sur mobile
  (7,9 écrans)** : 60 lignes de personnes.
- Au milieu du motif, plus aucun repère : ni le titre du thème, ni celui du motif, ni le camp (« Avis négatifs »),
  seulement la couleur du filet à gauche.
- Pour replier, il faut remonter 8 écrans jusqu'au titre du motif : il n'y a pas de « Replier » en bas d'un motif.
- **Sur mobile, toucher la ligne d'un motif fermé ne l'ouvre pas toujours** : le centre de la ligne tombe sur
  l'étiquette « Avis partagés », qui ouvre une bulle de définition au lieu du motif (constaté sur « Qualité des
  enseignants »). La ligne contient 2 à 4 zones qui font chacune autre chose.
- Sur ordinateur, les deux colonnes (avis négatifs, avis positifs) sont de hauteurs inégales : un grand vide à
  droite pendant plusieurs écrans.
- Au survol, chaque verbatim ouvre une grande bulle (sa source) après 250 ms : en faisant glisser la souris le long
  d'une liste, les bulles s'enchaînent.

**Parcours E : les étiquettes des thèmes.** Sur la carte « Les enseignants » : « 10 motifs », « 1 aux avis
partagés », « 15 suggestions ». Or « 15 suggestions » compte en réalité **15 personnes** qui proposent (le code
affiche `participantsByCategory.suggestion`). La barre, elle, compte des personnes par catégorie. Trois unités
(motifs, personnes, catégories) sur une même carte, sans légende commune.

---

## 3. Les cinq causes racines

1. **Un bloc ouvert n'a qu'un seul point de contrôle, et il s'éloigne.** Le titre (et la fermeture) restent en
   haut, « Replier » en bas ; rien ne suit le lecteur dans un bloc qui peut faire 8 écrans. D'où la perte de
   contexte (« où suis-je ? ») et le long chemin pour replier. Ce n'est pas un bouton qui manque : c'est un
   **en-tête qui ne suit pas la lecture**.
2. **La partie détaillée n'a ni nom ni frontière, et elle est dédoublée.** « Vue d'ensemble » est un sommaire de
   cartes ; les thèmes viennent ensuite en titres de même niveau que « Résumé », sans titre de partie. Le
   sommaire et le détail sont reliés par un saut d'ancre. Le lecteur ne voit pas où finit « la température » et où
   commence l'exploration, et le titre « Vue d'ensemble » se lit comme le nom de toute la suite.
3. **Le code calcule un cas précis, l'écran affiche une définition générale.** Pour « fragile » et « à vérifier »,
   le code sait quelles personnes, quel seuil, quelle étiquette de remplacement, quels verbatims ; l'infobulle ne
   donne qu'une définition, fausse pour une partie des cas. En amont, la définition appliquée (« une voix change
   l'étiquette ») est plus large que la règle écrite dans `CLAUDE.md` (« une voix change la conclusion ») : 7 des
   15 « fragile » de cette étude passent seulement de « large majorité » à « majorité », le même camp restant en
   tête. Enfin, les marques se cumulent sans être reliées (trois marques pour deux avis).
4. **Au niveau du thème, les chiffres ne décrivent pas ce qu'on voit.** La barre compte des personnes par catégorie,
   les étiquettes comptent des motifs, et « suggestions » compte des personnes. Le lecteur ne peut pas répondre à
   la question qu'il se pose : « dans ce thème, qu'est-ce qui est apprécié, critiqué, discuté ? »
5. **Les mêmes gestes ne font pas la même chose partout.** Une pastille déroule, mais « Et aussi » ne déroule pas ; la
   barre et sa légende ne sont pas cliquables ; un toucher sur la ligne d'un motif ouvre tantôt le motif, tantôt une
   bulle ; les explications passent par des infobulles, qui se lisent mal au doigt. Le mot « motif » vient du
   vocabulaire de la méthode, pas de celui du lecteur.

---

## 4. Ce que disent les bonnes pratiques, et ce qui s'applique ici

| Pratique | Ce qu'en disent les sources | Ici |
|---|---|---|
| **Accordéons** | Utiles sur des pages longues où l'on ne lit pas tout ; à éviter quand le lecteur a besoin de presque tout, quand le contenu a plusieurs niveaux, ou quand la lecture continue prime (NN/g). GOV.UK ajoute un bouton « tout afficher » et garde l'état ouvert. | S'applique au **détail** (on n'y lit pas tout : on explore). Ne s'applique pas au **résumé**, qui se lit d'un trait : il reste ouvert. Ajouter « Tout déplier ». |
| **Divulgation progressive** | Au-delà de deux niveaux, les lecteurs se perdent entre les niveaux (NN/g). | Le rapport a quatre niveaux (thème, motif, camp, réponse entière). Compensation obligatoire : un en-tête collant qui dit à chaque instant où l'on est, et un repli toujours à portée. |
| **En-têtes collants** | Petits, contrastés, sans animation gratuite ; l'en-tête « partiellement persistant » (caché en descendant, revenu dès qu'on remonte) est la forme recommandée sur les pages longues (NN/g ; Smashing). Un élément collant ne sort jamais de son parent : chaque section garde le sien et le cède à la suivante. | S'applique : en-tête de thème et en-tête de motif collants, dans leur bloc. Limite : la pile collante ne dépasse pas un quart de la hauteur de l'écran sur mobile. |
| **Barre qui se cache au défilement** | Material (barre d'application qui disparaît au défilement) et NN/g. Seuil de quelques pixels pour ne pas clignoter. | S'applique à la barre de l'application sur les pages de lecture. Piège constaté dans notre maquette : un défilement provoqué par le code (repli) ne doit pas la faire réapparaître. |
| **Ancrage du défilement** | Le navigateur garde stable ce qu'on regarde quand du contenu change au-dessus (`overflow-anchor`) ; il ne sait pas quoi faire quand le contenu lu disparaît. Pas pris en charge partout (Safari). | Le repli doit placer lui-même le titre refermé à l'endroit où était l'en-tête collant. |
| **Animations de hauteur** | 200 à 300 ms pour une ouverture, la fermeture plus courte que l'ouverture (Material, Atlassian, NN/g). En CSS : `interpolate-size: allow-keywords` et `::details-content` (Chrome) ; sinon, ouverture instantanée. `prefers-reduced-motion` : couper le mouvement (WCAG 2.3.3, Apple). | S'applique, avec une règle propre aux très grands blocs : on n'anime jamais 6 000 px de hauteur. |
| **Sommaire qui suit la lecture (scrollspy)** | Souligne la section en cours ; `aria-current` pour les lecteurs d'écran ; IntersectionObserver plutôt qu'un écouteur de défilement. | S'applique sur grand écran (la colonne de droite est vide à 1 440 px). Sur mobile, accès par un bouton, pas en permanence. |
| **Liens dans la page** | Utiles en tête d'une page longue découpée en sections bien nommées ; le saut désoriente s'il n'y a pas de retour (Expero, citant NN/g). | Les sauts restent possibles, avec un retour visible (règle du projet : tout écran qui quitte offre le retour). |
| **Bouton de divulgation accessible** | Un bouton avec `aria-expanded` (et `aria-controls`) ; Entrée et Espace ; le focus reste sur le bouton (APG ; Roselli). | Pas d'élément interactif à l'intérieur d'un `<summary>` ; focus rendu au bouton après un repli. |
| **Taille des cibles, focus visible** | 24 × 24 px minimum (WCAG 2.5.8) ; un élément qui a le focus ne doit pas être caché par un en-tête collant (WCAG 2.4.11). | « Replier » à agrandir ; `scroll-padding-top` égal à la hauteur de la pile collante. |
| **Maître-détail** (liste à gauche, détail à droite) | Bon pour comparer et naviguer vite sur ordinateur ; mauvais sur mobile ; coupe la lecture continue. | **Ne s'applique pas** : il casse le déroulé sur place qu'Arnaud veut garder. |
| **Explorations journalistiques de données** | Un point à la fois, texte court, le lecteur choisit sa profondeur (ONS) ; le défilement donne le contrôle au lecteur. | Confirme l'ordre actuel : le résumé guide, le détail se laisse explorer. Pas de « scrollytelling » animé : il gênerait la vérification. |

---

## 5. Spécification

Vocabulaire employé ci-dessous : **sujet** pour l'actuel « motif » (voir la décision D1 au §8 ; si Arnaud retient
une autre option, seuls les libellés changent). « Thème » garde son sens actuel.

### 5.1 Principes transverses (valables à chaque niveau)

1. **Un bloc ouvert a un en-tête qui le suit.** Tant que le lecteur est dans un bloc ouvert (volet de pastille,
   thème, sujet), son en-tête reste collé en haut de l'écran, avec le bouton « Replier ». Il disparaît quand le bloc
   sort de l'écran, et le suivant prend sa place (comportement natif de `position: sticky` dans son bloc).
2. **Replier ramène au titre du bloc.** Le titre refermé vient se placer exactement là où était l'en-tête collant :
   le lecteur voit le bloc fermé et, dessous, le suivant. Le focus revient sur le bouton du bloc. Le repli ne
   déclenche jamais la réapparition de la barre de l'application (on gèle l'écoute du défilement le temps du
   repli, 300 ms).
3. **Un geste, un effet.** Une ligne fermée est une seule cible, qui ouvre. Les étiquettes d'une ligne fermée ne
   sont pas interactives. Les explications vivent dans le bloc ouvert, dans le texte, jamais dans une infobulle
   (une infobulle ne s'ouvre pas au doigt et cache ce qu'elle explique).
4. **Ce qui se compte se déroule.** Tout nombre de personnes qui renvoie à des verbatims (pastille, ligne de liste,
   légende de barre, en-tête de camp) se touche pour les dérouler, sur place, avec le même volet.
5. **Échap replie le bloc ouvert le plus intérieur** et rend le focus à son bouton.
6. **Mouvement réduit** (`prefers-reduced-motion: reduce`) : aucune animation de hauteur ni de glissement, aucun
   défilement doux ; un fondu de 100 ms au plus est permis.
7. **À l'impression**, tout est déplié (déjà le cas), les en-têtes ne collent plus, les boutons (« Replier »,
   « Montrer… », sommaire) disparaissent, les explications « Pourquoi… » s'impriment.

### 5.2 Animations (valeurs exactes)

| Geste | Ordinateur et mobile | Mouvement réduit |
|---|---|---|
| Ouvrir un bloc | Hauteur 0 → auto en 220 ms, `cubic-bezier(.2,.7,.2,1)` ; contenu en fondu 0 → 1 en 160 ms ; chevron qui tourne de 90° en 150 ms. | Ouverture immédiate. |
| Ouvrir un très grand bloc (plus d'un écran et demi) | On n'anime que le premier écran : le reste apparaît sans transition sous la ligne de flottaison. | Immédiat. |
| Replier, lecteur près du titre | Hauteur auto → 0 en 180 ms, accélération en sortie. | Immédiat. |
| Replier, lecteur au fond du bloc | 1) placement immédiat du titre à l'endroit de l'en-tête collant (rien ne bouge à l'œil : l'en-tête y est déjà) ; 2) fondu du contenu en 150 ms, hauteur animée à partir de la hauteur de l'écran, pas de la hauteur réelle. | Placement et fermeture immédiats. |
| Aller à un thème (sommaire) | Défilement doux si la distance est inférieure à 3 écrans, sinon saut immédiat suivi d'un bref surlignage du titre (fond accentué qui s'estompe en 600 ms). | Saut immédiat, surlignage fixe 1 s. |
| Barre de l'application qui se cache | Glissement de 200 ms ; la pile collante se recale en même temps (même durée, même courbe). | Apparition et disparition immédiates. |

En pratique : `interpolate-size: allow-keywords` sur `:root` et une transition sur `details::details-content`
(Chrome, Edge) suffisent pour l'ouverture ; ailleurs l'ouverture reste instantanée, ce qui est acceptable. La
fermeture d'un grand bloc se fait en JavaScript (Web Animations API), pour plafonner la hauteur animée.

### 5.3 Niveau 1 — Résumé et pastilles

**Comportement**
- La pastille ❝ N garde sa forme et son effet (déroule sous la phrase).
- Le volet ouvert reçoit un **en-tête** qui dit ce qu'on lit, collant tant qu'on est dans le volet :

  ```
  ┌──────────────────────────────────────────────────────────┐
  │ ❝ 46 avis positifs · Expérience globale de scolarisation  ⌃ Replier │
  └──────────────────────────────────────────────────────────┘
  │ P4    « … »
  │ P15   « … »
  │ …
  ⌃ Replier les 46 verbatims
  ```
- Libellés exacts : en-tête `❝ {n} {avis positifs|avis négatifs|propositions|questions|constats} · {titre du
  sujet}` ; quand la pastille ne déroule que des idées citées de plusieurs sujets : `❝ {n} verbatims cités dans
  cette phrase`. Bouton : `Replier` (en-tête), `Replier les {n} verbatims` (en bas).
- Si le sujet porte une marque (de justesse, à vérifier), l'en-tête ajoute une ligne : `Large majorité de justesse
  · Pourquoi ?` ; « Pourquoi ? » déplie l'explication du §6 sous l'en-tête. C'est ce qui relie le mot « fragile »
  écrit par le moteur dans le résumé à son explication.
- La ponctuation qui suit la pastille reste dans la phrase avant le volet (plus de point orphelin).
- Dans les **listes**, la pastille dit ce qu'elle déroule : `❝ 27 avis négatifs`, `❝ 6 propositions`,
  `❝ 1 question`. Dans le **résumé**, le nombre seul suffit (la phrase vient de le dire).

**Clavier et lecteur d'écran** : la pastille porte `aria-expanded` et `aria-controls` vers le volet ; son nom
accessible reste « Voir les verbatims de 46 participants ». Après « Replier » (en-tête ou bas), le focus revient
sur la pastille. Cible du bouton « Replier » : au moins 32 px de haut.

**Mobile** : l'en-tête du volet tient sur une ligne (titre du sujet tronqué avec « … », « Replier » toujours
visible).

### 5.4 Niveau 2 — Listes et « Et aussi »

**Listes** : inchangées dans leur contenu. Deux ajouts :
- Les marques `de justesse` et `à vérifier` deviennent des boutons (soulignés en pointillé, cible de 24 px) qui
  déplient l'explication du §6 **sous la ligne**, avec le même composant que dans le sujet. Plus d'infobulle.
- Sous la phrase, un lien discret `Voir le sujet en détail →` ouvre le thème et le sujet dans la partie détaillée et
  y amène le lecteur ; un bouton `← Revenir à « Ce qui bloque »` apparaît alors dans l'en-tête collant du sujet, et
  ramène à la ligne d'origine (règle du projet : tout départ offre son retour, couvert par un test de parcours).

**« Et aussi »** devient un bouton qui déplie les sujets restants **en vue restreinte**, sur place :

```
Et aussi
[ Voir les 34 autres sujets critiqués ⌄ ]

  Moyens des écoles              19 avis négatifs sur 20   ❝ 19
  Scolarisation des enfants handicapés   18 sur 18         ❝ 18
  Effectifs par classe           …                          ❝ …
  …
[ Masquer les 34 autres sujets ⌃ ]
```

- Vue restreinte = titre, chiffre, marques, pastille ; sans la phrase de synthèse. La pastille déroule les
  verbatims comme partout. Toucher le titre ouvre la phrase de synthèse en dessous (même ligne que les six
  premières).
- Libellés exacts : `Voir les {n} autres sujets {appréciés|critiqués|qui divisent}` ; pour les propositions :
  `Voir les {n} autres sujets avec des propositions` ; pour les questions : `Voir les {n} autres sujets avec des
  questions`. Repli : `Masquer les {n} autres sujets`.
- Le bouton porte `aria-expanded` ; à l'ouverture, le focus va sur la première ligne ajoutée.

### 5.5 Niveau 3 — La partie détaillée : thème → sujet → camp → réponse

**Séparer le haut et le bas.** Après les listes, une rupture nette (filet épais, plus d'espace, titre de partie) :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Le détail, thème par thème
10 thèmes, 73 sujets. Ouvrez un thème, puis un sujet, pour lire
ce que disent les participants.              [ Tout déplier ]
```

- « Vue d'ensemble » disparaît : **les cartes du sommaire deviennent les lignes des thèmes elles-mêmes**. Une seule
  représentation d'un thème au lieu de deux (carte en haut, section plus bas), plus de saut d'ancre.
- Hiérarchie des titres : `h2` « Le détail, thème par thème » ; chaque thème `h3` ; chaque sujet `h4`.
- `Tout déplier` / `Tout replier` : ouvre ou ferme tous les thèmes (pas les sujets).

**Ligne d'un thème fermé** (une seule cible, qui ouvre) :

```
Public face au privé                         48 participants ›
▬▬▬▬▬▬ ▬▬▬▬▬▬ ▬▬▬▬▬▬     (une barre par sujet, couleur de son verdict)
● 1 apprécié   ● 1 critiqué   ○ 1 avec peu d'avis
```

- **Étiquettes des thèmes** (remplacent « 3 motifs », « 1 aux avis partagés », « 15 suggestions ») : le nombre de
  sujets par verdict, avec une pastille de couleur. Libellés exacts : `{n} apprécié(s)` (vert), `{n} critiqué(s)`
  (rouge), `{n} qui divise(nt)` (jaune), `{n} sans majorité` (gris foncé, seulement s'il y en a), `{n} avec peu
  d'avis` (gris clair). Correspondance proposée (décision D4) : apprécié = unanime, large majorité ou majorité
  positive ; critiqué = idem négative ; qui divise = avis partagés ; sans majorité = « pas de majorité » ; peu
  d'avis = « peu d'avis », « pas d'avis » et sujets d'un seul participant.
- **La barre du thème change de nature** : une barre par sujet, de largeur égale, dans l'ordre d'affichage,
  colorée par son verdict. Elle dit la même chose que les étiquettes en dessous. La barre continue (personnes par
  catégorie) reste réservée au sujet, où elle résume les listes de verbatims (décision d'Arnaud du 17/10).
- Si l'on veut garder l'information « suggestions » au niveau du thème, le libellé exact est `{n} personnes
  proposent` (et non « {n} suggestions », qui compte en fait des personnes).
- Lecteur d'écran : la ligne se lit « Public face au privé, 48 participants, 3 sujets : 1 apprécié, 1 critiqué,
  1 avec peu d'avis, replié ». La barre est décorative (`aria-hidden`), les étiquettes portent l'information.

**Thème ouvert** : la synthèse du thème (inchangée), puis les lignes de ses sujets, puis « Signaux isolés · un
seul participant chacun » (inchangé). Son en-tête devient collant, en version compacte :

```
┌─ (barre de l'application, cachée quand on descend) ───────┐
│ Public face au privé · 48 participants      ▬▬ ▬▬ ▬▬   ⌃ │  ← en-tête collant du thème (44 px)
│ Enseignement privé   Large majorité positive · de justesse ⌃ Replier │ ← en-tête collant du sujet (44 px)
└───────────────────────────────────────────────────────────┘
```

- Le bouton `⌃` de l'en-tête du thème a pour nom accessible « Replier le thème Public face au privé ».
- Agréable : dans un thème ouvert, la ligne d'étiquettes devient un filtre (`● 1 critiqué` se presse, `aria-pressed`,
  pour ne montrer que ces sujets ; `Tout afficher` pour revenir). Jamais filtré par défaut : les minorités restent
  visibles.

**Ligne d'un sujet fermé** (une seule cible) : titre, barre continue, nombre de participants, étiquette d'avis,
marques (`de justesse`, `à vérifier`, `Minorité constante`). Les étiquettes ne sont plus des infobulles.

**Sujet ouvert**, dans cet ordre :
1. La ligne de chiffres (inchangée).
2. **« Pourquoi cette étiquette ? »**, seulement si le sujet porte une marque : l'explication du §6, visible
   d'emblée (3 à 5 lignes), avec le lien `Montrer ces {n} verbatims`.
3. La synthèse et ses pastilles (inchangées), la définition pliée (inchangée), la note de minorité.
4. **Les camps**, un par catégorie, chacun avec son en-tête cliquable qui est aussi la légende de la barre :

   ```
   ● Avis positifs — 12 participants      ⌄
   ● Avis négatifs — 2 participants       ⌄
   ● Suggestions — 1 participant          ⌄
   ```

   - Toucher un segment de la barre, ou l'en-tête d'un camp, déroule ce camp (demande n° 6 d'Arnaud). Le segment
     est un raccourci (souvent trop petit pour le doigt) ; l'en-tête de camp est la vraie cible.
   - Ouverts par défaut si le sujet compte au plus 8 lignes de personnes ; fermés au-delà, nombre visible (décision
     D6, à éprouver en test). Ainsi « Qualité des enseignants » s'ouvre sur 1,5 écran au lieu de 8, et le lecteur
     choisit son camp. Aucun échantillon : un camp se déroule entier ou pas du tout (pas de « 5 premiers » choisis).
   - Sur ordinateur, les camps s'empilent en une seule colonne (fin du grand vide à droite) ; deux colonnes
     seulement si les deux camps sont ouverts et de longueurs proches (écart inférieur à 30 %).
   - Le camp ouvert a son propre en-tête collant sous celui du sujet, avec « Replier », sur ordinateur comme sur
     mobile (Arnaud, 25/10 ; sur mobile, le grand thème s'efface pendant la lecture d'un thème : deux niveaux seulement
     restent collés). Son intitulé a la forme du volet du résumé : `● 9 avis positifs · 14 verbatims` (personnes, puis
     verbatims).
5. En bas du sujet : `⌃ Replier « Enseignement privé »` (en plus de celui de l'en-tête collant).

**Réponse entière d'un verbatim** : inchangée (sous la ligne de la personne). Son « Replier » passe à 32 px de haut
et rend le focus au verbatim.

**Pile collante, règles chiffrées**
- Mobile : au plus deux niveaux collés (thème, sujet), 44 px chacun en version compacte ; avec la barre de
  l'application visible (56 px), 144 px, soit 17 % d'un écran de 844 px.
- Écran bas (hauteur inférieure à 600 px, téléphone couché) : un seul niveau collé, le plus intérieur.
- En version collée, l'en-tête du sujet perd ses étiquettes sur mobile (titre, chemin et « Replier » seulement) ;
  il les retrouve en place normale.
- `scroll-padding-top` du document = hauteur de la pile collante, pour qu'un élément qui reçoit le focus ou qu'on
  atteint par un lien ne soit jamais caché dessous (WCAG 2.4.11).

### 5.6 Navigation

- **Barre de l'application partiellement persistante** sur les pages de lecture (rapport, Observatoire) : cachée
  quand on descend de plus de 8 px au-delà des 200 premiers pixels, revenue dès qu'on remonte de 8 px, toujours
  visible si un élément de la barre a le focus. Jamais sur les onglets Données et Analyse (on y produit, on n'y lit
  pas).
- **Sommaire qui suit la lecture, sur grand écran** (≥ 1 280 px) : colonne de droite, collante, aujourd'hui vide.
  Entrées : `Résumé`, `Ce qui a marché`, `Ce qui bloque`, `Ce qui divise`, `Propositions`, `Questions`, puis les
  10 thèmes avec leur petite barre de verdicts, puis `Hors question` et `Méthode`. L'entrée en cours est soulignée
  et porte `aria-current="location"`. Toucher un thème l'ouvre et y amène (§5.2).
- **Sur mobile**, l'en-tête collant du thème porte un bouton `Thèmes` qui ouvre la même liste dans un panneau du bas
  (agréable). Avant cela, la ligne « Le détail, thème par thème » sert déjà de sommaire, sans saut.
- **Lien vers un sujet** : ouvrir un thème ou un sujet met à jour l'adresse sans créer d'entrée d'historique
  (`…/ecole-grand-debat-2019?sujet=enseignement-prive`) ; ouvrir cette adresse ouvre le thème et le sujet et y amène.
  Dans le sujet ouvert, `Copier le lien de ce sujet` (utile aux journalistes). Le bouton Retour du navigateur ne
  rejoue pas chaque ouverture.

### 5.7 Accessibilité (récapitulatif)

- Bouton de divulgation : `<details>/<summary>` natif, ou `<h4><button aria-expanded aria-controls>` si les tests
  au lecteur d'écran (VoiceOver, NVDA) montrent que les titres placés dans un `<summary>` ne sont plus annoncés comme
  titres. Dans ce cas, le contenu replié prend `hidden="until-found"` pour rester trouvable par Ctrl+F (Chrome,
  Edge), et l'impression continue de tout ouvrir.
- Aucun élément interactif dans une ligne fermée (aujourd'hui : infobulles dans `<summary>`, contenu interactif
  imbriqué).
- Focus rendu au bouton du bloc après chaque repli ; Échap replie le bloc le plus intérieur.
- Cibles de 24 px au moins partout, 32 px pour « Replier » ; contraste de « Replier » au niveau du texte courant
  (aujourd'hui gris clair sur fond clair).
- Infobulles des verbatims réservées aux appareils qui survolent (`@media (hover: hover)`), délai porté à 500 ms ;
  sur mobile, le toucher ouvre déjà la réponse entière.

### 5.8 Mode chercheur (module Synthèse)

Même `ReportTab`, mêmes interactions, plus :
- Dans « Pourquoi « à vérifier » ? », chaque verbatim compté deux fois porte un choix
  `Compte ici` / `Ne compte pas ici` ; le chiffre et l'étiquette se recalculent aussitôt (« Avec vos choix :
  10 sur 12, large majorité ») ; la marque « à vérifier » disparaît quand tous les doubles comptes du sujet sont
  tranchés. Les choix sont enregistrés dans l'analyse, exportés, et la Méthode les dit (« 3 rangements tranchés par
  le chercheur »). Décision D3.
- Dans l'Observatoire, rien de cela : le texte dit `Le lecteur ne peut pas trancher ici : ces verbatims sont
  montrés pour que chacun juge.`
- Quand un segment est choisi, les explications se recalculent sur le segment (les données sont les mêmes) ou se
  taisent, comme la marque aujourd'hui.

---

## 6. « De justesse » et « à vérifier », expliqués au cas par cas

### 6.1 Les données que le code a déjà

Tout est calculable sans le moteur d'IA, à partir de ce que `ReportTab` reçoit :
- `metrics.positiveOnly`, `negativeOnly`, `mixed` (identifiants des personnes), donc P, N, M, T = P + N + M ;
- `metrics.stance`, `metrics.majority`, et `stanceOf(P, N, M)` pour calculer l'étiquette après un déplacement d'une
  voix (ce que font déjà `isFragile` et `dividedFragile`) ;
- les seuils `CONSENSUS_THRESHOLD` (80 %), `MAJORITY_THRESHOLD` (50 %), `DIVIDED_RATIO`, `THIN_THRESHOLD` ;
- pour les doubles comptes : les idées du sujet dont `copyOf` est rempli (leur catégorie, leur personne), le titre
  de l'autre sujet (`alsoInOf`), et l'étiquette sans elles (`labelDoubt` la calcule déjà).

Un prototype hors dépôt a produit les textes ci-dessous sur l'étude réelle, sans aucune retouche à la main.

### 6.2 Les quatre cas de « fragile » rencontrés (et le texte proposé)

Mot proposé : **« de justesse »** au lieu de « fragile » (décision D2) : il dit ce qui se passe (l'étiquette tient à
une voix près), là où « fragile » laisse croire que le résultat est faible ou faux. Dans les exemples, le titre
reprend le mot affiché.

**Cas SEUIL** : une voix ferait passer de « large majorité » à « majorité », le même camp restant en tête
(7 sujets dans cette étude : Carte scolaire, Réforme du système éducatif, Suivi des élèves en difficulté,
Enseignement privé, Garde des enfants, Formation des enseignants, Encadrement administratif).

> **Pourquoi « de justesse » ?** 12 des 14 personnes qui donnent un avis sont positives (86 %). On parle de large
> majorité à partir de 80 % : si une seule de ces 12 personnes avait donné un avis négatif, ce serait 11 sur 14
> (79 %), une majorité simple. Le même camp resterait en tête ; le chiffre, 12 sur 14, est la donnée sûre.

**Cas CONCLUSION** : une voix ferait perdre la majorité (8 sujets : Proximité de l'école, Relations avec les
familles, Numérique à l'école, Composition des classes, État des locaux scolaires, Transports scolaires,
Information sur l'école, Places disponibles à l'école).

> **Pourquoi « de justesse » ?** 5 des 6 personnes qui donnent un avis sont négatives. Si une seule d'entre elles
> avait donné un avis positif, ce serait 4 contre 2 : les avis seraient partagés, et aucun camp ne l'emporterait.
> Sur 6 avis, une seule voix change la conclusion : lisez les verbatims des deux camps avant de citer l'étiquette.

**Cas PARTAGÉS** (`dividedFragile`, 3 sujets : Accès aux services administratifs, Gratuité de l'école, Écoles
rurales).

> **Pourquoi « de justesse » ?** 5 personnes sont positives, 3 négatives et 1 mitigée : les deux camps se tiennent.
> Si une seule des 3 personnes négatives avait été positive, ce serait 6 contre 2 : une majorité positive.

**Cas UNANIME** : jamais marqué (règle déjà en place, `fragileShown`).

Modèles de phrase (variables entre accolades, tout calculé par le code) :
- SEUIL : `{D} des {T} personnes qui donnent un avis sont {positives|négatives} ({pct} %). On parle de large
  majorité à partir de 80 % : si une seule de ces {D} personnes avait donné un avis {contraire|mitigé}, ce serait
  {D-1} sur {T} ({pct2} %), une majorité simple. Le même camp resterait en tête ; le chiffre, {D} sur {T}, est la
  donnée sûre.`
- CONCLUSION : `{D} des {T} personnes qui donnent un avis sont {…}. Si une seule d'entre elles avait donné un avis
  {contraire|mitigé}, ce serait {P'} contre {N'} : {les avis seraient partagés|aucun camp n'aurait la majorité}. Sur
  {T} avis, une seule voix change la conclusion : lisez les verbatims des deux camps avant de citer l'étiquette.`
- PARTAGÉS : `{P} personnes sont positives, {N} négatives{, M mitigées} : les deux camps se tiennent. Si une seule
  des {k} personnes {…} avait {…}, ce serait {P'} contre {N'} : une majorité {positive|négative}.`

Quel verbatim est en cause ? Pour « de justesse », **aucun en particulier** : n'importe laquelle des D voix suffit.
Le texte le dit implicitement (« une seule de ces 12 personnes ») ; il ne faut pas désigner une personne au hasard,
ce serait inventer une cause.

### 6.3 « À vérifier » : le texte propre à chaque cas

Le texte dit **combien**, **lesquels** (personne et autre sujet), **ce que serait l'étiquette sans eux**, et
**dans quel sens** : dans 7 des 10 cas de cette étude, l'étiquette serait plus nette sans les doubles comptes
(5 fois « unanime », une fois « large majorité » au lieu de « majorité », une fois « majorité » au lieu
d'« avis partagés ») ; dans 3 cas seulement elle serait moins nette. « À vérifier » ne veut donc pas dire
« peut-être exagéré ».

Exemple, Enseignement privé (le cas qui a arrêté Arnaud), avec les deux marques réunies dans un seul bloc :

> **Pourquoi cette étiquette ?**
> **De justesse.** 12 des 14 personnes qui donnent un avis sont positives (86 %). On parle de large majorité à partir
> de 80 % : si une seule de ces 12 personnes avait donné un avis négatif, ce serait 11 sur 14 (79 %), une majorité
> simple.
> **À vérifier.** 6 de ces 14 avis viennent d'idées rangées aussi dans un autre sujet : 4 positifs (P112, P196,
> P210, P231, aussi dans « École publique face au privé ») et les 2 négatifs (P192, aussi dans « École publique
> face au privé » ; P261, aussi dans « Financement des études »). Sans eux, il resterait 8 avis, tous positifs :
> « unanime ». Les deux critiques, qui font aussi la « minorité constante », viennent donc d'autres sujets : à vous
> de juger si elles parlent bien de l'enseignement privé.
> [Montrer ces 6 verbatims]

Exemple dans l'autre sens, Réforme du système éducatif :

> **À vérifier.** 9 de ces 24 avis, tous négatifs, viennent d'idées rangées aussi dans un autre sujet (P35, P173 et
> P293 dans « École publique face au privé » ; P259 et P354 dans « Encadrement administratif » ; P249 et P311 dans
> « Rythmes scolaires » ; P321 dans « Programmes scolaires » ; P360 dans « Qualité des enseignants »). Sans eux, il
> resterait 15 avis, dont 11 négatifs : « majorité », un avis moins net que « large majorité ».

Modèle : `{c} de ces {T} avis viennent d'idées rangées aussi dans un autre sujet : {liste par camp, personne et
autre sujet, regroupée par sujet quand il y en a plus de 4}. Sans eux, il resterait {T'} avis ({P'} positifs,
{N'} négatifs) : « {étiquette} », {un avis plus net|un avis moins net}.` Puis, dans l'Observatoire : `Ces
verbatims sont marqués ⧉ ci-dessous.` ; dans Synthèse : les choix du §5.8.

**`Montrer ces {c} verbatims`** : ouvre les camps concernés, surligne les lignes en question (fond jaune pâle et
`⧉ compté aussi dans « … »`), amène à la première, et annonce « 6 verbatims surlignés » aux lecteurs d'écran
(région `aria-live="polite"`). Les originaux dont la copie est ailleurs (P252, P279 ici) gardent leur mention
`compté aussi dans « … »` mais ne sont pas surlignés : ils n'entrent pas dans ce calcul.

### 6.4 Résumé (texte du moteur) et listes

- Dans le résumé, les mots « fragile » viennent du moteur, qui les reçoit de `highlightLine` (`(fragile)`). Changer
  le mot (D2) doit donc se faire **à la source**, dans ce qui est envoyé au moteur, pas à l'affichage : sinon le
  rapport emploierait deux mots pour un concept. Conséquence : les réponses en cache des résumés seraient à
  régénérer (coût à chiffrer avant la décision).
- La phrase existante sous le résumé (« À vérifier avant de citer ces étiquettes : … ») devient une liste de liens
  vers les sujets concernés (`Enseignement privé`, `Orientation des élèves`…), qui ouvrent chacun son explication.

### 6.5 La définition même de « fragile » : proposition de méthode (à ne pas trancher ici)

- **Constat.** `CLAUDE.md` définit « fragile » ainsi : « si une voix change la conclusion ». Le code
  (`isFragile`) marque quand une voix change **l'étiquette**. Ce n'est pas la même chose : passer de « large
  majorité » à « majorité » ne change pas la conclusion (le même camp l'emporte nettement). Le `methodologue` a déjà
  appliqué ce raisonnement au cas « unanime » → « large majorité » (passe 13) ; le cas « large majorité » →
  « majorité » est de même nature.
- **Effet dans cette étude.** 18 sujets marqués aujourd'hui. Avec la règle « la conclusion change » : 11 (les 8 cas
  CONCLUSION et les 3 cas PARTAGÉS). Les 7 cas SEUIL perdent la marque, dont Enseignement privé (12 sur 14), Carte
  scolaire (24 sur 29) et Réforme du système éducatif (20 sur 24), ceux-là mêmes que le résumé affiche.
- **Options** (pour le `methodologue`, puis Arnaud) :
  - A. Garder le calcul, changer seulement le mot et l'explication (§6.2). Aucun changement de méthode.
  - B. Réserver la marque aux cas où une voix change la conclusion (conforme à `CLAUDE.md`) ; pour les cas SEUIL,
    afficher le pourcentage à côté du chiffre (« 12 sur 14, 86 % ») sans marque.
  - C. Remplacer la marque par la marge, en clair : « à 1 voix du seuil ». Plus précis, plus long.
- **Autre point pour le `methodologue`** : « Accès aux services administratifs » (10 positifs, 19 négatifs) est
  étiqueté « avis partagés » ; un lecteur grand public lira 19 contre 10 comme une majorité. L'explication de
  l'étiquette (« le plus petit camp vaut au moins la moitié du plus grand ») doit alors figurer dans « Pourquoi cette
  étiquette ? », même sans marque.
- **Asymétrie de `labelDoubt`** : seules les copies (`copyOf`) sont retirées du calcul « sans eux », pas les
  originaux dont la copie est ailleurs. Pour le lecteur, les deux sont « comptés aussi ailleurs ». À expliquer ou à
  rendre symétrique (décision D5).

---

## 7. Risques, et ce qu'il ne faut pas faire

- **Ne pas passer au maître-détail, à la fenêtre modale ou au panneau latéral** pour lire un sujet : on perdrait le
  déroulé sur place et la lecture continue ; sur mobile, le retour ramène souvent « deux pas en arrière » (Baymard).
- **Ne pas empiler plus de deux niveaux collés sur mobile**, ni de niveau collé sur un écran de moins de 600 px de
  haut. Au-delà d'un quart de l'écran, la pile gêne plus qu'elle n'aide (NN/g, Smashing).
- **Ne pas laisser un défilement provoqué par le code faire réapparaître la barre de l'application** : la maquette a
  montré que le titre replié se retrouve alors caché sous la pile collante. Calculer la position finale avec la pile
  telle qu'elle sera, et geler la barre pendant le repli.
- **Ne pas animer des hauteurs de plusieurs milliers de pixels**, ni faire défiler en douceur sur 20 écrans : effet de
  balayage, nausée, lenteur. Plafonner (§5.2).
- **Ne pas démonter le contenu replié** (rendu à la demande) sans plan pour Ctrl+F et l'impression : aujourd'hui la
  recherche du navigateur trouve un verbatim dans un sujet fermé et l'ouvre ; c'est précieux pour un journaliste.
- **Ne pas expliquer par infobulle** ce qui doit être compris : au doigt, elle ne s'ouvre pas ou capte le geste
  (constaté sur la ligne d'un motif).
- **Ne pas montrer « les 5 premiers » d'un camp** pour raccourcir : ce serait un choix de citations, contraire à la
  méthode (les verbatims viennent en appui, pas choisis). Un camp se déroule entier.
- **Ne pas filtrer par défaut** (par verdict, par camp) : les minorités doivent rester visibles sans geste.
- **Ne pas ouvrir tous les thèmes par défaut sur mobile**, mais garder `Tout déplier` et l'impression complète.
- **Surcharge** : chaque ajout de ce document remplace quelque chose (cartes « Vue d'ensemble » → lignes de thèmes ;
  infobulles → explication en place ; « Et aussi » texte → bouton). Ne rien ajouter sans retirer son équivalent.
- **Performance avec 1 000 verbatims et plus** : 10 260 nœuds et 1 526 déclencheurs d'infobulle au chargement,
  chacun avec son propre fournisseur Radix. Un seul fournisseur pour toute la page ; infobulles des verbatims
  seulement là où l'on survole ; `content-visibility: auto` sur le contenu des thèmes fermés ; écoute du défilement
  passive, sommaire suivi par IntersectionObserver. Mesurer avant et après sur l'étude (temps d'ouverture d'un
  thème, défilement fluide sur un téléphone moyen).
- **Impression** : vérifier qu'aucun élément collant ne se répète sur chaque page du PDF et que les explications
  « Pourquoi… » s'impriment sous chaque sujet.
- **Tests existants** : `e2e/parcours.spec.ts` attend le titre « Vue d'ensemble » et clique « Replier » ; ils sont à
  réécrire avec la nouvelle structure, et à compléter par les parcours « ouvrir un thème, un sujet, replier depuis
  l'en-tête collant (position et focus) », « Et aussi », « liste → sujet → retour à la liste », « lien vers un
  sujet », sur ordinateur et mobile.

---

## 8. Décisions à prendre (non tranchées ici)

| | Décision | Qui | Proposition |
|---|---|---|---|
| D1 | Le mot du lecteur pour « motif » | Arnaud, `plume` | **« sujet »**, en gardant « thème » pour le niveau du dessus. Raisons : le moteur l'emploie déjà spontanément dans les résumés (« Les avis sont partagés sur 3 sujets », « 2 autres sujets divisent aussi ») ; « thème » garde son sens actuel (pas de migration de sens dans les exports et les rapports déjà publiés) ; « grand thème » est lourd à répéter. L'option d'Arnaud (« thème » / « grand thème ») marche aussi, mais change le sens d'un mot déjà employé partout. Dans les deux cas : un mot partout (Synthèse et Observatoire, écran et exports), règle de vocabulaire de `CLAUDE.md` mise à jour, noms internes du code inchangés (`Group`). Le texte du moteur n'emploie « motif » que 2 fois dans cette étude, la fiche 2 fois. |
| D2 | « Fragile » → « de justesse » ; et sa définition (§6.5, options A, B, C) | `methodologue` (deux lectures), puis Arnaud | Changer le mot à la source (ce qui est envoyé au moteur), chiffrer le coût de régénération des résumés en cache avant de décider. |
| D3 | Le chercheur tranche les doubles comptes dans Synthèse | `methodologue`, Arnaud | Choix enregistré dans l'analyse, recalcul immédiat, dit dans la Méthode et les exports. Reproductible (le choix fait partie des données), mais c'est une décision humaine qui modifie un compte : à valider. |
| D4 | Les verdicts d'un thème (apprécié, critiqué, qui divise, sans majorité, peu d'avis) | `methodologue` | Correspondance au §5.5. Un sujet d'un seul participant compte dans « peu d'avis ». |
| D5 | Symétrie copies / originaux dans « à vérifier » | `methodologue` | Expliquer l'asymétrie, ou retirer aussi les originaux dont la copie est ailleurs. |
| D6 | Camps fermés par défaut au-delà de 8 lignes | `ux-designer`, `testeur` | À éprouver en test avec Arnaud sur mobile. |

---

## 9. Liste priorisée

### Indispensable
1. **En-tête collant avec « Replier »** pour les volets de pastilles, les thèmes et les sujets ; repli qui replace le
   titre et rend le focus ; « Replier » de 32 px. (Causes 1 et 5 ; remarque 1 d'Arnaud ; WCAG 2.4.3, 2.5.8.)
2. **« Pourquoi cette étiquette ? » au cas par cas** (§6), dans le sujet et sous les lignes des listes, avec
   `Montrer ces N verbatims` ; plus d'infobulle pour les marques. (Cause 3 ; remarque 2.)
3. **« Le détail, thème par thème »** : rupture visuelle avec le haut ; les cartes « Vue d'ensemble » deviennent les
   lignes repliables des thèmes ; en-tête de thème collant avec sa barre. (Cause 2 ; remarque 5.)
4. **Étiquettes des thèmes par verdict** (`● 4 critiqués`…) et barre de sujets ; « 15 suggestions » corrigé en
   « 15 personnes proposent ». (Cause 4 ; remarque 7.)
5. **Une ligne fermée = une seule cible** : plus d'infobulles dans les lignes de sujets (corrige le toucher qui
   n'ouvre pas le sujet sur mobile). (Cause 5.)
6. **« Et aussi » dépliable** en vue restreinte. (Remarque 3.)
7. **Camps cliquables** : en-tête de camp et segments de barre déroulent ce camp. (Remarque 6.)

### Important
8. Barre de l'application partiellement persistante sur les pages de lecture. (Remarque 5.)
9. Animations d'ouverture et de fermeture (§5.2), mouvement réduit respecté. (Remarques 1 et 9.)
10. Sommaire qui suit la lecture sur grand écran ; accès aux thèmes depuis l'en-tête collant sur mobile.
11. En-tête des volets de pastilles (« ❝ 46 avis positifs · Expérience globale de scolarisation ») ; pastilles des
    listes libellées (« ❝ 6 propositions ») ; point orphelin corrigé.
12. Lien vers un sujet (adresse partageable) ; « Voir le sujet en détail » depuis les listes, avec retour.
13. Vocabulaire du lecteur (D1).
14. Trancher les doubles comptes dans Synthèse (D3).
15. `scroll-padding-top`, titres annoncés correctement (test VoiceOver et NVDA), Échap.

### Agréable
16. Filtre des sujets par verdict dans un thème ouvert.
17. En-têtes collants compacts quand ils collent (requêtes `scroll-state`, avec repli par IntersectionObserver).
18. Panneau « Thèmes » en bas d'écran sur mobile.
19. Infobulles des verbatims réservées au survol, délai de 500 ms.
20. Allègement du rendu (un seul fournisseur d'infobulles, `content-visibility`).

Gain attendu, estimé à partir des mesures : page repliée de 13 379 px à environ 6 600 px sur ordinateur (de 15 à
7 écrans) et de 24 700 px à environ 13 000 px sur mobile (de 29 à 15 écrans, dont 8 pour les listes, inchangées).
Ouvrir « Qualité des enseignants » sur mobile : de 7,9 écrans à environ 1,5 écran avant le choix d'un camp. Replier
depuis n'importe où dans un bloc : 1 geste au lieu de 2 à 8 écrans de défilement.

Une maquette HTML statique a servi à vérifier la pile collante, la barre qui se cache et le repli sur mobile et
sur ordinateur (elle a révélé le piège de la barre qui réapparaît pendant un repli) ; elle n'est pas dans le dépôt.

---

## 10. Sources

Les pages ont été consultées par moteur de recherche (extraits) : l'accès direct aux sites était bloqué dans
l'environnement de travail. Les formulations exactes sont à relire sur place avant d'être citées.

- Nielsen Norman Group, « Accordions on Desktop: When and How to Use » — https://www.nngroup.com/articles/accordions-on-desktop/
- Nielsen Norman Group, « Accordions: 5 Scenarios to Avoid Them » (vidéo) — https://www.nngroup.com/videos/avoid-accordions/
- Nielsen Norman Group, « Sticky Headers: 5 Ways to Make Them Better » — https://www.nngroup.com/articles/sticky-headers/
- Nielsen Norman Group, « Progressive Disclosure » — https://www.nngroup.com/articles/progressive-disclosure/
- Nielsen Norman Group, « Executing UX Animations: Duration and Motion Characteristics » — https://www.nngroup.com/articles/animation-duration/
- GOV.UK Design System, « Accordion » — https://design-system.service.gov.uk/components/accordion/
- Inside GOV.UK, « How we made the GOV.UK accordion component more accessible » (2021) — https://insidegovuk.blog.gov.uk/2021/10/29/how-we-made-the-gov-uk-accordion-component-more-accessible
- Material Design, « Top app bar » (comportement au défilement) — https://material.io/components/app-bars-top
- Material Design, « Duration & easing » — https://m1.material.io/motion/duration-easing.html
- Atlassian Design System, « Applying motion » — https://atlassian.design/foundations/motion/applying-motion
- Smashing Magazine, « Designing Sticky Menus: UX Guidelines » (2023) — https://www.smashingmagazine.com/2023/05/sticky-menus-ux-guidelines/
- Christian Heilmann, « Using position: sticky to create persistent headers in long texts » — https://christianheilmann.com/?p=6659
- Baymard Institute, « "Collapsed Sections" Layout on Mobile » (ligne directrice 1129) — https://baymard.com/guidelines/1129-collapsed-sections-layout-on-mobile
- Baymard Institute, « Avoid Using Subpages » — https://baymard.com/blog/avoid-using-subpages
- W3C, WAI-ARIA Authoring Practices, « Disclosure (Show/Hide) Pattern » — https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- Adrian Roselli, « Disclosure Widgets » (2020) — https://adrianroselli.com/2020/05/disclosure-widgets.html
- W3C, « Understanding SC 2.5.8 Target Size (Minimum) » — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- W3C, « Understanding SC 2.3.3 Animation from Interactions » — https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- W3C, « Understanding SC 2.4.11 Focus Not Obscured (Minimum) » — https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- W3C, « CSS Scroll Anchoring Module Level 1 » — https://www.w3.org/TR/css-scroll-anchoring-1/
- Chrome for Developers, « Animate to height: auto; (and other intrinsic sizing keywords) in CSS » — https://developer.chrome.com/docs/css-ui/animate-to-height-auto
- Modern CSS, « Animate `<details>` with ::details-content and interpolate-size » — https://modern-css.com/animating-details-without-javascript-height/
- Modern CSS, « Auto-hiding header with scroll-state(scrolled) » — https://modern-css.com/auto-hiding-header-without-scroll-listeners/
- Apple, « Reduced Motion evaluation criteria » (App Store Connect) — https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria
- Sara Soueidan, « Are you familiar with the Scrollspy UI pattern? » (2025) — https://www.sarasoueidan.com/newsletter/issue-2025-08-18/
- Expero, « "Back to Top" Links (Anchor Links) » — https://www.experoinc.com/insights/blog/back-to-top-links-anchor-links
- Office for National Statistics, « What makes for a good scrollytelling article? » (2021) — https://digitalblog.ons.gov.uk/2021/05/24/what-makes-for-a-good-scrollytelling-article
