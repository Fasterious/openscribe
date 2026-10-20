# Journal de décisions

Chaque décision structurante, datée, avec sa raison. Le plus récent en haut.

## 2026-10-20 (suite) — Trois retours d'Arnaud appliqués

- **La barre de l'application se cache pendant la lecture**, partout dans le rapport : elle sort de l'écran au rythme
  du défilement vers le bas et revient au même rythme en remontant ; entière tout en haut de la page et au focus
  clavier. La lecture n'est pas encombrée.
- **« Avant de lire » en quatre parties titrées** : la question posée (avec sa place dans le questionnaire), comment
  les données ont été recueillies (questionnaires en ligne du Grand débat, réponses publiées en données ouvertes),
  notre échantillon, les limites. Nouveaux champs facultatifs de la fiche : `questionContext`, `collection`,
  `questionnaire`, `questionIndex`. Les 33 questions du questionnaire, lues dans l'en-tête du fichier source depuis un
  bac à sable Vercel (le réseau de la session ne joint pas data.gouv.fr ; 86 s, 216 Ko lus) : notre question est la
  22e (le « Q32 » de nos colonnes était un numéro de colonne, pas de question). Liste dépliable, notre question en gras.
- **« Minorité constante » retirée de l'écran** (étiquette, bandeau, ligne de chiffres, note de méthode) : le camp
  minoritaire est déjà dans les chiffres et dans la liste des camps, avec ses verbatims ; le mot était du jargon. Le code
  la calcule toujours (elle informe les consignes du moteur).

## 2026-10-20 — Décisions d'Arnaud ; plus de transition de vue sur les blocs

