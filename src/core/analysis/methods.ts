import type { AnalysisSettings } from './types'

/** Groupe des idées qui ne répondent pas à la question (méthodes qui le prévoient). */
export const OFF_TOPIC = 'Hors question'

/**
 * Une méthode par famille de modèles (décision d'Arnaud, 13/10/2026) : la méthode
 * de référence, certifiée avec Sonnet sur ÉcoSol, ne change pas quand on affine
 * celle d'un autre modèle. Chaque nouvelle méthode part d'une copie de la
 * référence et ne s'en écarte que là où le corpus réel l'a montré nécessaire.
 * Quand deux méthodes convergent, on les fusionnera.
 *
 * Les filets du code (citations inventées retirées, renvois réparés, réponses
 * mal formées tolérées) restent communs : ils ne touchent qu'une réponse
 * défectueuse, et ont été rodés sans effet sur la référence.
 */
export type MethodId = 'reference' | 'ministral' | 'gemini' | 'groq' | 'gptoss' | 'gemma' | 'qwen' | 'lots' | 'contexte' | 'contexte2' | 'consultation'

export interface Method {
  id: MethodId
  /** Nom montré dans la Méthode du rapport. */
  label: string
  /** Taille des lots envoyés au modèle. */
  /** `extract` : personnes découpées par demande (1 par défaut). */
  batches: { grouping: number; assign: number; review: number; summary: number; support: number; polish: number; extract?: number }
  /** Exemple de la règle 3 du regroupement (une cause, le problème et la solution vont ensemble). */
  groupingExample: string
  /** Citation dont le modèle a corrigé quelques fautes de frappe : rattachée au texte d'origine. */
  typoTolerantQuotes: boolean
  /** Après la consolidation, chaque motif porté par une seule personne est proposé au rattachement à un motif existant (ou à aucun). */
  attachSingles: boolean
  /** Règles ajoutées à la fin des règles d'une consigne, pour cette méthode seulement (la référence n'en a aucune). */
  extraRules: Partial<Record<'extract' | 'grouping' | 'assign' | 'review' | 'summary' | 'themes' | 'global' | 'polish' | 'unanimity' | 'support' | 'sweep', string>>
  /** Au regroupement, chaque libellé arrive avec plusieurs verbatims et leur ton (la référence : un seul exemple). */
  groupingContext?: boolean
  /** Après la relecture, chaque motif unanime ou à large majorité est confronté aux idées de ton contraire rangées ailleurs. */
  unanimityReview?: boolean
  /** Le résumé reçoit le verbatim de chaque proposition et de chaque question (la référence : le titre du motif et un compte). */
  globalContext?: boolean
  /** Les idées sans rapport avec la question vont dans « Hors question » : gardées et listées, jamais comptées dans un motif ni résumées. */
  offTopic?: boolean
  /** Les lignes du résumé portent le mot de l'échelle d'avis à côté du chiffre (« unanime : les 24 participants qui donnent un avis »). */
  scaleInLines?: boolean
  /** Après la relecture, les motifs qui ont reçu une idée sont relus une seconde fois, avec la liste à jour des motifs. */
  arrivalReview?: boolean
  /** La phrase du code sur ce qui divise : une seule phrase, la base au premier sujet, l'objet des propositions contraires nommé. */
  compactDivided?: boolean
  /** Lignes de "strengths" et de "blockers" données au résumé (6 par défaut). */
  summaryLines?: number
  /** Résumé : équilibre des critiques et des satisfactions dans "facts", exemple pris dans la synthèse du motif, lignes oubliées et « fragile » signalés à la vérification des renvois. */
  summaryChecks?: boolean
  /** Vérification des renvois : un camp d'avis (4 personnes au moins) dont la synthèse cite moins de cette part des personnes est signalé ; le moteur complète. */
  campCoverage?: number
  /** Au découpage, un éloge et une critique qui se recouvrent sont gardés tous les deux (la référence garde la plus longue). */
  keepOpposedOverlaps?: boolean
  /** Livre de codes : à la relecture, le moteur définit chaque motif (favorable, défavorable, hors camp) avant de juger ses idées ; la définition suit le motif jusqu'au rapport. */
  codebook?: boolean
  /** Après la relecture, le livre de codes est relu d'un bloc : motifs d'un même objet fusionnés, motifs voisins relus ensemble avec une règle de partage. */
  reconcile?: boolean
  /** La question « un ou deux objets ? » est posée aussi pour un titre « X face à Y » et pour un motif aux avis partagés d'au moins 8 personnes. */
  splitChecks?: boolean
  /** Balayage par définition : chaque motif promis au résumé est confronté, avec sa définition, à tous les avis du corpus (livre de codes requis). */
  sweep?: boolean
}

