import type { AnalysisSettings } from './types'

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
export type MethodId = 'reference' | 'ministral' | 'gemini' | 'groq' | 'gptoss' | 'gemma' | 'qwen'

export interface Method {
  id: MethodId
  /** Nom montré dans la Méthode du rapport. */
  label: string
  /** Taille des lots envoyés au modèle. */
  batches: { grouping: number; assign: number; review: number; summary: number; support: number; polish: number }
  /** Exemple de la règle 3 du regroupement (une cause, le problème et la solution vont ensemble). */
  groupingExample: string
  /** Citation dont le modèle a corrigé quelques fautes de frappe : rattachée au texte d'origine. */
  typoTolerantQuotes: boolean
  /** Après la consolidation, chaque motif porté par une seule personne est proposé au rattachement à un motif existant (ou à aucun). */
  attachSingles: boolean
  /** Règles ajoutées à la fin des règles d'une consigne, pour cette méthode seulement (la référence n'en a aucune). */
  extraRules: Partial<Record<'grouping' | 'summary' | 'themes' | 'global', string>>
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
export function methodRules(settings: Pick<AnalysisSettings, 'method'> & { lightModel?: boolean }, prompt: 'grouping' | 'summary' | 'themes' | 'global'): string {
  const r = methodOf(settings).extraRules[prompt]
  return r ? `${r}\n` : ''
}

export function methodOf(settings: Pick<AnalysisSettings, 'method'> & { lightModel?: boolean }): Method {
  // `lightModel` : analyses enregistrées avant les profils de méthode.
  return METHODS[settings.method ?? (settings.lightModel ? 'ministral' : 'reference')] ?? REFERENCE
}