- **Mitigé (décision d'Arnaud)** : on garde la règle. Une personne qui dit du bien et du mal d'un même thème est
  mitigée, même si l'un de ses avis vient d'une copie (codage en double) : P11 juge bien un service et mal un autre du
  même thème « Accès aux services administratifs ». La pastille déroule ses deux avis.
- **Nom du grand thème dans l'en-tête d'un thème lu** : non (Arnaud partagé, avis de l'orchestrateur suivi) ; une ligne
  qui apparaît et disparaît coûterait plus qu'elle n'apporte, remonter un peu fait revenir le grand thème.
- **« À vérifier », prochain chantier (piste d'Arnaud, à ne pas engager maintenant)** : reproduire ce rapport dans le
  module Synthèse ; « à vérifier » n'y a de sens qu'avec une action du chercheur (valider ou déplacer). Dans une étude
  automatique (Observatoire), c'est l'orchestrateur qui tranche lors de sa propre analyse, sans laisser de mention en
  suspens.
- **Blocs sans transition de vue** : la barre de l'application clignotait encore au repli d'un grand thème chez Arnaud
  (non reproduit dans Chromium) ; les grands thèmes et thèmes s'ouvrent et se replient par leur hauteur. Seul le repli
  d'un volet de verbatims garde la sienne (l'intitulé glisse jusqu'à la pastille).
- **Repousser après une remontée** : la barre se recache au rythme du défilement (elle sautait d'un coup, la poussée
  visée se calculant d'après le haut du grand thème, déjà loin au-dessus) ; mesuré : 57, 42, 27, 12, 0 px par pas de 15.
- **En-têtes de verbatims collés dans l'explication « à vérifier »** : `overflow-clip` au lieu de `overflow-hidden`.

## 2026-10-19 (soir) — Les en-têtes se poussent comme des objets ; marques en étiquettes

- **Chaîne physique** (Arnaud) : le grand thème qui arrive contre la barre la pousse pixel pour pixel ; le thème lu pousse
  à son tour le grand thème ; en remontant, le grand thème revient d'abord, puis la barre. La poussée se calcule d'après
  la position réelle des blocs (la somme des défilements laissait des trous de 10 à 20 px au contact) ; en descendant,
  rien ne revient (le grand thème redescendait puis repartait à la fin d'un thème). Les en-têtes collés reçoivent leur
  position directement : une variable sur la racine recalculait les styles des 12 000 nœuds à chaque image (8,8 ms ;
  0,23 ms désormais). Mesuré à chaque image, sur ordinateur et mobile, à toutes les vitesses : aucun trou, aucun
  mouvement à contre-sens, aucun saut. La marge de défilement suit la pile collée (focus jamais dessous).
- **Marques « fragile » et « À vérifier »** (designer-ui) : petites étiquettes avec chevron (sans icône, Arnaud), bleues
  une fois ouvertes ; l'explication s'ouvre dessous en 220 ms et se referme en 180 ms ; Échap la referme.
- **Certification** : après le repli d'un thème lu, la barre revenait et couvrait la ligne repliée (le défilement du
  repli, dans une transition de vue, arrivait après la fin du gel et passait pour une remontée) : le gel s'arme dans la
  transition elle-même ; test de parcours sous processeur ralenti (×6), qui échoue sans le correctif. En Maj+Tab,
  l'élément focalisé est dégagé de la pile collée.
- **Seconde contre-vérification** : le gel à délai fixe ne suffisait pas (11 échecs sur 15 quand la transition rend la
  main après 1,1 à 1,5 s) : le défilement du code est ignoré jusqu'à la fin réelle de la transition (15 sur 15 ensuite).
  Tab dans la barre ne fait plus remonter la page.
- **Ouvrir un grand thème** (Arnaud) : plus de transition de vue à l'ouverture (la ligne ouverte est la ligne fermée,
  rien ne glisse ; la page remplacée par une image faisait disparaître la barre) ; la barre a sa propre couche pendant
  les replis ; la ligne garde exactement sa taille ouverte (marge constante, trait sans épaisseur au lieu d'une bordure).
- **Granularité** (Arnaud) : la ligne d'un grand thème ne parle que de thèmes (« 2 signaux isolés »), plus de comptes de
  personnes ; le nombre de participants reste pour le volume.
- **Avis mitigé à vérifier** : la pastille « 1 avis mitigé » déroule les deux avis de la personne (le sien et la copie
  qui la rend mitigée). Enquête : 6 des 18 personnes mitigées de l'étude école ne le sont que par une copie du codage en
  double qui contredit leur propre avis (P11 : la CAF lente, l'inscription scolaire rapide). Décision de méthode soumise
  à Arnaud.

## 2026-10-19 — Lire le rapport : le regard suit (retours d'Arnaud sur la préversion)

- **Une seule forme pour un camp** : l'intitulé d'un volet de verbatims reprend le point du camp (« ● 46 avis positifs »),
  comme la pastille qui l'a ouvert ; l'explication « à vérifier » déroule ses verbatims par camp (« ● 4 avis positifs ● 2 avis négatifs »).
- **Replier ramène à la pastille** : l'intitulé du volet glisse jusqu'à la pastille, revenue à l'endroit exact où on
  l'avait touchée (transition de vue) ; la dernière pastille repliée garde un contour bleu léger.
- **« À vérifier » s'explique juste dessous** : l'explication s'ouvre sous la marque et pousse le contenu, au lieu de
  venir après « Lire le thème en détail » ; la marque reste enfoncée tant que l'explication est ouverte.
- **Premier audit du `designer-ui`** (agent créé à la demande d'Arnaud) : une mesure de lecture unique, `max-w-lecture`
  (38 rem, 75 caractères en Geist) pour tout texte courant, « Avant de lire » et la méthode compris (fini le vide à
  droite et les lignes de 146 caractères) ; listes du haut sur une colonne (la seconde colonne s'arrêtait un écran plus
  tôt) ; comptes et barres des thèmes alignés à droite, « › » et « Replier » à la même place (plus de glissement de
  72 px à l'ouverture) ; un seul chevron ; pastille de l'accueil identique à celle du rapport.
- **Explication « à vérifier »** : les pastilles suivent les groupes de la phrase (« 6 avis positifs », « 1 avis
  mitigé »), « fragile » et « À vérifier » s'ouvrent séparément, un double clic sur une pastille ne l'annule plus.
- **Défiler vite ne décroche plus les en-têtes** : leur position n'est plus animée (une position animée se recalcule à
  chaque image et prend du retard sur un défilement rapide) ; fonds opaques ; la barre de l'application glisse en se
  cachant, au-dessus des en-têtes, et revient d'un coup (sinon un interstice laisse voir le texte).

## 2026-10-18 (soir) — « Grand thème » et « thème » ; glisser plutôt que téléporter (retours d'Arnaud)

- **Vocabulaire, décidé par Arnaud** : « grand thème » pour le niveau haut, « thème » pour l'ancien « motif ». Seuls les
  textes lus changent ; le code et les consignes du moteur gardent leurs noms (changer une consigne invaliderait le
  cache et le rapport publié). Les deux niveaux se nomment ensemble avec leur lien : « 73 thèmes, réunis en 10 grands
  thèmes » (`plume`).
- **La barre ne disparaît plus** : l'en-tête ouvert garde la barre de la ligne fermée (cause : l'en-tête compact
  l'avait retirée). Titre, barre et compte glissent de la ligne à l'en-tête par une transition de vue du navigateur,
  à l'ouverture comme au repli ; sans elle, ou si le lecteur a demandé moins de mouvement, rien ne change.
- **Le repli range au lieu de remplacer** : l'ancienne image se retire vers le bas du titre, le bloc suivant est déjà dessous.
- **Grand thème collé, prioritaire** : il reste collé (mobile compris) tant qu'on lit ses thèmes fermés ; dans un thème
  ouvert, il s'efface avec la barre de l'application en descendant et revient avec elle en remontant ; sur un écran
  bas, il s'efface dès qu'on lit un thème ouvert. Un seul niveau à l'écran pendant la lecture, le contexte au premier
  geste vers le haut.
- **Sauts** : court (moins d'un écran et demi), défilement doux ; long, arrivée directe et titre éclairé un instant.
- **Compte des thèmes** (laissé à notre choix par Arnaud) : « 10 thèmes ● 4 ● 1 ● 3 » dans l'en-tête collé du grand
  thème sur écran large, les mots en infobulle ; la ligne complète reste en tête du contenu.
- **Second retour d'Arnaud, le même soir** : l'en-tête collé est la ligne fermée elle-même (titre, barre et
  indicateurs dessous), pas une version compacte : c'est ce qui donne son sens à la barre. Sa hauteur se mesure pour
  empiler les en-têtes. Plus de « Replier » en bas des blocs (celui de l'en-tête suffit). Dans le résumé, les
  pastilles deviennent « ● 46 », une par camp, à la couleur du camp, cliquables ; « 22 positifs, 23 négatifs » déroule
  les deux camps entiers (le code étend chaque camp cité dont la phrase donne le nombre).
- **Passe de certification (79617ec)** : après un saut depuis les listes, le grand thème s'effaçait et laissait un trou
  (le seuil « on lit le thème » valait dès que le titre arrivait sous le grand thème : il faut maintenant être descendu
  de 24 px dedans) ; dans « Ce qui divise », les pastilles comptaient les mitigés dans les deux camps (28 et 29 pour
  « 22 positifs, 23 négatifs, 6 mitigés ») : les mitigés n'y sont plus déroulés. Point final collé à sa pastille.
- **Passe testeur** : rouvrir un bloc qu'on venait de replier faisait sauter la page jusqu'à 1 200 px (l'ancrage du
  défilement prenait le bloc suivant pour repère, le titre devenu collé ne comptant plus) : ancrage suspendu à
  l'ouverture, test de parcours qui échoue sans le correctif.

## 2026-10-18 — Lire le rapport : replis collants, détail par thème, étiquettes expliquées (retours d'Arnaud)

Audit et spécification du `ux-designer` : `docs/LECTURE-RAPPORT.md` (mesures, causes racines, bonnes pratiques
sourcées). Livré :
- **Replier sans chercher** : l'en-tête d'un thème, d'un motif ou d'un volet de verbatims reste collé avec
  « Replier » tant qu'on le lit ; replier remet le titre sous l'en-tête et rend le focus ; Échap replie le bloc le
  plus intérieur ; ouverture 220 ms, fermeture 180 ms, aucune animation pour un très grand bloc ni en mouvement
  réduit. La barre de l'application se cache en lecture quand on descend, revient quand on remonte.
- **« Le détail, thème par thème »** remplace « Vue d'ensemble » (cartes et sections fusionnées) : une barre par
  motif, à la couleur de son verdict et à la largeur de ses participants ; « 10 motifs : ● 4 critiqués ● 1 qui
  divise… » (verdicts relus par le `methodologue` : jamais plus forts que l'étiquette ; « sans avis » ;
  les motifs d'une seule personne à part). Une ligne fermée est une seule cible (le toucher n'ouvre plus une
  bulle à la place du motif). Les camps se déroulent en touchant leur en-tête ou leur segment de barre ; au-delà
  de 8 personnes, fermés au départ.
- **« Pourquoi cette étiquette ? »**, au cas par cas, calculé par le code (`explain.ts`) : quelle voix ferait changer
  la conclusion, quelles personnes ne sont comptées que par une idée rangée d'abord ailleurs, et l'étiquette sans
  elles, avec ces verbatims. Plus d'infobulle pour ces marques.
- **« Fragile » seulement quand une voix change la conclusion** (`methodologue`, conforme à la règle de CLAUDE.md) :
  « 12 sur 14 » ne l'est plus (Arnaud y voyait une erreur). Le mot est gardé. L'étude école passe de 18 à 11
  marques ; son résumé a été régénéré (passe 17), ses 3 « (fragile) » de seuil ont disparu.
- **Listes** : pastilles libellées (« ❝ 27 avis négatifs »), marques qui déplient leur explication, « Et aussi »
  dépliable, « Lire le motif en détail → » avec un bouton de retour à la liste. En-tête des volets (« ❝ 46 avis
  positifs · Expérience globale de scolarisation »), point orphelin corrigé. En-tête de l'étude : « 366 participants
  sur 378 tirés au sort », l'écart expliqué.
- **Impression** : tout se lit sur papier, camps fermés et « Et aussi » compris, rien de collant.
- **Laissé pour plus tard** (« important » ou « agréable » dans la spécification) : sommaire qui suit la lecture sur
  grand écran, adresse partageable d'un motif, camp en cours dans l'en-tête collant sur mobile, filtre par
  verdict, allègement du rendu (premier dépliage d'un thème : ~350 ms en développement, à mesurer sur le build).
- **À trancher par Arnaud** : le mot du lecteur pour « motif » (« sujet » proposé, ou « thème » / « grand thème ») ;
  le chercheur qui tranche les doubles comptes dans Synthèse.

## 2026-10-18 — Codage en double : on garde (décision d'Arnaud)

- « Le privé est bien meilleur que le public » dit deux choses : une critique du public et un éloge du privé. Elle
  compte dans les deux motifs. Ne pas la compter côté public effacerait une donnée, et si le motif « privé »
  n'émergeait pas, elle ne serait comptée nulle part. Le code continue de signaler « à vérifier » quand une
  étiquette dépend de ces copies.

## 2026-10-17 — Synthèses des motifs récrites, article d'une page retiré (retours d'Arnaud)

- **Synthèses des motifs** (passes 15, 16, 16b, 16c, idées et motifs identiques à la 14b) : plus de « une large
  majorité de ceux qui en parlent » ; le mot de l'échelle toujours avec son nombre, entre parenthèses ; la base
  « qui donnent un avis » ; chaque camp compté ; aucun sujet collectif sans nombre. Passe 15 : langue meilleure,
  mais G1 et G2 ne citaient plus qu'une part de leur camp (69 personnes absentes). Passe 16 : nouveau contrôle du
  code, un camp cité à moins de 80 % est signalé à la vérification des renvois (seuil du `methodologue`, rodé sur le
  cache : 4 camps en 15, 0 en 14b). Résultat 16c : 0 camp sous 80 %, 1 erreur au résumé au lieu de 2 (« réforme »
  corrigée ; « public face au privé » demeure, elle vient de la définition du motif) ; `methodologue` 7 et 7,5/10,
  `plume` 7/10 aux motifs (6 en 14b). Publiée à la place de la 14b.
- **Exemples des consignes : deux reprenaient le corpus de certification** (« l'orientation des élèves… 27 des 28 »,
  « la carte scolaire, par 24 sur 29 »). Remplacés par des exemples fictifs ; le test de confidentialité vérifie
  désormais qu'aucun titre de motif d'une analyse privée n'apparaît dans les consignes.
- **Contrôles des comptes, fausses alertes corrigées à la source** : « 2 personnes … : l'une, l'autre » ; la base
  d'un rapport (« 4 des 5 personnes ») ; une date (« les années 1950 ») ; « la seconde » ; la phrase qui dit le
  compte du motif, gardée sans renvoi. Passe 16 : 5 phrases justes retirées ; 16c : 0.
- **L'article « Lire en une page » est retiré** (Arnaud préfère l'application). Avant de le supprimer, on a repris
  dans l'application ce qu'il avait en plus : la méthode détaillée (le même texte que l'export, une seule source),
  la section « Hors question », l'impression (« Imprimer ou enregistrer en PDF »). Son adresse devient une page
  légère (titre, description, aperçu pour les réseaux) qui ouvre l'étude : les anciens liens marchent.
- **Replier ramène là où l'on a déplié** ; **Ollama n'est cherché depuis le site en ligne que sur demande**, avec
  une phrase qui explique la demande d'accès du navigateur (elle s'affichait à l'ouverture de la page Moteur).
- **À trancher par Arnaud** (décisions de méthode) : un motif « A face à B » peut-il porter un camp ? ; une copie du
  codage en double peut-elle changer d'objet et de ton ? ; une rubrique à part pour les propositions opposées ?

## 2026-10-17 — Observatoire dans l'application : menu, résumé, listes, chiffres (retours d'Arnaud)

- **Arnaud préfère la version application.** Un clic sur l'étude l'ouvre dans l'application ; la liste des études
  y est aussi (même menu partout) ; l'article reste à un bouton (« Lire en une page »), gardé tant qu'on n'est
  pas sûr.
- **Menu** : des icônes ; la page active dit son nom ; les modules à venir sont présents, grisés. Synthèse :
  des calques (ni bécher, ni entonnoir trop « filtre ») ; Observatoire : un télescope.
- **En-tête d'étude** : une seule ligne grise (date, actualité, participants, idées) ; plus de « Rapport du » en
  double ni de « En bref » à côté du « Résumé ». L'écart 378 / 366 est dit dans « Avant de lire » : 12 réponses,
  trop brèves, ne donnent aucune idée.
- **Chiffres partout** : tout compte de personnes en chiffres, en tête de phrase comme ailleurs, nombres composés
  compris (« 46 personnes ») ; « une personne » reste en lettres. Appliqué par le code (`countsInDigits`).
- **Listes du résumé, uniformes** : la phrase qui ouvre la synthèse du motif, puis ❝ N, qui déroule les verbatims
  des N participants comptés ; plus de citations choisies. Dans le résumé, une pastille qui suit un nombre
  (« 46 personnes… ❝ 46 ») déroule tout le camp compté (`wholeCamp`). Tous les déroulés ont la même forme : une
  ligne par participant, chaque verbatim dépliable dans sa réponse entière.
- **Résumé plus qualitatif** (consigne « consultation ») : la première phrase dit qui pense quoi, en personnes,
  et plus « X expriment au moins une critique » ; la base « qui donnent un avis » une fois par paragraphe ;
  l'échelle entre parenthèses (« 12 sur 14 (large majorité, fragile) ») ; « fragile » n'est plus donné au moteur
  pour un « unanime ». École rejouée sur le seul résumé (passes 14 et 14b) : analyse identique ; `methodologue` :
  mêmes 2 erreurs qu'en passe 13, aucune nouvelle, première phrase « bien plus utile » ; `plume` : 7/10 au
  résumé (6,5 pour le rapport entier en passe 13).
- **Reste** : les synthèses des motifs disent encore « de ceux qui en parlent » (leur consigne, changée, coûterait
  un rejeu complet) ; l'article n'a pas encore les listes uniformes ; les deux erreurs viennent des motifs eux-mêmes.

## 2026-10-17 — Passe `testeur` sur la version application de l'Observatoire

- **Trouvé** : l'application n'affichait ni la définition d'un motif ni la mention « aussi dans » d'une citation
  codée en double, alors que l'explication de « à vérifier » y renvoie (vrai aussi dans Synthèse) ; l'impression
  perdait le titre et la fiche ; un export depuis l'Observatoire partait sans source ni limites ; une coupure
  réseau se disait « étude introuvable ».
- **Corrigé** : définition pliée sous la synthèse et « aussi dans » sous chaque citation copiée, dans Synthèse
  comme dans l'Observatoire ; titre et fiche imprimés ; une étude publiée se télécharge depuis l'article (qui
  porte sa fiche), pas depuis l'application ; « Réessayer » en cas de coupure ; titre d'onglet ; accord
  « réécritures qui ne respectaient pas ».
- **Laissé pour plus tard** : le résumé rédigé dit encore « unanimes, mais fragiles » (le texte injecté au moteur
  suit le calcul brut ; à corriger à la source, au prochain rejeu) ; le filtre par région (14 valeurs, au-delà de
  la limite de 12) ; le violet des suggestions, proche du bleu de la marque.

## 2026-10-17 — L'article de l'Observatoire devient interactif

- **Proposition d'Arnaud** : l'article se lit mieux (tout le texte, sans cadres) ; il lui manque l'interactivité
  de Synthèse. Et la synthèse d'un motif, dans son encadré gris, se lit moins bien que la définition du motif,
  qui est secondaire : on échange.
- **Fait** : dans la page HTML du rapport (Observatoire et export de Synthèse), un renvoi « P12 » déplie ses
  verbatims sous le paragraphe ; un verbatim, sa réponse entière avec la question et le passage cité en gras ;
  un « ? » ou une marque, son explication. La synthèse se lit sans encadré ; « ce qui compte comme positif ou
  négatif » est plié et s'ouvre en gris. Sans script (impression), la page reste complète, tout déplié.
- **Deux versions, nommées par l'usage** : « Lire en une page » (l'article, version principale) et « Ouvrir dans
  l'application » (motifs repliés, filtres). Arnaud comparera avant d'en garder une.
- **Une seule source** : l'article et l'application sont générés de la même étude masquée ; la publication
  échoue si un prénom subsiste dans la page ou dans le fichier.

## 2026-10-17 — L'Observatoire en deux versions : interactive et document

- **Demande d'Arnaud** : la page publiée se lit mieux (sans cadres, texte large), mais elle n'est pas
  interactive ; garder les deux pour comparer avant d'en retirer une.
- **Fait** : `#/observatoire/<slug>` ouvre l'étude dans le rapport de Synthèse, en lecture seule, avec sa fiche ;
  la page statique reste la « version document » (d'un seul tenant, faite pour imprimer, lue par les moteurs de
  recherche). Chacune renvoie à l'autre ; l'accueil et la liste mènent à l'interactive.
- **Prénoms masqués à la source** (règle d'Arnaud : personne ne doit être visé dans une restitution) : la version
  interactive montre la réponse entière autour de chaque verbatim, donc le fichier publié (`etude.json`) est
  masqué partout, réponses comprises ; les positions des citations sont recalculées (1 051 sur 1 051 retrouvées
  sur l'école). La publication échoue si un prénom subsiste ; ni la liste des prénoms ni les réponses du moteur
  ne sont publiées ; un test le vérifie sur chaque étude publiée.

## 2026-10-17 — La barre d'un motif reprend ses listes ; lecture mobile sans cadres

- **Remarque d'Arnaud** : la barre mêlait une couleur absente du reste (orange pour « mitigé ») alors qu'en
  dessous la personne mitigée figure en vert et en rouge ; les suggestions doivent y figurer, car elles disent
  quelque chose sans être un avis.
- **Fait** : `categoryBar` donne une part par liste affichée sous le motif (avis positifs, négatifs,
  suggestions, questions, constats), dans le même ordre et aux mêmes couleurs, à la largeur de son nombre de
  participants ; une personne mitigée compte dans les deux parts d'avis, comme dans les listes. Même barre
  dans l'application, la page HTML et le Markdown ; légende et infobulle disent ce qu'elle compte. Les chiffres
  et l'échelle d'avis ne changent pas.
- **Ordre** : l'application listait toujours les avis négatifs d'abord, le document le camp le plus nombreux
  d'abord ; on garde la règle de la méthode (la majorité d'abord) partout.
- **Mobile** : sur petit écran, les motifs, les listes du résumé et la Méthode perdent leur cadre (un trait sous
  chaque bloc) ; le contenu prend toute la largeur, comme sur la page de l'Observatoire.

## 2026-10-17 — Navigation de l'Observatoire

- **Remarque d'Arnaud** : un clic sur l'étude doit mener à l'étude, pas à une page intermédiaire ; et sur les
  pages de l'Observatoire, on ne pouvait pas revenir.
- **Fait** : l'accueil liste les dernières études (lues dans `observatoire/index.json`) et chacune mène droit à
  sa page ; la liste complète est à un lien « Toutes les études de l'Observatoire ». L'Observatoire entre dans
  le menu du haut de l'application (icône seule sur mobile, faute de place). Les pages publiées portent le
  même menu (Accueil, Synthèse, Observatoire) et l'étude un lien vers la liste : on n'y est jamais coincé.
- **Pourquoi le menu plutôt qu'une page à part avec un retour** : l'Observatoire grandit chaque semaine, c'est
  une destination ; un « retour » dépend d'où l'on vient (un lien partagé arrive sans historique), un menu non.
- Sur mobile, le logo mène à l'accueil : l'icône « Accueil » en double laisse la place à l'Observatoire ; sous
  380 px, « Moteurs d'IA » se réduit à son icône et à son état. Test de parcours : à 360 et 390 px, aucun lien
  du menu n'en recouvre un autre.

## 2026-10-17 — Rapport de Synthèse : la taille de lecture de l'Observatoire

- **Remarque d'Arnaud** : la page de l'Observatoire se lit mieux, la police du rapport de Synthèse est trop
  petite, surtout sur mobile. Mesuré : l'Observatoire met 78 % de son texte en 16 px ; le rapport de Synthèse
  était surtout en 14 px, avec une part en 12 px.
- **Fait** : même échelle que l'Observatoire, 16 px pour ce qu'on lit (résumé, synthèses, verbatims, listes,
  réponse d'origine), 14 px pour les chiffres et les repères, plus rien en 12 px ; pastilles en 13 px,
  infobulles en 14 px.

## 2026-10-17 — Passe finale de l'école, notée sur 10 ; nouveau site en ligne

- **Demande d'Arnaud** : finaliser, une seule passe notée sur 10 (on garde la note obtenue), fusionner et mettre
  en ligne sur Vercel, où les déploiements échouaient ; à la fin, il se connecte au site et voit l'étude.
- **Passe 13** : code d'analyse inchangé depuis la passe 12, rejouée depuis le cache (aucune demande au moteur,
  résultat identique). Deux lectures `methodologue` : **7/10 et 7/10**, 2 erreurs du résumé (réforme, école
  publique face au privé), structure saine ; `plume` : **6,5/10**. Note gardée, comme convenu.
- **Retouches d'affichage, sans rejeu, sur l'avis des deux lectures** : « fragile » n'est plus posé sur un
  « unanime » (une voix de moins, la conclusion tient) et paraît dans toutes les listes du résumé ; une ligne
  du code rappelle sous le résumé les étiquettes « à vérifier ». Essayé puis retiré : taire « à vérifier »
  quand l'étiquette serait plus nette sans les copies (cela effaçait la mention sur une des deux erreurs).
- **Fiche corrigée** sur les deux phrases fausses ; elle annonce la note et ses limites.
- **Infobulles** : explications au survol, au clavier et au toucher (`Explain`) ; au toucher, une infobulle
  seule ne s'ouvre pas (rapport du `testeur`) ; la minorité constante est expliquée dans la Méthode.
- **Vercel** : le projet était réglé pour Next.js (l'ancienne application de `main`), d'où l'échec de chaque
  déploiement de la branche (NEXT_NO_VERSION). `vercel.json` fixe Vite.
- **Mise en ligne, décision d'Arnaud (« tu merges et tu le mets sur Vercel »)** : l'ancienne application
  (Next.js, sans historique commun) est archivée sur la branche `archive/application-nextjs` ; `main` reçoit la
  nouvelle par une fusion qui garde les deux historiques ; `openscribe.fr` sert la nouvelle application. Retour
  arrière possible en un clic sur Vercel. Le plan du 12/10 (dépôt neuf) est abandonné : un seul dépôt suffit.
- **L'Observatoire** est désormais relié depuis l'accueil et le pied de page.

## 2026-10-17 — Note relative sur 10, publication sans seuil, étude école publiée

- **Décisions d'Arnaud** : la note est un repère relatif, posé par un évaluateur qui peut se tromper (le changement d'évaluateur du 14/10 a fait passer la même synthèse de 4,5 à 3 sur 5) ; elle passe sur 10 pour plus de finesse ; aucun seuil de publication : une étude se publie avec le meilleur moteur du moment, la méthode et ses limites expliquées, et les doutes signalés. Arnaud ne relit pas chaque étude. Pas de passe 13. Un document de méthode, étape par étape, est tenu à jour.
- **Fait** : grille sur 10 (`docs/NOTATION.md` : chaque critère noté directement sur 10, précisé par Arnaud le jour même, une note sur 5 doublée gardant la grossièreté de son échelle ; le plafond devient un compte d'erreurs du résumé) ; mention « à vérifier » calculée par le code quand l'étiquette d'un motif dépend d'avis comptés aussi dans un autre motif, et « fragile » étendu aux avis partagés qu'une voix ferait basculer, dans les listes et sous les titres ; paragraphe « Limites » dans la section Méthode ; `docs/METHODE.md` ; étude école (passe 12) publiée dans `public/observatoire/`, fiche relue par la `plume`.
- **Test de confidentialité** : il accepte désormais les réponses des corpus de l'Observatoire (données ouvertes) dans les seules pages publiées de l'Observatoire ; partout ailleurs, et pour tout autre corpus, il refuse toujours une suite de six mots (vérifié en plaçant un extrait réel dans `docs/`).

## 2026-10-17 — Observatoire, école : passe 12 (balayage par définition), non publiée

- **Demande d'Arnaud** : jouer le balayage par définition, après un bilan avant / après des passes 8 à 11.
- **Fait** : étape `sweep` de la méthode « consultation » (motifs promis au résumé confrontés à tous les avis rangés ailleurs ; le code filtre ce qui est permis). Premier essai écarté par un contrôle par script avant les synthèses, corrigé (motifs montrés d'abord, camp le moins nombreux cherché en premier, propositions intouchables).
- **Résultat** : 3/5 plafonné aux deux lectures (moyennes 3,33), langue 3,5. Les quatre défauts des passes 8 à 11 sont levés ; le plafond vient de copies du balayage qui changent à tort trois étiquettes. Détail : `docs/METHODES.md`, « Passe 12 ».
- **Décision** : non publiée. Proposition à Arnaud : relire les seules copies qui changent une étiquette du résumé (passe 13, environ 5 millions de jetons).

## 2026-10-17 — Observatoire, école : passes 10 et 11 (codage en double), un bug de fusion corrigé, non publiée

- **Demande d'Arnaud** : jouer la passe 10 avec le codage en double.
- **Passe 10** : 3/5 plafonné (3,08 et 3,0), langue 4. Invalidée par un bug de code : les fusions de la réconciliation s'appliquaient après renumérotation des motifs, donc aux mauvais motifs (le handicap fondu dans les démarches d'inscription). Trouvé par les deux lectures `methodologue`, confirmé sur les fichiers de la passe.
- **Corrigé dans le code** : fusions résolues par titre ; copie ramenée chez son original retirée ; copie redondante (personne déjà comptée dans ce camp) non faite ; définitions des motifs cibles fournies aux relectures avec l'option ; textes injectés du rapport alignés (« personnes », fusions annoncées une fois, comptes en chiffres au milieu des phrases). Tests de bout en bout pour chacun.
- **Passe 11** (rejeu) : 3/5 plafonné (3,5 et 3,17), langue 3,5. Handicap, administration et fusions corrigés ; le plafond tient aux éloges de l'école publique restés dans « Expérience globale » et aux plaintes d'éloignement hors de « Proximité », deux frontières qu'aucune paire relue ne couvrait. Détail : `docs/METHODES.md`, « Passes 10 et 11 ».
- **Décision** : cycle de trois passes clos, étude non publiée. Le codage en double reste une option (il répare ce qu'il voit, 24 à 26 copies justes sur 30). Le levier suivant, le balayage par définition des motifs du Résumé, est une décision de méthode et de coût : soumis à Arnaud.

## 2026-10-16 — Observatoire, école : passes 8 et 9 (dédoublonnage, livre de codes, réconciliation), non publiée

- **Demande d'Arnaud** : relire tout l'historique, trouver ce qui reste à optimiser « au plus intelligent » (meilleure qualité, code le plus efficace), trois itérations au plus, en puisant dans d'autres disciplines.
- **Diagnostic mesuré** : le dédoublonnage du découpage retirait 24 des 188 éloges rendus par le moteur (contenus dans une critique plus longue sur un autre objet), tous sur les motifs du résumé. Corrigé pour la méthode « consultation » (`keepOpposedOverlaps`).
- **Livre de codes** (analyse qualitative : définition et critères d'inclusion par code) : le moteur définit chaque motif avant de juger ses idées ; la définition suit le motif jusqu'au rapport. **Réconciliation** : le livre de codes relu d'un bloc, fusions et règles de partage, paires relues ensemble. **Séparations** étendues aux titres « X face à Y » et aux motifs partagés. Détail et chiffres : `docs/METHODES.md`, « Passes 8 et 9 ».
- **Résultat** : 3/5 plafonné aux deux passes (moyennes 3,25 ; 3,25 ; 3,42 ; 3,17), langue 3,5. Chaque défaut visé corrigé, le plafond déplacé sur d'autres motifs voisins. Arrêt après deux itérations, règle des trois passes.
- **Tranché par Arnaud le soir même** : codage en double en option du chercheur, désactivée par défaut (une idée copiée dans un second motif quand deux définitions la réclament ; deux motifs au plus ; des personnes comptées une fois par motif) ; pas de seuil d'entrée au résumé ; les apports des passes 8 et 9 sont gardés, la règle des trois passes protégeant les jetons et non le résultat. L'option est codée (`multiCoding`, réglages avancés, relecture et réconciliation, rapport), non encore jouée sur l'école.
- **Apports hors notation, recommandés par le `methodologue`** : réponses identiques entre personnes signalées dans la Méthode (campagnes de copier-coller) ; dans la fiche de l'Observatoire, la chance qu'un avis partagé par 1 % des contributeurs figure dans l'échantillon (98 % pour 378). La saturation thématique a été écartée (trompeuse sur un tirage au sort).

## 2026-10-15 — Observatoire, première étude (école) : passes 3 à 7, non publiée (palier)

- **Demande d'Arnaud** : finir la passe 3, publier à 3,5/5 au moins ; puis (même nuit) « aller au bout » de la méthode et du processus sans dégrader les autres modèles ni les autres études, et publier une fois le rapport à son meilleur. Les passes 4 à 7 dépassent donc la limite de trois passes, à sa demande.
- **Résultat** : méthode 3/5 à chaque passe (plafond), moyennes 3,25 à 3,67 ; langue 3,5/5 stable. Le seuil n'est pas atteint, rien n'est publié. Détail et causes : `docs/METHODES.md`, section Observatoire.
- **Ne pas dégrader les autres** : tout ce qui change une consigne passe par la méthode « consultation » ; la référence et les autres méthodes sont inchangées. Les seules corrections communes sont des filets (nombres composés lus en entier, compte réécrit accepté pour son premier renvoi, changements cumulés sur une même idée) et des phrases d'affichage (« fragile » seul, contre-courant dit par son camp) ; les caches ÉcoSol n'étant pas dans cette session, ces dernières sont à rejouer sur eux avant la prochaine certification.
- **Outil de publication** : `scripts/observatoire/publier.ts` publie la fiche et le rapport (prénoms masqués) dans `public/observatoire/`, et la liste des études ; le fichier d'étude brut n'est jamais publié.
- **Prochain levier, non joué** : le découpage, gardé du cache depuis la passe 1, absorbe des éloges dans la critique qui les suit quand elle porte sur un autre objet. Le `methodologue` en a trouvé une cause dans le code : le dédoublonnage du découpage retire l'éloge contenu dans une critique citée en entier. Une passe 8 a été préparée (commit ecf1903 : éloge et critique toujours séparés, jugement partiel gardé comme tel, regret d'une règle nommé, dédoublonnage qui garde deux avis opposés, lots de 10 personnes), puis retirée (0da320b) sans avoir été jouée : Arnaud a arrêté les passes. À rejouer en premier lors de la prochaine étude.

## 2026-10-13 — Retours d'Arnaud sur le rapport ÉcoSol : questions, échelle d'avis, restitution brute, sources multiples

- **Cinq catégories d'idées** (remplace les quatre du 11/10) : positif, négatif, suggestion, **question**, constat. Les questionnements du groupe ouvrent des pistes au-delà des solutions proposées ; une question rhétorique qui juge garde sa polarité. « Constat » est gardé : indispensable en entretien (faits d'usage). Section calculée « Questions soulevées ».
- **Échelle d'avis v2**, validée par le `methodologue` sur la demande d'Arnaud (les mitigés restent comptés, mais 8 négatifs contre 2 positifs n'est pas « partagé ») : consensus ≥ 80 %, majoritairement > 50 %, plutôt en dessous ; avis partagés seulement si les deux camps comptent au moins deux personnes et que le plus petit vaut au moins la moitié du plus grand ; avis mitigés dès que les mitigés égalent le camp le plus fort ; peu d'avis sous 4. Les chiffres sont toujours affichés à côté de l'étiquette. Les rapports anciens sont recalculés à l'affichage.
- **Une personne, une ligne.** Arnaud a cru à un comptage faux (15 lignes pour 7 personnes). Le comptage était juste, l'affichage trompait : chaque personne a désormais une ligne, ses verbatims à la suite avec leur origine ; « s'exprime aussi dans l'autre sens » est signalé sans juger. En-têtes « Avis positifs — 14 participants (dont 2 mitigés) ».
- **Restitution brute** (décision d'Arnaud) : verbatims recopiés tels quels, prénoms compris, nuances gardées (« je pense que… ») ; une coupure « […] » peut sauter un passage sans rapport (une seule, fragments d'au moins 4 mots, jamais une négation retirée) ; un clic montre le texte d'origine. Le masquage des prénoms reste un interrupteur manuel ; la méthode le rappelle.
- **Une condition reste dans son idée** (« je reviendrai, mais seulement si les horaires changent ») et se catégorise selon la situation actuelle, jamais positive par défaut. Deux idées d'une même personne qui se recouvrent sont fusionnées ; une même citation pour deux objets d'une énumération est gardée deux fois.
- **Motif dont le titre relie deux objets** : une question ciblée au modèle (« un ou deux ? »), le code applique la séparation si elle tient. Un simple filtre sur « et » aurait cassé « Ambiance et entraide ».
- **Sources multiples** : une étude mêle questionnaire et entretiens ; sources renommables et retirables, plusieurs fichiers déposés ensemble ; « Entretien N » par défaut (le nom de fichier contient souvent un prénom) ; le choix des questions ne porte que sur les questionnaires (décocher une question écartait à tort les entretiens).
- **Contrôles ajoutés** : dans un thème ou le résumé, « trois personnes » doit citer des idées de trois personnes, sinon la phrase est retirée ; une personne qui porte plus de la moitié des idées d'un motif est signalée.
- **Gardés pour plus tard** (le `methodologue`) : juger le ton par rapport à l'objet du motif ; signaler des pistes opposées sous un même constat ; analyse par rôle.

## 2026-10-13 — Rapport à la hauteur d'une restitution (corpus réel ÉcoSol, privé)

- **Banc d'essai : la v1 sur le même corpus.** Son rapport, jugé « exceptionnel » par Arnaud, sert de référence. Trois passes, chacune jugée par le `methodologue` et la `plume`, avec un vrai modèle joué via le pont. Résultat : 2,5/5 pour la v1, 4/5 pour la version finale (méthode), 3,5 contre 4 pour la langue. Détail privé : `fixtures/private/ecosol/COMPARAISON.md`.
- **Le motif redevient un objet sur lequel agir.** « Un motif = un objet précis » émiettait (75 motifs, 16 portés par une personne) et fabriquait de faux isolements, de faux désaccords et de faux consensus. Une cause, le problème et la solution vont ensemble ; le regroupement reçoit un verbatim d'exemple et la question, pas seulement le libellé.
- **Cible de motifs ≈ min(1,5 × √idées ; 1,2 × participants)**, validée par le `methodologue` : la racine seule grossit avec la prolixité de quelques personnes. Ce n'est qu'une indication ; une **porte de qualité calculée** (plus de 15 % de motifs à une personne, ou médiane sous 4 personnes) déclenche une consolidation où l'IA propose des fusions et le code les applique.
- **Pas de motif défini par son ton** (« Bilan positif ») : il ne pouvait donner que 100 %. Ses idées sont rangées à nouveau par objet ; une fusion sous un titre de jugement est refusée.
- **Les listes « Ce qui a marché / bloque / divise / proposent » sont calculées par le code**, au même dénominateur que l'indicateur de consensus (avis exprimés, mitigés dans aucun camp), et ne se coupent jamais en silence. Le résumé exécutif part de ces listes, cite la preuve fournie pour chaque ligne, et raconte en trois temps.
- **On n'additionne plus les avis d'un thème**, même à l'affichage : un thème réunit des objets différents.
- **Prénoms des particuliers masqués** à l'affichage et dans les exports (citations exactes intactes dans l'étude). Le modèle signale, le code vérifie dans le texte. La détection n'est pas constante d'une passe à l'autre : une validation humaine de la liste reste à construire.
- **Une phrase au nombre introuvable n'est plus livrée** : elle est retirée, et la méthode le dit. Nouveau contrôle : « deux personnes » qui recouvrent deux idées d'une même personne.
- **La normalisation des libellés de la v1 n'est pas réintroduite** : regroupement sur le sens et consolidation ont suffi (0 motif à une personne sur le corpus réel). À rouvrir si un autre corpus émiette encore.
- **À trancher par Arnaud** : mitigés au dénominateur du consensus ; masquage des personnalités publiques ; condition qui interdirait un découpage ; motif à deux objets.

## 2026-10-12 — Retour d'Arnaud (test pensé à voix haute) : accueil, moteurs, méthode

- **Accueil = page produit, puis reprise du travail.** Sans compte, c'est le navigateur qui « se souvient » : s'il contient des études, un bandeau « Reprendre » passe en premier et le héros se réduit. Une seule page sert le visiteur et l'habitué ; pas de page de présentation séparée.
- **Accroche « Des verbatims au rapport, preuves à l'appui. »** (proposée par `conteur`) plutôt que « de A à Z » : elle dit une valeur vraie aujourd'hui. La boîte à outils montre honnêtement ce qui est disponible et ce qui arrive. La preuve est montrée (un constat de l'exemple dont on déplie les verbatims), pas affirmée.
- **Les modules sont des espaces.** « Synthèse » mène à ses études (`#/synthese`) ; l'exemple y est une carte à part, sans doublon de bouton. « Observation » devient « Entretiens et tests » (un entretien n'est pas une observation), icône vidéo.
- **Moteurs d'IA : le catalogue est visible d'emblée**, rangé par usage (essayer gratuitement, rien ne sort de l'ordinateur, autres), avec un guide pas à pas et des liens directs vers la page des clés. Ollama est détecté automatiquement (ouvert ? modèles installés ?). « Enregistrer et tester » d'un seul geste. Toute page qui quitte une étude offre le retour (`#/moteurs?retour=…`).
- **Méthode : un groupe = un motif.** Cause du regroupement grossier : la cible imposait 2 à 6 groupes pour 37 idées et les thèmes ne venaient qu'au-delà de 8 groupes. Nouvelle cible en racine carrée (le nombre de motifs croît moins vite que les idées), consignes réécrites avec le `methodologue` (ne pas fusionner deux sujets voisins, ne pas séparer un même motif : problème et solution, avis opposés sur un même objet), thèmes dès 5 groupes.
- **Pas de consensus ni de désaccord calculé sur un thème** : il réunit des objets différents, additionner leurs avis inventait de faux « avis partagés ». Un thème affiche ses participants, ses avis et le nombre de motifs dont les avis sont partagés. Le modèle reçoit les participants de chaque groupe pour ne pas compter deux fois une même personne.
- **Vocabulaire de la recherche utilisateur, un concept = un mot** (avec `plume`) : étude, participant, verbatim, idée, motif, thème, segment, occurrences ; moteur d'IA ; sauvegarder (fichier) / télécharger (rapport) / enregistrer (automatique).
- **Verbatims dépliés sur place** dans le rapport, plus de fenêtre qui casse la lecture.

## 2026-10-12 — Qualité de la langue (demande d'Arnaud)

- **La langue fait partie de la qualité, sans jamais passer avant la fidélité.** Un rapport juste mais qui sonne « traduit de l'anglais » n'est pas fini.
- **Trois niveaux** : (1) un guide de style par langue dans les consignes de rédaction ; (2) une étape « Relire la langue » (activée par défaut, désactivable) qui réécrit les synthèses ; (3) des garde-fous dans le code : une réécriture qui change une citation [I…] ou un nombre (en chiffres ou en lettres) est refusée, et tout nombre d'une synthèse qui ne correspond à aucun chiffre calculé ni cité est signalé « À vérifier » dans le rapport.
- **Corriger à la source.** La première relecture a montré que la plupart des défauts venaient de nos propres textes recopiés par le modèle (formulation des chiffres, ponctuation abîmée par le nettoyage des citations). Ils sont corrigés dans le code, pas confiés à la relecture.
- **Nouveau rôle `plume`** (langue et ton de l'interface et des rapports), intégré à la boucle de qualité.
- Langues : français et anglais pour l'instant ; ajouter une langue = ajouter son guide de style.

## 2026-10-12 — Démarrage

- **Branche vierge `next`** dans le dépôt existant, sans historique commun : la session ne peut pas créer de nouveau dépôt.
- **Licence AGPL-3.0 (ou ultérieure).** Libre d'usage, de modification et de redistribution ; mais toute personne qui propose une version modifiée en service en ligne doit publier ses modifications. Cela empêche qu'un tiers referme le projet dans une offre commerciale fermée, tout en laissant possible une offre hébergée officielle. Contributions externes sous DCO (certificat d'origine) pour garder la possibilité d'une double licence.
- **Vite + React** plutôt que Next.js : l'application est statique (aucun serveur), Vite est plus simple et plus rapide pour ce cas.
- **Le module Synthèse d'abord**, avant l'Observation : c'est l'essentiel de la valeur, le moteur existe et a fait ses preuves, et c'est du texte seulement.
- **Regroupement par le modèle sur des libellés courts, validé par le code**, plutôt que par vecteurs (embeddings) : pas de dépendance supplémentaire, reproductible, et les libellés courts tiennent largement dans le contexte des modèles actuels. Au-delà de 350 libellés distincts, regroupement par lots. Les vecteurs restent une option future.
- **Quatre catégories** : positif, négatif, neutre, suggestion. La suggestion n'est pas une polarité.
- **Synthèses par lots de groupes** (au plus ~90 idées par demande) pour limiter le nombre d'appels, crucial avec des offres gratuites à 2 requêtes par minute.
- **Pas de nom de participant envoyé au modèle** : seuls les pseudonymes (P1, P2…) partent, avec le texte.
- **Moteur de simulation** intégré (hors ligne, déterministe) pour tester et découvrir l'outil sans clé ; il peut aussi simuler les défauts d'un vrai modèle.

## 2026-10-13 — Rapport plus lisible : couleurs, participants cités, réponses courtes avec leur question

- **Retour d'Arnaud** : le rapport Markdown « en noir et blanc » se lit mal ; les traits de couleur par avis structuraient la lecture.
  Markdown : repères de couleur par ligne (🟢 🔴 💡 ❓ ⚪), une case par participant sous chaque motif (🟩 🟨 🟥), synthèses en citation.
  HTML : barre d'avis, sections calculées colorées, synthèses sur fond clair. Écran : barre d'avis sur chaque motif replié, sections
  calculées avec pictogramme et couleur, cartes en colonnes (plus de trous), une colonne fixe pour le code du participant.
- **Les références [I0008] désignent des idées, pas des personnes** : utiles à l'écran (un clic montre les verbatims), illisibles sur
  papier. Les exports les remplacent par « (cf. P2, P14) », reliés en HTML au verbatim (survol : la citation). La Méthode l'explique.
- **Le contexte donne le sens d'une réponse courte** : « Visibilité » est négatif sous « qu'est-ce qui a moins bien marché ? », positif
  sous « qu'est-ce qui a bien marché ? ». Le rapport ÉcoSol le faisait déjà ; la consigne le dit désormais explicitement (PROMPT_VERSION 5),
  vérifié avec un modèle léger sur un cas fabriqué (même mot sous trois questions : négatif, positif, question ; un jugement explicite
  l'emporte sur la question). Une réponse de six mots ou moins est affichée avec sa question, à l'écran comme dans les exports.
- Dans un motif jugé négatif, les exports montrent les critiques d'abord, comme l'écran.

## 2026-10-13 — Ton juste et contexte : ironie, ton par motif, pluriels, survol (itération 8)

- **Arnaud** : l'objectif est de comprendre ce que la personne a voulu dire. La question posée, le fil d'un entretien, l'ironie ou un conditionnel peuvent inverser les mots. La consigne d'extraction le dit, sans alourdir : dans le doute, le sens littéral.
- **Ton jugé par rapport au motif** : étape dédiée pour les personnes mitigées d'un motif ; le moteur propose une catégorie relative à l'objet du motif, le code n'accepte que les idées soumises et garde la trace (`retoned`, annoncé dans la Méthode). Sur ÉcoSol, 17 mitigés (B5) → 10 (B6), surtout grâce à la nouvelle extraction ; l'étape seule reste timide (1 idée). Prochain pas, proposé par le `methodologue` : lui permettre de déplacer une idée vers un autre motif plutôt que de la neutraliser.
- **Pluriels vérifiés** : « certains », « d'autres », « plusieurs », « la plupart » en sujet doivent citer assez de personnes. Première version trop large (9 phrases retirées) : limitée aux sujets, et dans le résumé la référence d'une ligne de liste vaut pour son motif. Retirer une phrase ne fond plus les paragraphes.
- **« cf. » ou « par ex. »** : un renvoi engage le rapport comme un chiffre (`plume`). « 12 des 13 personnes… (par ex. P2) » dit que P2 est un exemple ; numéros triés.
- **Question après une réponse courte** : seulement si le verbatim est presque toute la réponse et qu'il s'agit d'un avis ou d'une question ; en entier une fois par motif. Sinon un fragment (« pas assez de caisses ouvertes » sous « qu'est-ce qui a bien marché ? ») se lisait à l'envers.
- **Barres d'avis rapportées à tous les participants du motif** (part grise « sans avis ») : trois critiques parmi neuf personnes qui proposent ne font plus un motif tout rouge.
- **Contexte au survol** (demande d'Arnaud) : bulle avec participant, catégorie, source, question et passage surligné ; clic pour une carte qui reste ouverte ; Échap la ferme.
- **Certification B6** (commit 619d645) : `methodologue` 4/5 certifié, `plume` 4/5, `testeur` livrable. Pour 5/5 : vérifier que chaque renvoi appuie vraiment sa phrase (les « cf. » rendent visibles des appuis faux qui étaient cachés derrière les [I…]).

## 2026-10-13 — Vers 5/5 : chaque défaut corrigé par une étape (itérations B7 à B9)

- **Principe (Arnaud)** : un défaut identifié se corrige par une étape, une consigne ou un contrôle du processus, reproductible, jamais à la main dans le rapport.
- **Relecture des motifs** (nouvelle étape) : le moteur déplace une idée hors de l'objet de son motif (motif existant ou nouveau) et corrige un ton jugé à tort ; les « mitigés » d'abord, avec la phrase d'avant pour contexte ; le code applique et garde la trace. Un mitigé n'est plus « bien sur X, mal sur Y » mais un vrai avis partagé sur le même objet (17 → 8 sur ÉcoSol).
- **Pistes opposées** : une critique partagée dont les remèdes s'opposent apparaît dans « Ce qui divise », avec les deux propositions et leur auteur ; le moteur signale, le code vérifie (deux propositions, deux personnes).
- **Vérification des renvois** (nouvelle étape) : chaque phrase est confrontée aux verbatims cités ; les contrôles du code (comptes, pluriels, « une autre », phrases sans renvoi, camps d'avis absents, sujets qui divisent oubliés) font récrire ou compléter au lieu de retirer ; le code n'accepte que des renvois permis et des comptes égaux aux personnes citées ; filets finaux écrits par le code.
- **Confidentialité** : les exemples des consignes et des tests sont des cas fictifs d'un autre domaine ; `privacy.test.ts` refuse toute suite de six mots d'une réponse privée.
- **Audit automatique** (`scripts/audit.ts`) : première passe de certification par le code ; B7 25 défauts, B8 0 (puis 3 avec les nouveaux contrôles), B9 0.
- **Écran** : contexte au survol (passage en gras, sans surlignage), barre d'actions unique (segment, prénoms, menu « Exporter » avec la sauvegarde de l'étude).

## 2026-10-13 — B10, navigation par modules, catalogue des moteurs

- **B10** : `methodologue` 4,5/5. Les défauts restants sont surtout de lecture (un mot sans sens compté comme avis, un ton perdu au découpage, un motif fourre-tout) ; la règle « cf. / par ex. » est désormais tenue aussi derrière « toutes les personnes » (base : le motif entier).
- **Vocabulaire (Arnaud)** : « vos synthèses » tant que les modules sont séparés ; « étude » viendra quand ils se combineront.
- **Navigation (Arnaud)** : les modules à gauche (Accueil, Synthèse, puis Entretiens, Personas, Ateliers grisés « pas encore disponible ») ; les moteurs d'IA, communs à tous, à droite.
- **Moteurs (Arnaud : exhaustivité, direct ou multi-fournisseurs)** : 18 fournisseurs vérifiés le 13/10 (adresse, appel depuis le navigateur testé, offre, données) ; rangés par type, la différence expliquée au survol. Écartés : Z.ai international (appel navigateur refusé), Cerebras (erreurs illisibles, carte exigée).

## 2026-10-13 — Parcours Mistral réel

- **Constat** : dans le compte d'Arnaud, Mistral Studio désactive les clés sur le plan Free (« Passez à un plan supérieur pour activer vos clés API ») ; un forfait de 8,5 €/mois reste inclus, mais ne sert qu'après activation de « API Pay-As-You-Go ». L'offre « Experiment » sans carte a disparu ; la documentation officielle est en retard.
- **Décision** : Mistral sort de « Pour essayer gratuitement » ; le guide pointe l'abonnement, la limite de dépenses et le réglage de confidentialité. Groq reste la seule entrée gratuite sans carte annoncée.
- **Méthode** : l'agent de test ne clique jamais sur « Mettre à niveau » ni « Activer » (transaction) ; il lit les pages d'abonnement. Détail et leçons : `docs/PARCOURS-FOURNISSEURS.md`.

## 2026-10-13 — Échelle d'avis v4 (décision d'Arnaud, sur proposition du `methodologue`)

- **Le chiffre d'abord, avec sa base** : « (8 sur 9 qui donnent un avis) ». Les paliers de 10 % ont été écartés : sur 5 personnes, une voix vaut 20 points, la précision serait fausse.
- **Des mots qui décrivent la répartition** : unanime, large majorité (80 % ou plus), majorité (plus de la moitié), pas de majorité, avis partagés, peu d'avis. « Consensus » abandonné : il laissait croire que tous avaient été interrogés.
- **« Avis mitigés » fondu dans « avis partagés »** (Arnaud : la nuance se lit dans les chiffres « dont N mitigés »).
- **« Fragile »** calculé par le code : une seule voix qui change de camp changerait l'étiquette. Remplace honnêtement un intervalle de confiance, qui supposerait un tirage aléatoire.
- Méthode : « se taire n'est ni approuver ni désapprouver » ; les proportions décrivent les personnes interrogées, pas une population.

## 2026-10-13 — Ministral 14B sur ÉcoSol ; une méthode par famille de modèles

- **Clé gratuite** : elle existe (Admin › Clés API), mais seuls les modèles Ministral et Codestral répondent ; Small et Medium ont un quota nul sans paiement à l'usage. Le défaut d'OpenScribe (`mistral-small-2506`) n'existait plus : d'où l'erreur 429 vue par Arnaud.
- **Liste des modèles** (demande d'Arnaud) : même menu que les autres listes, sections « offre gratuite » / « paiement à l'usage », recommandé marqué, saisie libre.
- **Trois passes** sur ÉcoSol : 2 → 2,5 → 3 (`methodologue`), 2,5 → 3 (`plume`). Le regroupement en un lot de 350 faisait trois fourre-tout ; des lots de 80 morcelaient (53 motifs) ; 150/75 donne 33 motifs. La prose plafonne.
- **Décision d'Arnaud : une méthode par famille de modèles.** On part de la meilleure, on l'affine sur le corpus réel, on essaie ses apports sur les autres et on ne les garde que si la note monte. La référence (Sonnet) n'a pas bougé : test qui vérifie sa consigne mot pour mot. Processus : `docs/METHODES.md`.
- **Ce que signalait Arnaud (JSON tronqué par un petit modèle)** : pas la cause ici (JSON complet mais mal rangé), mais le risque existe ; une réponse coupée est désormais détectée et nommée.

## 2026-10-13 — Gemini sur ÉcoSol ; le processus « une méthode par modèle » appliqué

- **Clé** : créée dans AI Studio par l'agent (accord d'Arnaud), dans le projet au « Niveau sans frais » ; un autre projet du compte est facturé. Arnaud a collé la clé (l'agent ne colle jamais une vraie clé).
- **Modèle** : 3.8 Flash est limité à 20 demandes par jour en gratuit, une synthèse n'y tient pas : Flash-Lite 3.5 (500 par jour). Le test de connexion réservait 20 jetons, mangés par la réflexion du modèle (« n'a rien renvoyé ») : porté à 1 024. Gemini refuse `seed`.
- **Méthode `gemini`** (copie de la référence), quatre passes : 2,5 → 3 → (61 motifs) → 3,5 (`methodologue`). Leviers qui ont marché : rattachement des motifs isolés un par un, « range d'abord ». Qui ont échoué : « ne range que si le titre décrit l'idée » (morcelle).
- **Essai croisé** : les règles de rédaction de Gemini font baisser Ministral (3 → 2) : rejeté, comme le prévoit le processus d'Arnaud.
- **Stratégie d'Arnaud** : pousser d'abord le gratuit (horizontal) ; un modèle plus fort plus tard, et alors pour toute la synthèse, pas étape par étape (trop complexe à expliquer).
- **Quatrième passe** au-delà de la règle des trois : demandée par Arnaud (« itérer au maximum »), justifiée parce qu'elle combinait deux résultats déjà mesurés.

## 2026-10-13 — Groq abandonné pour les synthèses

- **Parcours** : compte créé par Arnaud (l'agent n'en crée pas), clé créée par l'agent, collée par Arnaud. Offre gratuite : 8 000 jetons par minute et 200 000 par jour par modèle.
- **Mesure** : gpt-oss-120b a fait la moitié d'ÉcoSol en 25 minutes et 150 000 jetons ; Qwen s'est arrêté sur des 429 répétés. Une synthèse entière demanderait environ une heure et dépasserait le quota du jour.
- **Décision d'Arnaud** : on ne peut pas attendre une heure pour une analyse qui en prend dix ailleurs : Groq abandonné. Il reste proposé pour de petites synthèses, hors des offres recommandées.
- **Gardé** : messages 413 (demande trop longue pour l'offre) et 429 « quota du jour » (reprendre demain), réponse réservée selon la place restante sous un plafond par demande, longueur de réponse imposée aux fournisseurs qui coupent trop court.
- **Bug trouvé en route** : le bouton de la liste des modèles envoyait le formulaire (un `type="button"` manquant) ; le test de parcours le vérifie désormais.

## 2026-10-14 — Un moteur par tâche, mode Confidentiel

- **Demande d'Arnaud** : renseigner tous les moteurs en un endroit, puis choisir dans chaque module celui qu'on applique ; choisir ce qui se fait en local (transcription, conversion vidéo → audio avec FFmpeg).
- **Proposition du `ux-designer`, retenue** : raisonner par tâche (une même tâche sert plusieurs modules), défaut sur la page Moteurs d'IA, dérogation dans le travail ; mode Confidentiel ; la conversion des médias comme garantie (toujours dans le navigateur), pas comme moteur.
- **Premier pas livré** : « Moteur d'IA par tâche » (ligne « Analyser et rédiger », « Transcrire » annoncée), pastille « Sur votre ordinateur » / « En ligne » (seule une adresse locale compte), mode Confidentiel par défaut et par synthèse, appliqué par le code au lancement.
- **Recherche des offres gratuites** : voir `docs/PARCOURS-FOURNISSEURS.md` (14/10).

## 2026-10-14 — Modèles locaux : essayés, puis retirés des choix

- **Essai** : Ollama installé sur le Mac d'Arnaud (M5, 24 Go). gpt-oss 20B : quatre passes, aucune synthèse complète (réflexion qui boucle au-delà de 16 000 jetons, jusqu'à 27 minutes par demande). Gemma 4 12B : trois passes de 40 minutes, meilleure note 3/5 (méthode), puis 151 motifs à la passe 3.
- **Seuil fixé par Arnaud** : un moteur n'est proposé qu'à 3,5/5 au moins sur ÉcoSol (le niveau de l'offre gratuite de Gemini), idéalement 4, et s'il n'est pas pénible à utiliser. Les entretiens alourdiront les données : un moteur limite aujourd'hui sera pire demain.
- **Décision** (laissée à l'orchestrateur par Arnaud) : Ollama et LM Studio ne sont plus proposés, l'accueil n'en parle plus, le mode Confidentiel ne s'affiche qu'à qui a déjà un moteur local. Le code reste en place derrière un seul réglage.
- **Gardé** : délai de 30 minutes par demande en local ; un regroupement dégénéré redemandé une fois ; une relecture qui boucle ignorée pour son lot ; écrire un export ou une note ne recharge plus la page pendant une analyse.

## 2026-10-14 (soir) — Moteurs validés ou à l'étude ; durée estimée par moteur

- **Demande d'Arnaud** : une qualité minimale est essentielle ; les moteurs dont on n'est pas sûr restent dans la liste, désactivés, avec la raison (« à l'étude »).
- **Fait** : statut par modèle (`validated` avec la note, ou `study` avec la raison) ; seuls Gemini 3.5 Flash-Lite (3,5/5) et Claude Sonnet (4,5/5) se configurent. Mistral passe à l'étude (3/5). L'accueil ne recommande plus que Gemini (gratuit) et Claude (payant).
- **Durée estimée** : vitesse mesurée à la fin de chaque synthèse (temps écoulé ÷ demandes envoyées, moyenne des dernières), sinon vitesse de référence mesurée sur ÉcoSol, sinon estimation grossière ; le débit autorisé reste un plancher. L'écran dit d'où vient la durée.

## 2026-10-14 (nuit) — Opus 5.5, découpage par lots, grand prompt ; évaluateurs sur Opus

- **Demande d'Arnaud** : essayer Opus 5.5 (réflexion moyenne) avec la méthode de Sonnet ; tester si envoyer plus de données par demande change la qualité ; écrire la méthode en une seule consigne (utilisable hors d'OpenScribe, et comme point de comparaison) ; évaluer avec Opus.
- **Évaluateurs** : `methodologue` et `plume` fixés sur Opus ; grille explicite (`docs/NOTATION.md`) ; trois lectures de Sonnet B10 concordantes (3/5), la réflexion élevée n'apporte rien. Nouvelle échelle plus sévère : Gemini 2,5, Sonnet 3.
- **Résultats** : Opus avec la référence 3 et 3,5 (langue 3,5) ; Opus avec découpage par lots de 10 personnes 3 et 3 (deux fois moins de demandes) ; Opus avec le grand prompt 3,5 et 3,5 (langue 4). Les défauts qui plafonnent la référence (regroupement qui disperse un même objet, fourre-tout d'éloges) viennent de la méthode, pas du modèle.
- **Décisions** : Opus validé ; seuil ramené à la nouvelle échelle (le niveau de Gemini) ; badge « Qualité vérifiée » sans chiffre ; renvois « (P2, P14) » et « (notamment P2) » ; opposition au format `ids` lue. Prochaine expérience : un regroupement qui voit plus de contexte, sur la référence.

## 2026-10-20 — Chevrons uniformes ; une seule légende pliée par thème

- **Chevrons** (demande d'Arnaud, règle `designer-ui`) : un seul indicateur d'ouverture, le composant `Chevron`
  (primitives). C'est un chevron vers le bas, placé après le libellé, qui tourne de 180° en 200 ms. Il remplace les
  « › », « ⌃ », les chevrons à droite ou à gauche et le triangle natif des « Réglages avancés ». Les commandes de
  repli gardent le mot « Replier » devant le chevron.
- **Une seule légende** (Arnaud) : « Que veut dire cette étiquette ? », l'encadré « Pourquoi cette étiquette ? » et
  « Ce qui compte comme positif ou négatif » sont réunis dans un seul volet plié, « Comment lire ces indicateurs ». La ligne de chiffres (participants, avis, échelle) y entre aussi (Arnaud) : la barre, l'étiquette et le compte de personnes restent dans la ligne du thème.
  Pourquoi : la synthèse et les verbatims, qui portent le contenu, remontent. Fragile et à vérifier restent aussi
  expliqués depuis leur marque dans la ligne du thème.