const REFERENCE: Method = {
  id: 'reference',
  label: 'méthode de référence',
  batches: { grouping: 350, assign: 200, review: 140, summary: 90, support: 220, polish: 12 },
  groupingExample: '« Démarrage tardif », « Communication de dernière minute », « Commencer un an avant » relèvent tous du calendrier',
  typoTolerantQuotes: false,
  attachSingles: false,
  extraRules: {},
}

const CONTEXT_GROUPING =
  "6. Lis les verbatims et leur ton, pas seulement les libellés : deux libellés différents qui parlent du même objet vont dans le même groupe, quel que soit leur ton (« Personnel accueillant » et « Vendeurs introuvables » → « Accueil en magasin »). Un groupe où tout est positif ou tout est négatif est suspect : vérifie qu'aucune idée de ton contraire sur le même objet n'est partie ailleurs.\n7. Une appréciation générale sans objet précis (« tout était parfait », « bravo à toute l'équipe ») va dans un groupe « Appréciation d'ensemble » ; n'y range jamais une idée qui nomme un objet.\n8. Un même reproche fait à plusieurs supports (« site mis à jour trop tard », « affiches posées trop tard ») va dans un seul groupe qui nomme ce reproche (« Retard de la communication »)."

const GEMINI_RULES: Method['extraRules'] = {
  grouping:
    "6. Le titre nomme l'objet en 2 à 5 mots, sans « et », sans « global », « général », « interne » ou « externe » de remplissage, sans prénom, sans mot qui juge (« Amélioration », « Problème »). Un mot que tu ne comprends pas n'est jamais un titre. Range d'abord chaque idée dans un groupe existant : n'ouvre un groupe que pour un objet vraiment nouveau.",
  summary:
    "9. Chaque phrase se comprend seule : elle nomme son sujet et ne commence jamais par un pronom ou un connecteur (« Elles », « L'une d'elles », « À l'inverse », « Enfin »). Le crochet cite au moins une idée de chaque personne comptée ; sinon, écris le nombre de personnes citées.",
  themes:
    "4. Chaque phrase se comprend seule : elle nomme son sujet et ne commence jamais par un pronom ou un connecteur (« Elles », « L'une d'elles », « À l'inverse », « Enfin »).",
}

