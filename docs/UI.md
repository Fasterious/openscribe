# Référentiel UI d'OpenScribe

Le socle du `designer-ui` (`.claude/agents/designer-ui.md`). Recherche documentaire du 19/10/2026. Les règles marquées
**[à vérifier]** reposent sur des sources secondaires ; les autres sur la source primaire ou plusieurs sources
concordantes. Une règle sert à expliquer un défaut observé sur une capture, jamais à remplacer le regard.

## 1. Hiérarchie, typographie, espacements

- Texte courant : 45 à 90 caractères par ligne, 75 au plus (GOV.UK) ; interligne de 120 à 145 % du corps.
  [Butterick, *Practical Typography*, https://practicaltypography.com/line-length.html ; GOV.UK Layout, https://design-system.service.gov.uk/styles/layout/]
- Le texte supporte sans perte un interligne de 1,5, 2 × le corps après paragraphe, 0,12 d'interlettrage, 0,16
  d'espace entre mots : pas de hauteur fixe qui coupe un texte. [WCAG 2.2, 1.4.12]
- Échelle d'espacements fermée, multiples de 4 ou 8 px. [Carbon, https://carbondesignsystem.com/elements/spacing/overview/]
  Deux valeurs voisines d'une échelle diffèrent d'au moins 25 % ; on part de trop d'espace et on en retire.
  [*Refactoring UI*, à vérifier]
- Proximité : plus d'espace entre groupes qu'au sein d'un groupe.
- Chiffres tabulaires (`tabular-nums`) pour les comptes, tableaux et chiffres qui changent ; nombres alignés à droite
  en colonne ; chiffres proportionnels dans le texte courant.

## 2. Grand écran

- Borner la mesure du texte (`65ch` à `75ch`), pas la page ; seuls tableaux et graphiques peuvent s'élargir. GOV.UK :
  page de 1020 px au plus, colonne des deux tiers ; sur 1280 px, borner le texte à 75 caractères.
  [https://design-patterns.service.justice.gov.uk/probation/styles/pds-layout]
- L'espace latéral se garnit (sommaire collant à gauche, notes à droite) ou reste une marge ; jamais de cartes ou de
  bandeaux étirés sur toute la largeur avec un vide inexploité. [Keystone, sommaire collant :
  https://wcmauthorguide.pa.gov/en/keystone-design-system/design-system-components/Table-of-Contents.html]
- Repères de largeur (Material 3) : compacte < 600, moyenne 600–840, étendue 840–1200, grande 1200–1600, très grande
  ≥ 1600. Des repères, pas des lois. [https://developer.android.com/develop/ui/compose/layouts/adaptive/window-size-classes]

## 3. Responsive

- Points de rupture fondés sur le contenu ; requêtes de conteneur pour un composant (Baseline, largement disponibles
  depuis août 2025). Tailwind v4 : `@container`, variantes `@sm`, `@md` (28 rem, différent de `md:`, 768 px).
  [https://web.dev/blog/baseline-digest-aug-2025]
- Typographie fluide (`clamp()`) : garder une part en `rem` et tester au zoom 200 %. [Smashing Magazine, 2023]
- Aucun défilement horizontal à 320 px, sauf tableaux de données et graphiques. [WCAG 1.4.10]
- Cibles : 24 × 24 px au minimum (WCAG 2.5.8, aussi à la souris) ; 44 pt (Apple) et 48 dp avec 8 dp d'écart (Google)
  recommandés au doigt. [https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html]
- En-têtes collants : `scroll-padding-top` à leur hauteur ; le focus n'est jamais masqué (WCAG 2.4.11).

## 4. États

- Chaque composant interactif : repos, survol, focus visible (`:focus-visible`), enfoncé, sélectionné, vu,
  désactivé, chargement ; chaque vue : vide, erreur. Les mêmes jetons partout.
- Focus : jamais entièrement masqué (2.4.11, AA) ; idéalement un contour de 2 px à 3:1 (2.4.13, AAA).
- Bordures et états à 3:1 de leur voisinage (1.4.11).

## 5. Couleur et contraste

- 4,5:1 pour le texte, 3:1 pour le grand texte et les éléments graphiques (WCAG 2.2) ; APCA en second avis seulement.
- La couleur n'est jamais seule porteuse de sens (1.4.1) : libellé, nombre ou forme l'accompagnent.
- Couleurs de catégories distinguables par les daltoniens (référence : palette Okabe-Ito) ; au-delà de 8 catégories,
  étiqueter plutôt que colorer. Aucune palette ne garantit 3:1 entre toutes ses couleurs : le libellé reste nécessaire.
  [https://carbondesignsystem.com/data-visualization/color-palettes/ ; https://nightingaledvs.com/data-journalism-colour-accessibility/]
- Mode sombre : redéfinir les jetons et revérifier chaque contraste (#2F40C2 sur fond sombre est à contrôler).

## 6. Mouvement (motion design)

- 100 ms pour un retour simple, 200 à 300 ms pour un changement de disposition, 500 ms au plus. [à vérifier]
- Le mouvement sert la continuité spatiale (d'où vient l'élément, où il va), jamais la décoration.
- Chorégraphie : un repère reste fixe pendant que le reste bouge ; ce qui sort part avant ce qui entre ; plusieurs
  éléments se décalent légèrement (quelques dizaines de ms) plutôt que de bouger en bloc ; un élément partagé glisse
  d'un état à l'autre au lieu de disparaître puis réapparaître.
- Courbes : décélération pour entrer, accélération pour sortir, standard pour un déplacement à l'écran ; jamais
  linéaire pour un mouvement dans l'espace. Durée proportionnée au trajet et à la taille de l'élément.
- Performance : n'animer que `transform` et `opacity` (composées hors du fil principal) ; une position (`top`), une
  hauteur ou une ombre animées se recalculent à chaque image et saccadent ou décrochent au défilement.
- Interruption : une animation se reprend ou s'inverse depuis son état courant ; elle ne bloque jamais un clic.
- Vérification : image par image (`document.getAnimations()`, mesures à chaque `requestAnimationFrame`), pas sur une
  capture fixe.
- Transitions de vue : tester `document.startViewTransition` ; couper leurs animations sous `prefers-reduced-motion`.
- Ne jamais animer une position (`top`) sur un élément collant pendant le défilement : il décroche (constaté le 19/10).

## 7. La critique, pas la liste de cases

- Un évaluateur seul trouve environ un tiers des problèmes, avec des faux positifs ; les heuristiques expliquent, elles
  ne garantissent rien. [Gray et Salzman, 1998, cité par https://oldmagazine.uxpa.org/?p=11227, à vérifier]
- Une critique part des objectifs de l'écran, regarde par angles successifs, sépare l'observation de la décision.
  [Figma, https://www.figma.com/blog/design-critiques-at-figma/]
- Méthode : captures à 320, 390, 768, 1024, 1280, 1600 px, zoom 200 %, mouvement réduit ; mesures plutôt
  qu'impressions ; comparaison à un étalon ; chaque défaut rattaché à une tâche du lecteur. Les outils automatiques ne
  voient qu'environ 30 % des défauts d'accessibilité : passe au clavier obligatoire.

## 8. Visualisation de données

- La forme suit la question : partie d'un tout, barre empilée à 100 % ; classement, barres horizontales triées ;
  comparaison de groupes, petits multiples à échelle commune. [FT Visual Vocabulary, https://github.com/Financial-Times/chart-doctor]
- Étiquetage direct plutôt que légende, sauf segments trop serrés.
  [https://www.datawrapper.de/blog/improved-stacked-column-charts ; https://data.europa.eu/apps/data-visualisation-guide/direct-labelling]
- Petits effectifs : 56 % contre 44 % sur 9 personnes, c'est 5 contre 4 ; montrer les comptes, la base toujours
  visible. [https://stephanieevergreen.com/visualizing-small-datasets ; https://measuringu.com/should-you-report-numbers-with-small-n/]
  Chez nous : des personnes en chiffres, jamais un pourcentage seul.
- Trier par valeur, sauf ordre naturel (l'échelle d'avis) ; une ligne de base commune pour comparer.
- Sobriété (rapport données/encre de Tufte) : ni ombre, ni 3D, ni grille lourde.
- Mobile : barres horizontales, étiquettes au-dessus, aucune valeur lisible seulement au survol.

## 9. Outils de lecture et d'analyse

- Divulgation progressive : l'essentiel d'abord, le détail ensuite.
- Long document : le sommaire montre la structure autant qu'il sert à naviguer ; collant sur ordinateur, replié sur
  mobile, section courante surlignée ; ancres partageables. [Wikimedia, tests utilisateurs :
  https://www.mediawiki.org/wiki/Reading/Web/Desktop_Improvements/Repository/Sticky_Header_and_Table_of_Contents_User_Testing]
- Traçabilité : de chaque chiffre, un clic jusqu'à sa source (comme Our World in Data).
- Deux densités, mêmes jetons : compacte pour produire, aérée pour lire.
- Limites et mentions « à vérifier » au même niveau visuel que les résultats.

## 10. Les dix défauts à traquer d'abord

1. Texte de plus de 80 à 90 caractères par ligne sur grand écran.
2. Blocs étirés sur toute la largeur, vide latéral inexploité.
3. Pourcentages sans base, ou proportions sur 3 à 9 personnes sans les comptes.
4. Couleur seule pour distinguer un camp ; légende séparée au lieu d'étiquettes directes.
5. En-tête collant qui masque le focus ou la cible d'une ancre.
6. Focus invisible ; états de survol, d'enfoncement, de sélection incohérents d'un composant à l'autre.
7. Cibles de moins de 24 px ; actions accessibles seulement au survol.
8. Tailles et espacements hors échelle ; trop de graisses ou de couleurs.
9. Défilement horizontal à 320 px ; texte coupé par une hauteur fixe au zoom 200 %.
10. États vide, chargement ou erreur absents ; chiffres qui « dansent » ; contrastes ratés en mode sombre.

## Références

*Refactoring UI* (Wathan et Schoger) ; *Practical Typography* (Butterick) ; *Laws of UX* (Yablonski) ; GOV.UK Design
System ; Carbon (IBM) ; Material 3 et Apple HIG ; Tufte, *The Visual Display of Quantitative Information* ; Few, *Show
Me the Numbers* ; Cairo, *How Charts Lie* ; FT Visual Vocabulary ; Datawrapper Academy.