export const METHODS: Record<MethodId, Method> = {
  reference: REFERENCE,
  // ÉcoSol, trois passes (methodologue 2/5 → 2,5 → voir docs/PARCOURS-FOURNISSEURS.md).
  ministral: {
    ...REFERENCE,
    id: 'ministral',
    label: 'méthode pour modèle léger (Ministral)',
    // Un modèle léger range mal une longue liste d'un coup ; trop petit, il morcelle (passe 2 : 53 motifs).
    batches: { grouping: 150, assign: 75, review: 60, summary: 40, support: 220, polish: 12 },
    // L'exemple de référence servait d'aimant à un modèle léger (un motif fourre-tout de 98 idées).
    groupingExample: "« Trop peu d'agents le samedi », « Longue file au guichet », « Ouvrir un second guichet » relèvent tous de l'attente au guichet",
    typoTolerantQuotes: true,
    // Essai du 13/10 rejeté : les règles de rédaction de Gemini font baisser Ministral (methodologue 3 → 2 ; plume 3 → 3).
  },
  // Copie exacte de la référence (décision d'Arnaud) : on ne s'en écarte que si ÉcoSol le montre nécessaire.
  gemini: {
    ...REFERENCE,
    id: 'gemini',
    label: 'méthode Gemini',
    // Passe 1 : 79 motifs dont 41 à une personne ; la consolidation libre sur 79 motifs n'en fusionnait qu'une paire.
    attachSingles: true,
    // Passe 1 (plume 2,5/5) : synthèses qui commencent par « Elles… », titres de remplissage ou de jugement.
    // « Range d'abord » (passe 2 : 36 motifs) plutôt que « ne range que si le titre décrit l'idée » (passe 3 : 61 motifs).
    extraRules: GEMINI_RULES,
  },
  // Copie exacte de la référence (processus d'Arnaud) : on ne s'en écarte que si ÉcoSol le montre nécessaire.
  groq: {
    ...REFERENCE,
    id: 'groq',
    label: 'méthode Groq',
    // Offre gratuite : une demande de plus de 8 000 jetons est refusée (413). Lots réduits pour rester sous ~6 000.
    batches: { grouping: 60, assign: 60, review: 30, summary: 20, support: 40, polish: 4 },
  },
  // Modèles ouverts sur l'ordinateur (Ollama, LM Studio) : copies de la référence, affinées sur ÉcoSol (14/10).
  gptoss: {
    ...REFERENCE,
    id: 'gptoss',
    label: 'méthode gpt-oss (sur votre ordinateur)',
    // Passe 1 (référence) : un seul lot de 268 idées → 264 dans un motif, puis une synthèse qui boucle.
    // Passe 2 : lots et exemple neutre de la méthode Ministral → toujours un seul groupe (réflexion courte).
    // Passe 4 : réflexion moyenne et lots plus petits ; 40 synthèses, ou 12 textes à relire, d'un coup dépassaient 16 384 jetons de réponse.
    batches: { grouping: 100, assign: 50, review: 60, summary: 10, support: 220, polish: 4 },
    groupingExample: "« Trop peu d'agents le samedi », « Longue file au guichet », « Ouvrir un second guichet » relèvent tous de l'attente au guichet",
  },
  // Essai du 14/10 (Opus 5.5) : la référence, mais 10 personnes par demande de découpage. Note égale (3 et 3 contre 3 et 3,5),
  // deux fois moins de demandes : utile pour un quota serré, pas un gain de qualité (docs/METHODES.md).
  lots: {
    ...REFERENCE,
    id: 'lots',
    label: 'méthode de référence, découpage par lots de personnes',
    batches: { ...REFERENCE.batches, extract: 10 },
  },
  // Candidate à remplacer la référence (14/10) : les défauts qui la plafonnent (unanimité fabriquée, fourre-tout d'éloges,
  // reproche dispersé) viennent du regroupement, qui ne voyait qu'un libellé et un exemple. Gardée seulement si la note monte
  // sur Opus et sur Sonnet (deux lectures chacun).
  contexte: {
    ...REFERENCE,
    id: 'contexte',
    label: 'méthode de référence, regroupement en contexte',
    groupingContext: true,
    unanimityReview: true,
    extraRules: {
      grouping: CONTEXT_GROUPING,
    },
  },
  // Chantiers du 14/10 sur la méthode « contexte » (défauts relevés par toutes les lectures) : ton au découpage,
  // propositions d'une seule personne au résumé, chiffres au lieu de « la plupart » dans les thèmes.
  contexte2: {
    ...REFERENCE,
    id: 'contexte2',
    label: 'méthode de référence, regroupement en contexte (v2)',
    groupingContext: true,
    unanimityReview: true,
    globalContext: true,
    extraRules: {
      extract:
        "9. Une critique formulée comme un manque (« pas assez de places », « il manque un horaire du soir ») est \"negative\", même si elle sous-entend une solution. Un avis suivi d'une idée pour la suite (« les ateliers sont très utiles, il faudrait en faire un par mois ») donne DEUX idées : l'avis (\"positive\" ou \"negative\") et la proposition (\"suggestion\"), chacune avec son extrait.",
      grouping: CONTEXT_GROUPING,
      themes:
        "4. Quand tu rapportes l'avis des personnes sur un groupe, écris le chiffre de ses \"facts\" (« 6 des 7 personnes qui en parlent ») plutôt que « la plupart » ou « toutes les personnes qui en parlent » : cette règle remplace ces formules de la règle 3. Un seul chiffre par phrase.",
      global:
        "7. Chaque ligne de \"proposals\" et de \"questions\" donne un \"example\" : rapporte ce qu'il dit, pas le titre du motif. Une ligne portée par une seule personne se dit « une personne propose » (ou « se demande ») ; ne réunis jamais dans une phrase des propositions de lignes différentes en les attribuant « aux participants ».",
    },
  },
  // Consultations publiques (Observatoire, 14/10) : une question, des centaines de réponses spontanées, dont certaines parlent
  // d'autre chose. Défauts relevés par le methodologue sur la première étude (école, Grand débat 2019, 3/5) : idées sans rapport
  // devenues des motifs, ton jugé hors de l'objet du motif (on critique un objet pour justifier le recours à un autre),
  // comptabilité visible dans les synthèses, format de « opposed » deviné. Le découpage reste celui de la référence (cache gardé).
  consultation: {
    ...REFERENCE,
    id: 'consultation',
    label: 'méthode de référence, adaptée aux consultations publiques',
    // Passe 8 (16/10) : le dédoublonnage retirait l'éloge contenu dans une critique plus longue (24 des 188 éloges de l'école).
    keepOpposedOverlaps: true,
    // Passe 8 : sept passes ont buté sur des idées limites (regret qu'une règle manque, demande de plus d'exigence, principe général)
    // jugées différemment d'un lecteur à l'autre. La définition écrite avant le jugement rend le camp vérifiable.
    codebook: true,
    // Passe 9 : les deux lectures de la passe 8 plafonnent sur des motifs voisins qui se partagent un objet (les éloges d'un
    // objet d'un côté, ses critiques dans un motif « X face à Y » de l'autre).
    reconcile: true,
    splitChecks: true,
    // Passe 12 : aux passes 8 à 11, le plafond tombe chaque fois sur une frontière que les paires relues ne couvraient pas
    // (éloges rangés dans un motif d'appréciation d'ensemble, plaintes restées hors du motif de leur objet). Le motif du
    // résumé cherche lui-même, dans tout le corpus, les avis que sa définition réclame : la posture du correcteur.
    sweep: true,
    // Passe 16 : en passe 15, privées de « une large majorité de ceux qui en parlent », les synthèses de G1 et G2 ne citaient
    // plus qu'une part de leur camp (18 sur 28, 19 sur 47 ; 69 personnes absentes). Seuil du methodologue, rodé sur le cache :
    // 4 camps signalés en 15, aucun en 14b.
    campCoverage: 0.8,
    offTopic: true,
    scaleInLines: true,
    // Passe 3 (15/10) : une idée déplacée vers un motif voisin faute de mieux (le bon motif était ouvert par un autre lot) y gardait son ton.
    arrivalReview: true,
    // Plume, passe 3 : « Ils le sont aussi sur… Ils le sont encore sur… » se lisait comme une liste mécanique.
    compactDivided: true,
    // Methodologue, passe 3 : propositions du résumé réduites à des rubriques ; un sujet unanime de 19 personnes absent du résumé.
    globalContext: true,
    summaryLines: 8,
    // Methodologue, passe 4 : deux freins et « fragile » oubliés au résumé ; exemple du résumé à contresens.
    summaryChecks: true,
    // Retirés le 15/10 (aucun effet mesuré en trois passes) : vérification des unanimités, relecture des tons des motifs du résumé.
    extraRules: {
      grouping: `6. Une idée qui ne répond pas à l'objet de l'étude (elle parle d'un tout autre sujet) va dans le groupe « ${OFF_TOPIC} », sans autre titre : elle sera gardée et listée, mais ni comptée ni résumée. Une idée qui touche l'objet de l'étude, même de loin, n'y va jamais.
7. Une idée qui critique un objet pour expliquer le recours à un autre (« faute de bus le soir, je prends la voiture ») juge le premier : elle va avec l'objet critiqué (le bus), pas avec l'objet choisi (la voiture). Range ensemble ce qui juge un même objet.`,
      assign: `« ${OFF_TOPIC} » reçoit seulement les idées qui ne répondent pas à l'objet de l'étude. Une idée qui critique un objet pour expliquer le recours à un autre va avec l'objet critiqué.`,
      review: `6. Le ton se juge par rapport à l'objet du motif, pas par rapport à la phrase. Dans « Voiture », « faute de bus le soir, je prends la voiture » critique le bus, pas la voiture : l'idée part dans un motif sur le bus (existant ou nouveau) et ne compte pas comme un avis négatif sur la voiture. De même, un éloge d'un autre objet n'est pas un avis positif sur l'objet du motif : dans « Bus », « le covoiturage, c'est très pratique » part avec le covoiturage.
7. Un motif où les avis positifs et négatifs sont proches en nombre mêle souvent deux objets : lis ses avis camp par camp. Si les uns jugent un objet et les autres un objet voisin (« la gratuité du musée » et « le prix des expositions temporaires » ; « le stationnement payant » et « les contrôles qui ne sont jamais faits »), déplace l'un des deux camps vers un motif qui nomme son objet (existant ou nouveau). Regretter qu'une règle ne soit pas appliquée n'est pas critiquer la règle.
8. Une idée qui ne répond pas à l'objet de l'étude part dans « ${OFF_TOPIC} » : {"id":"I0150","new":"${OFF_TOPIC}"}. Dans le doute, garde-la.
9. Une raison d'avoir choisi un objet plutôt qu'un autre, même en liste (« j'ai pris le train pour : pas de bouchons, des horaires fiables ») : lis "before". Une qualité prêtée à l'objet choisi va avec lui (« pas de bouchons » vante le train : l'idée part avec le train, elle n'est pas un avis positif dans un motif sur la route) ; un défaut nommé de l'autre objet va avec l'autre (règle 6). Dans une comparaison (« le bus est toujours en retard, alors que le tram est à l'heure »), chaque moitié va avec son objet : l'éloge du tram avec le tram, la critique du bus avec le bus.
10. Quand une personne apprécie un objet (lis "before") et regrette qu'une règle ou un tiers le limite (« j'adore ce conservatoire, dommage que les quotas empêchent d'y inscrire tous les enfants »), ce regret est favorable à l'objet : "positive". Un service jugé rare ou insuffisant (« dommage qu'il y ait si peu de bus le soir ») reste une critique de ce service. Une réserve qui nuance une critique (« heureusement, la plupart des chauffeurs sont aimables », après un reproche aux chauffeurs) va dans le motif de cette critique.
11. Un objet ne se découpe pas selon le jugement : quand tu déplaces les éloges d'un objet vers son motif (existant ou nouveau), déplace-y aussi les critiques qui jugent ce même objet, sinon ce motif paraîtra unanime à tort. Sauf une critique qui juge l'autre objet, pour expliquer un choix ou dans une comparaison (règles 7 et 9) : elle reste avec l'objet critiqué.
12. N'ouvre pas de motif « Choix de X » à côté d'un motif sur X : les raisons de choisir le covoiturage vont dans « Covoiturage ».
13. Défendre davantage de ce que les autres idées du motif regrettent de ne pas avoir (dans « Fréquence des contrôles », où l'on regrette des contrôles trop rares : « un contrôle strict, même pénible, ça marche ») n'est pas un éloge de l'objet tel qu'il est : c'est une critique ("negative") ou une proposition ("suggestion").
14. Livre de codes. AVANT de juger les idées d'un motif, écris sa définition en trois clauses courtes (une phrase chacune, sans exemple tiré des idées) : "positive", ce qui compte ici comme favorable à l'objet (pour une règle ou un service : le défendre, l'apprécier, regretter qu'il manque ou ne soit pas appliqué) ; "negative", ce qui compte comme défavorable (le rejeter, le juger insuffisant, en subir les contraintes, en demander davantage) ; "neutral", hors camp (ce qui ne juge pas la situation : un principe général, un constat, un simple souhait). Chaque clause fait douze mots au plus et commence par un verbe à l'infinitif, en minuscules (elle sera lue par le grand public sous le titre du motif). Puis juge chaque idée contre cette définition et corrige sa catégorie quand elle ne s'y conforme pas ; une idée hors camp devient "neutral". Un motif qui a déjà une "definition" la garde ; écris-en une pour chaque motif qui n'en a pas. Réponds alors avec {"definitions":[{"id":"G3","positive":"…","negative":"…","neutral":"…"}],"changes":[…]}, les définitions avant les changements.`,
      summary: `9. Format de "opposed" : [{"a":"I0012","b":"I0040","about":"le prix de l'adhésion"}], "a" et "b" étant les identifiants des deux propositions ; "about" est un groupe nominal (« le classement des élèves »), jamais une phrase ni un verbe.
10. Ne montre pas tes comptes : pas de « dont une des précédentes », « dont deux déjà citées », « parmi elles » (cette règle remplace l'exemple de la règle 7). Chaque affirmation donne son propre nombre de personnes ; le lecteur retrouve les personnes dans les renvois.
11. Le rapport est lu par le grand public. Pour les personnes d'un motif, écris un nombre : jamais « les participants », « la plupart », « des personnes », « beaucoup », ni un sujet collectif sans nombre (« ceux qui… », « les familles », « les témoignages ») ; « toutes les personnes » s'écrit avec son nombre (« les 9 personnes qui donnent un avis »). La base se dit toujours « qui donnent un avis », jamais « qui en parlent » (cette règle remplace « Garde un seul mot pour la même population »). La première phrase dit ce qui est jugé et comment ; elle peut donner le nombre du camp principal, avec le mot de l'échelle de "facts" entre parenthèses juste après le chiffre (« les horaires de la piscine sont critiqués par 17 des 19 personnes qui donnent un avis (large majorité) ») ; elle ne généralise jamais sans nombre (« Ceux qui en parlent la jugent bonne » est faux dès qu'une personne pense autrement). Le mot de l'échelle n'entre jamais sans son nombre. Chaque camp d'avis se dit avec le nombre de ses personnes et ses raisons principales : un exemple ne remplace pas le compte. Nombres toujours en chiffres, en tête de phrase aussi, et dans les tournures des exemples ci-dessus (« 2 personnes estiment », « 2 pistes s'opposent ») ; pas deux phrases de suite qui commencent par un chiffre. Une critique porte sur un objet : on ne « reproche » pas un objet (« 7 personnes critiquent les délais », pas « les délais sont reprochés ») ; pas de « côté éloges » ni « côté propositions ». N'ouvre pas deux synthèses du lot par la même tournure. Au plus un point-virgule par phrase. Une personne qui dit du bien et du mal du même objet est « mitigée », jamais « partagée » (« avis partagés » désigne un motif, pas une personne).
12. Un motif d'une seule personne se dit en une phrase, avec un seul crochet (cette règle remplace « 2 à 4 phrases »).
13. "definition" dit ce qui compte, dans ce motif, comme favorable, défavorable ou hors camp : la synthèse n'appelle éloge, satisfaction ou critique que ce que cette définition désigne ainsi, et décrit une idée hors camp sans la ranger dans un camp.`,
      themes: `4. Le rapport est lu par le grand public : n'écris jamais « les participants » ni « la plupart des participants » pour les personnes d'un groupe ; écris le nombre de personnes, jamais « la plupart », ni un mot de l'échelle sans son nombre, ni un sujet collectif sans nombre (« les familles », « les témoignages », « ceux qui… »), qui ferait un faux consensus.
5. La synthèse du thème relie ses groupes : ce qu'ils ont en commun, ce qui les distingue. Elle ne recopie aucune phrase d'une synthèse de groupe, même reformulée de près : le lecteur les lit juste en dessous. Aucun lien de cause que les participants n'ont pas formulé.`,
      polish: `7. Cette règle remplace l'exemple de la règle 5. Pour attribuer un constat, ne remplace jamais un nombre ou un mot de l'échelle déjà écrit, et n'écris pas « des personnes » : reprends le sujet déjà nommé dans le texte (« ces 6 personnes », « ceux qui parlent des horaires »). « Ceux qui en parlent » suppose l'objet nommé plus tôt dans la phrase. Une critique porte sur un objet : on ne « reproche » pas un objet ; pas de « côté éloges » ni « côté propositions ».`,
      support: `7. "definition" (motifs) dit ce qui compte comme favorable, défavorable ou hors camp : une phrase qui met une personne dans un camp contraire à cette définition est fausse et se récrit.`,
      global: `7. Chaque ligne de "strengths" et "blockers" se dit avec son nombre de personnes, le mot de l'échelle d'avis entre parenthèses juste après le chiffre, sans incise (« les horaires de la piscine sont critiqués par 17 des 19 personnes qui donnent un avis (large majorité) », « le stationnement, par 12 sur 15 (large majorité, fragile) »). La base se dit une fois par paragraphe, à sa première ligne, toujours « qui donnent un avis » (le nombre que portent les motifs) ; ensuite le nombre suffit (« 12 sur 15 », « les 14 »). N'écris jamais « une large majorité » sans son nombre, que le grand public lirait comme la majorité des répondants, ni « tout le monde ». Une critique porte sur un objet ou le vise : on ne « reproche » pas un objet. Varie les attaques d'une phrase à l'autre : l'objet en sujet, le verbe, le nombre ; pas deux phrases de suite sur le même moule. Deux lignes voisines peuvent partager une phrase, chacune avec son objet nommé, son nombre et son mot (la limite d'un chiffre par phrase de la règle 1 ne s'applique pas à elles ; le reste de la règle 1 s'applique) : le résumé peut alors compter jusqu'à 12 phrases.
8. Un motif d'appréciation d'ensemble (« Expérience globale », « Bilan ») ne recueille que des jugements généraux, parfois de personnes qui décrivent ailleurs des difficultés : ne le présente pas comme l'avis de la plupart, ni par le mot de l'échelle ; dis « N personnes portent un jugement positif d'ensemble, que certaines nuancent ailleurs », jamais « aucune difficulté ». S'il réunit le plus de personnes, il ouvre le résumé (règle 10).
9. Pour une proposition, nomme ce que proposent toutes les personnes comptées ("example" n'est que le verbatim de l'une d'elles), sans détail que porte une seule personne (« ouvrir le guichet le samedi » seulement si chaque personne comptée le propose). Une raison ou une précision (« pour son prix ou ses horaires ») n'accompagne le chiffre d'un motif que si chaque personne comptée la donne. Une phrase d'annonce (« L'accès au service concentre les critiques : ») ne couvre que les motifs qu'elle annonce.
10. La première phrase du résumé dit, en nombre de personnes, ce que les participants pensent de l'objet de la question : le jugement d'ensemble (règle 8) s'il existe, puis la critique ou l'éloge le plus partagé (« 31 personnes portent un jugement positif d'ensemble sur la médiathèque, que certaines nuancent ailleurs ; la critique la plus partagée vise les horaires : 29 des 35 personnes qui donnent un avis (large majorité) »). Pas de compte global des critiques ou des satisfactions : le lecteur veut savoir qui pense quoi. Ne conclus pas que l'avis est positif ou négatif dans l'ensemble : les questions posées orientent ce qu'on dit. Tous les chiffres viennent des lignes des listes. Le mot de l'échelle porte sur le ton du motif, jamais sur un détail que tous ne disent pas : « tous ceux qui en parlent critiquent la propreté des rues », pas « tous décrivent des poubelles qui débordent ». Une ligne marquée « (fragile) » garde ce mot dans la parenthèse (« (large majorité, fragile) »).`,
    },
  },
  gemma: {
    ...REFERENCE,
    id: 'gemma',
    label: 'méthode Gemma (sur votre ordinateur)',
    // Passe 1 (référence, methodologue 2,5 / plume 3) : motifs fourre-tout (« Éléments spécifiques ») et doublons.
    // Passe 2 : essai croisé des apports de la méthode Gemini (rattachement des isolés, règles de titre et de rédaction).
    // Avec ces règles, le regroupement de 295 idées d'un coup bouclait jusqu'à la limite de réponse : lots de la méthode Ministral.
    // Passe 2 : methodologue 3/5 (titres nets) mais 74 motifs dont 43 à une personne. Passe 3 : lots intermédiaires.
    batches: { grouping: 250, assign: 120, review: 60, summary: 40, support: 220, polish: 12 },
    attachSingles: true,
    extraRules: {
      ...GEMINI_RULES,
      grouping: `${GEMINI_RULES.grouping} Jamais de titre fourre-tout (« Éléments spécifiques », « Autres sujets », « Contenu », « Divers »).`,
    },
  },
  qwen: { ...REFERENCE, id: 'qwen', label: 'méthode Qwen (sur votre ordinateur)' },
}

/** Les règles propres à une méthode pour une consigne, prêtes à insérer (rien pour la référence). */
export function methodRules(
  settings: Pick<AnalysisSettings, 'method'> & { lightModel?: boolean },
  prompt: 'extract' | 'grouping' | 'assign' | 'review' | 'summary' | 'themes' | 'global' | 'polish' | 'unanimity' | 'support' | 'sweep',
): string {
  const r = methodOf(settings).extraRules[prompt]
  return r ? `${r}\n` : ''
}

export function methodOf(settings: Pick<AnalysisSettings, 'method'> & { lightModel?: boolean }): Method {
  // `lightModel` : analyses enregistrées avant les profils de méthode.
  return METHODS[settings.method ?? (settings.lightModel ? 'ministral' : 'reference')] ?? REFERENCE
}
