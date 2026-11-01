import type { MethodId } from '../analysis/methods'
/**
 * Registre des fournisseurs de moteurs d'IA.
 *
 * Ces informations changent souvent (offres gratuites, modèles, politiques de
 * données). Elles sont regroupées ici pour être mises à jour sans toucher au
 * reste du code. Les mentions sur les données reprennent ce que les
 * fournisseurs publient ; en cas de doute, la fiche invite à vérifier.
 */

export type DataPolicy = 'local' | 'no-training' | 'may-train-free' | 'check'

/** Une étape du guide de configuration, affichée telle quelle à l'utilisateur. */
export interface SetupStep {
  text: string
  link?: { label: string; url: string }
  /** Commande à copier (dans le Terminal). */
  code?: string
}

/** Où le fournisseur est présenté : pour essayer, pour garder tout chez soi, ou parmi les autres. */
export type PresetFamily = 'free' | 'local' | 'other'

/**
 * Qui sert le modèle. Un fournisseur direct sert ses propres modèles (une
 * politique de données, un contrat) ; un hébergeur de modèles ouverts sert sur
 * ses machines les modèles d'autres éditeurs ; une plateforme multi-fournisseurs
 * relaie vers de nombreux hébergeurs avec une seule clé (un intermédiaire de
 * plus, et une politique qui dépend du modèle choisi).
 */
export type ProviderKind = 'direct' | 'host' | 'router' | 'local' | 'custom'

/** Un modèle proposé dans la liste, avec de quoi choisir sans connaître le fournisseur. */
/** Une synthèse réelle de 20 participants, notée par deux lectures qui ignorent quel moteur l'a écrite. */
export interface BlindTest {
  /** Note de chaque lecture, sur 10. */
  scores: [number, number]
  /** Erreurs qui changent une conclusion, relevées par chaque lecture. */
  errors: [number, number]
  /** Durée de la synthèse. */
  minutes: number
  /** Coût estimé en dollars, si le modèle est payant. */
  costUsd?: number
  date: string
  /** Même mesure sur le gros corpus (Grand débat, 378 participants), avec les réglages par défaut de l'application. */
  large?: LargeTest
}

/** `scores` et `minutes` manquent tant que le moteur n'a pas terminé : `days` donne alors la durée estimée. */
export interface LargeTest {
  scores?: [number, number]
  minutes?: number
  days?: number
  costUsd?: number
}

/** Taille du gros corpus des essais. */
export const LARGE_PARTICIPANTS = 378

export interface ModelChoice {
  id: string
  /** Nom lisible. */
  label: string
  /** Pourquoi le choisir, en une phrase. */
  hint: string
  /** Partie de la liste (ex. « Inclus dans l'offre gratuite »). */
  section?: string
  recommended?: boolean
  /** Méthode commune réglée pour ce modèle (voir src/core/analysis/methods.ts) ; à défaut, la méthode commune. */
  method?: MethodId
  /** Paramètres propres au modèle, ajoutés à chaque demande. */
  extraBody?: Record<string, unknown>
  /** Dernier essai à l'aveugle sur ÉcoSol (docs/NOTATION.md, docs/PERFORMANCES-MOTEURS.md) : proposé si sa note atteint BLIND_THRESHOLD. */
  blindTest?: BlindTest
  /** Pourquoi le modèle est encore à l'étude (sinon, la raison du fournisseur) : même au seuil, il n'est alors pas proposé. */
  study?: string
  /** Secondes par demande, mesurées sur une synthèse réelle (temps écoulé ÷ demandes, avec le parallélisme par défaut). */
  secondsPerCall?: number
}

export interface ProviderPreset {
  id: string
  label: string
  baseUrl: string
  /** Modèle proposé par défaut. Préférez un identifiant de version daté. */
  defaultModel: string
  suggestedModels: string[]
  /** Liste expliquée des modèles ; à défaut, `suggestedModels` sans explication. */
  models?: ModelChoice[]
  needsKey: boolean
  keyUrl?: string
  /** Nom du paramètre de graine, si le fournisseur en accepte un. */
  seedParam?: 'seed' | 'random_seed'
  supportsJsonMode: boolean
  /** Demandes par minute conseillées sur l'offre gratuite. */
  freeRequestsPerMinute: number
  freeTier: string
  dataPolicy: DataPolicy
  dataNote: string
  family: PresetFamily
  /** Pour quel usage le recommander, en une phrase. */
  bestFor: string
  /** Guide pas à pas, du compte à la clé. */
  steps: SetupStep[]
  kind: ProviderKind
  /** En-têtes à ajouter à chaque demande (ex. l'autorisation d'appel depuis un navigateur chez Anthropic). */
  extraHeaders?: Record<string, string>
  /** Le fournisseur refuse le paramètre de température (la reproductibilité passe alors par le cache des réponses). */
  omitTemperature?: boolean
  /** Présenté en tête de son groupe. */
  featured?: boolean
  /** Longueur de réponse réservée quand la demande n'en fixe pas. */
  maxOutputTokens?: number
  /** Plafond de jetons d'une demande (texte envoyé et réponse réservée). */
  tokenBudget?: number
  /** Paramètres ajoutés pour les modèles dont le nom contient `match` (modèles installés, hors liste). */
  modelExtraBody?: { match: string; body: Record<string, unknown> }[]
  /** Méthode d'analyse des modèles installés dont le nom contient `match`. */
  modelMethods?: { match: string; method: MethodId }[]
  /** Pourquoi le fournisseur est encore à l'étude, quand aucun de ses modèles n'est validé. */
  study?: string
  /** Secondes par demande mesurées pour les modèles dont le nom contient `match` (modèles installés, hors liste). */
  modelSeconds?: { match: string; secondsPerCall: number }[]
}

/**
 * Seuil de qualité (décision d'Arnaud, 14/10/2026) : un moteur n'est proposé qu'au niveau de l'offre gratuite de Gemini
 * au moins, mesuré à l'aveugle le 1/11/2026, et s'il n'est pas pénible à utiliser. Sinon il reste visible « à l'étude », avec la raison.
 */
export const BLIND_THRESHOLD = 5.5

export function modelProposed(model: ModelChoice): boolean {
  if (!model.blindTest || model.study) return false
  return (model.blindTest.scores[0] + model.blindTest.scores[1]) / 2 >= BLIND_THRESHOLD
}

/** Les modèles proposés, dans l'ordre du comparatif : par usage, pas par note (une note est un repère, pas un classement). */
export const COMPARED: { preset: string; model: string; tag?: string; pitch: string; effort?: string }[] = [
  { preset: 'anthropic', model: 'claude-sonnet-5-5', tag: 'Recommandé', pitch: 'Le meilleur rapport qualité-prix', effort: 'moyen' },
  { preset: 'gemini', model: 'gemini-3.5-flash-lite', pitch: 'Pour essayer · 150 à 200 participants par jour' },
  { preset: 'anthropic', model: 'claude-haiku-5-5', pitch: 'Bon marché, à relire de près', effort: 'moyen' },
  { preset: 'anthropic', model: 'claude-opus-5-5', pitch: 'Le plus cher', effort: 'moyen' },
]

export const NOT_EVALUATED =
  "Pas encore évalué sur un corpus réel : OpenScribe ne propose un moteur d'IA qu'après une synthèse au moins du niveau de l'offre gratuite de Gemini."

/** Un fournisseur est proposé quand au moins un de ses modèles est validé. */
export function presetStudy(preset: ProviderPreset): string | undefined {
  return preset.models?.some(modelProposed) ? undefined : (preset.study ?? NOT_EVALUATED)
}

/** Pourquoi ce modèle est à l'étude, ou `undefined` s'il est validé. */
export function modelStudy(presetId: string, model: string): string | undefined {
  const p = presetById(presetId)
  if (!p) return NOT_EVALUATED
  const choice = p.models?.find((m) => m.id === model)
  if (choice && modelProposed(choice)) return undefined
  return choice?.study ?? p.study ?? NOT_EVALUATED
}

/** Secondes par demande mesurées sur une synthèse réelle pour ce modèle, si on les connaît. */
export function typicalSecondsPerCall(presetId: string, model: string): number | undefined {
  const p = presetById(presetId)
  return p?.models?.find((m) => m.id === model)?.secondsPerCall ?? p?.modelSeconds?.find((m) => model.includes(m.match))?.secondsPerCall
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'mistral',
    label: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'ministral-14b-2512',
    suggestedModels: ['ministral-14b-2512', 'ministral-8b-2512', 'mistral-small-2603', 'mistral-medium-2604'],
    // Vérifié le 13/10/2026 avec une clé de l'offre gratuite (sans paiement à l'usage).
    models: [
      {
        id: 'ministral-14b-2512',
        label: 'Ministral 14B',
        hint: 'Le plus capable des modèles gratuits.',
        section: "Inclus dans l'offre gratuite",
        recommended: true,
        method: 'commune-ministral',
        blindTest: { scores: [4, 3.5], errors: [9, 10], minutes: 13, date: '2026-11-01' },
        study: 'Sous le niveau de l’offre gratuite de Gemini sur un corpus réel, à l’aveugle (1/11/2026).',
        secondsPerCall: 11,
      },
      { id: 'ministral-8b-2512', label: 'Ministral 8B', hint: 'Plus rapide, des idées moins fines.', section: "Inclus dans l'offre gratuite", method: 'commune-ministral' },
      { id: 'ministral-3b-2512', label: 'Ministral 3B', hint: 'Très rapide, pour un essai seulement.', section: "Inclus dans l'offre gratuite", method: 'commune-ministral' },
      {
        id: 'mistral-small-2603',
        label: 'Mistral Small',
        hint: 'Meilleure lecture des nuances, bon marché.',
        section: 'Avec le paiement à l’usage activé',
      },
      {
        id: 'mistral-medium-2604',
        label: 'Mistral Medium',
        hint: 'La meilleure qualité de rédaction chez Mistral.',
        section: 'Avec le paiement à l’usage activé',
      },
      {
        id: 'mistral-large-4',
        label: 'Mistral Large 4',
        hint: 'Le plus capable chez Mistral.',
        section: "Inclus dans l'offre gratuite",
        // Avec une température de 0, Mistral Large exige top_p à 1 (erreur 400 sinon, vérifié le 1/11/2026).
        extraBody: { top_p: 1 },
        blindTest: { scores: [6, 5.5], errors: [7, 7], minutes: 80, date: '2026-11-01' },
        study: 'Aussi bon que l’offre gratuite de Gemini, mais plus d’une heure par synthèse : l’offre gratuite de Mistral plafonne à 20\u00a0000 jetons par minute (1er novembre 2026).',
      },
    ],
    needsKey: true,
    keyUrl: 'https://admin.mistral.ai/organization/api-keys',
    study:
      'Sur un corpus réel, Ministral 14B fait moins bien que l’offre gratuite de Gemini, et Mistral Large 4 met plus d’une heure avec l’offre gratuite de Mistral. Mistral Small et Medium (payants) n’ont pas encore été évalués.',
    seedParam: 'random_seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 20,
    freeTier:
      "Gratuit sans carte avec les modèles Ministral. Mistral Small et Medium demandent d'activer le paiement à l'usage, avec une carte bancaire.",
    dataPolicy: 'check',
    dataNote:
      "Sauf refus de votre part, Mistral peut réutiliser vos demandes pour améliorer ses modèles : refusez-le dans Admin › API › Confidentialité, chez Mistral, avant d'envoyer des données de participants. Hébergement en Europe.",
    family: 'free',
    bestFor: 'Essayer gratuitement, avec un hébergement en Europe.',
    kind: 'direct',
    steps: [
      {
        text: 'Connectez-vous chez Mistral (ou créez un compte gratuit), puis ouvrez Admin › Clés API.',
        link: { label: 'Aller aux clés Mistral', url: 'https://admin.mistral.ai/organization/api-keys' },
      },
      { text: 'Cliquez sur « Nouvelle clé », puis copiez-la : elle ne s’affiche qu’une fois.' },
      { text: 'Collez la clé ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'groq',
    label: 'Groq',
    study: "Offre gratuite trop limitée : environ une heure pour une synthèse d'une vingtaine de participants, et un quota quotidien vite épuisé (constaté le 13/10/2026).",
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'openai/gpt-oss-120b',
    suggestedModels: ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'],
    // Offre gratuite lue dans la console le 13/10/2026 : 30 demandes/min, 1 000/jour, 8 000 jetons/min, 200 000 jetons/jour.
    models: [
      {
        id: 'openai/gpt-oss-120b',
        label: 'GPT-OSS 120B',
        hint: 'Le plus capable de l’offre gratuite.',
        section: "Inclus dans l'offre gratuite",
        recommended: true,
        method: 'commune-groq',
        // Sa réflexion consomme la réponse : courte, pour laisser place au JSON.
        extraBody: { reasoning_effort: 'low' },
      },
      { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B', hint: 'Bon en français, mêmes limites.', section: "Inclus dans l'offre gratuite", method: 'commune-groq' },
      {
        id: 'openai/gpt-oss-20b',
        label: 'GPT-OSS 20B',
        hint: 'Plus rapide, moins fin.',
        section: "Inclus dans l'offre gratuite",
        method: 'commune-groq',
        extraBody: { reasoning_effort: 'low' },
      },
    ],
    // Sans longueur demandée, Groq coupe la réponse vers 2 000 à 3 000 jetons ; une demande ne dépasse pas 8 000 jetons en tout.
    maxOutputTokens: 4000,
    tokenBudget: 8000,
    needsKey: true,
    keyUrl: 'https://console.groq.com/keys',
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 3,
    freeTier:
      "Gratuit sans carte, mais trop limité pour une synthèse : 8 000 jetons par minute et 200 000 par jour. Une vingtaine de participants demande plus d'une heure et dépasse le quota du jour.",
    dataPolicy: 'check',
    dataNote:
      "Groq ne conserve pas vos demandes par défaut (sauf enquête sur un abus, 30 jours au plus) ; la réutilisation pour l'entraînement n'est pas précisée. Hébergement aux États-Unis.",
    family: 'other',
    bestFor: 'De petites synthèses (quelques participants), avec des réponses très rapides.',
    kind: 'host',
    steps: [
      {
        text: 'Connectez-vous à la console Groq (compte Google, GitHub ou adresse e-mail, pas de carte bancaire).',
        link: { label: 'Aller aux clés Groq', url: 'https://console.groq.com/keys' },
      },
      { text: '« Create API Key », donnez-lui un nom, puis « Copy » : la clé ne s’affiche qu’une fois.' },
      { text: 'Collez la clé ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-3.5-flash-lite',
    suggestedModels: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'],
    // Limites de l'offre gratuite lues dans AI Studio le 13/10/2026 (une synthèse de 20 participants : 50 à 80 demandes).
    models: [
      {
        id: 'gemini-3.5-flash-lite',
        label: 'Gemini 3.5 Flash-Lite',
        hint: '500 demandes par jour : de quoi faire plusieurs synthèses.',
        section: "Inclus dans l'offre gratuite",
        recommended: true,
        method: 'commune-gemini',
        // Grand débat : le quota de 500 demandes par jour étale la synthèse sur deux jours (estimation, essai inachevé le 1/11/2026).
        blindTest: { scores: [5.5, 5.5], errors: [4, 5], minutes: 6, date: '2026-11-01', large: { days: 2 } },
        // ÉcoSol, méthode commune : 64 demandes en 5,5 minutes (1/11/2026).
        secondsPerCall: 5,
      },
      {
        id: 'gemini-3.1-flash-lite',
        label: 'Gemini 3.1 Flash-Lite',
        hint: 'Plus ancien, mêmes limites.',
        section: "Inclus dans l'offre gratuite",
        method: 'commune-gemini',
        blindTest: { scores: [4, 4.5], errors: [9, 8], minutes: 7, date: '2026-11-01' },
        study: 'Sous le niveau de Gemini 3.5 Flash-Lite sur un corpus réel, à l’aveugle (1er novembre 2026).',
      },
      {
        id: 'gemini-3.8-flash',
        label: 'Gemini 3.8 Flash',
        hint: 'Plus fin, mais 20 demandes par jour en gratuit : une synthèse n’y tient pas.',
        section: 'Avec la facturation activée',
        method: 'commune-gemini',
        study: 'Payant : pas encore évalué sur un corpus réel. En gratuit, 20 demandes par jour, soit environ quatre jours par synthèse.',
      },
    ],
    needsKey: true,
    keyUrl: 'https://aistudio.google.com/api-keys',
    // Pas de graine : l'interface compatible OpenAI de Gemini refuse ce paramètre (vérifié le 13/10/2026).
    supportsJsonMode: true,
    freeRequestsPerMinute: 12,
    freeTier: 'Gratuit sans carte avec les modèles Flash-Lite (500 demandes par jour).',
    dataPolicy: 'may-train-free',
    dataNote:
      "Sur l'offre gratuite, vos contenus peuvent être utilisés par Google et relus par des humains, sauf si vous êtes dans l'Union européenne, en Suisse ou au Royaume-Uni (les conditions de l'offre payante s'appliquent alors). Offre payante : pas d'entraînement.",
    family: 'free',
    bestFor: 'Essayer gratuitement avec un compte Google.',
    kind: 'direct',
    steps: [
      {
        text: 'Connectez-vous à Google AI Studio avec votre compte Google, puis cliquez sur « Créer une clé API ».',
        link: { label: 'Ouvrir Google AI Studio', url: 'https://aistudio.google.com/api-keys' },
      },
      {
        text: "Choisissez un projet au « Niveau sans frais » : une clé d'un projet avec facturation vous serait facturée. Puis « Créer une clé » et « Copier la clé ».",
      },
      { text: 'Collez la clé ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'mistralai/mistral-small-3.2-24b-instruct',
    suggestedModels: ['mistralai/mistral-small-3.2-24b-instruct', 'google/gemini-2.5-flash'],
    needsKey: true,
    keyUrl: 'https://openrouter.ai/keys',
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 20,
    freeTier: 'Accès à de nombreux modèles ; certains sont gratuits avec des limites.',
    dataPolicy: 'check',
    dataNote: 'La politique de données dépend du modèle et de son hébergeur : vérifiez-la pour le modèle choisi.',
    family: 'other',
    bestFor: 'Accéder à de nombreux modèles avec une seule clé.',
    kind: 'router',
    steps: [
      { text: 'Créez un compte chez OpenRouter, puis une clé dans « Keys ».', link: { label: 'Aller aux clés OpenRouter', url: 'https://openrouter.ai/keys' } },
      { text: 'Collez la clé ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'ollama',
    label: 'Ollama (sur votre ordinateur)',
    study:
      'Essayé sur un ordinateur doté de 24 Go de mémoire (14/10/2026) : sous le niveau de l’offre gratuite de Gemini, et 40 minutes ou plus par synthèse. À revoir avec des modèles locaux plus solides.',
    // Mesuré sur ÉcoSol (Mac M5, 24 Go) : Gemma 4 12B environ 50 s par demande, gpt-oss 20B plusieurs minutes.
    modelSeconds: [
      { match: 'gemma', secondsPerCall: 50 },
      { match: 'gpt-oss', secondsPerCall: 150 },
    ],
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'gpt-oss:20b',
    suggestedModels: ['gpt-oss:20b', 'gemma4:12b', 'qwen3:8b'],
    // Une boucle de répétition ne doit pas tourner sans fin (vu le 14/10 : 18 000 jetons sur une seule réponse) ;
    // 8 192 coupait la relecture des motifs avec une réflexion moyenne. Le contexte de 32k laisse la place.
    maxOutputTokens: 16384,
    needsKey: false,
    // gpt-oss réfléchit avant de répondre : courte, la réflexion laisse place au JSON (mesuré le 14/10 sur un Mac M5).
    // Gemma 4 : sans réflexion (12 jetons au lieu de 218 sur une question simple).
    modelExtraBody: [
      // Réflexion moyenne : en courte, gpt-oss met toute une liste dans un seul groupe (14/10) ; en local, le temps n'est pas compté.
      { match: 'gpt-oss', body: { reasoning_effort: 'medium' } },
      { match: 'gemma', body: { reasoning_effort: 'none' } },
    ],
    modelMethods: [
      { match: 'gpt-oss', method: 'commune-gptoss' },
      { match: 'gemma', method: 'commune-gemma' },
      { match: 'qwen', method: 'commune-qwen' },
    ],
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 60,
    freeTier: "Gratuit : le moteur d'IA tourne sur votre ordinateur. Plus lent sur un ordinateur modeste.",
    dataPolicy: 'local',
    dataNote: "Vos verbatims sont traités sur cet ordinateur. Comptez au moins 8 Go de mémoire vive ; l'analyse est plus lente qu'avec un service en ligne.",
    family: 'local',
    bestFor: 'Des données sensibles : le moteur tourne sur votre ordinateur et rien ne quitte votre machine.',
    kind: 'local',
    steps: [
      {
        text: "Téléchargez et installez Ollama, puis ouvrez-le. Sur Mac, une petite icône apparaît dans la barre des menus ; sur Windows, l'icône apparaît près de l'horloge.",
        link: { label: 'Télécharger Ollama', url: 'https://ollama.com/download' },
      },
      {
        text: "Sur Mac, ouvrez le Terminal (sur Windows, l'invite de commandes) et téléchargez un modèle (environ 13 Go, une seule fois) :",
        code: 'ollama pull gpt-oss:20b',
      },
      {
        text: "Dans les réglages d'Ollama, portez la longueur de contexte à 32k : sinon Ollama coupe en silence les longues demandes d'une synthèse.",
      },
      { text: 'Revenez ici : OpenScribe détecte Ollama et ses modèles tout seul. Cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-5-5',
    suggestedModels: ['claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-opus-5-5'],
    models: [
      {
        id: 'claude-sonnet-5-5',
        label: 'Claude Sonnet 5.5',
        hint: 'Le meilleur rapport qualité-prix de nos essais à l’aveugle.',
        recommended: true,
        // Sonnet réfléchit davantage par défaut que Haiku et Opus ; la couche compatible OpenAI ignore `reasoning_effort`.
        extraBody: { output_config: { effort: 'medium' } },
        // ÉcoSol, méthode commune : 54 demandes en 12,5 minutes, 427 000 jetons envoyés et 211 000 écrits (1/11/2026).
        blindTest: { scores: [7.5, 7.5], errors: [1, 2], minutes: 13, costUsd: 3, date: '2026-11-01', large: { scores: [7.5, 7], minutes: 29, costUsd: 10 } },
        secondsPerCall: 14,
      },
      {
        id: 'claude-haiku-5-5',
        label: 'Claude Haiku 5.5',
        hint: 'Bien moins cher que Sonnet, mais à relire de plus près.',
        // ÉcoSol, méthode commune : 58 demandes en 19 minutes, 474 000 jetons envoyés et 608 000 écrits (1/11/2026).
        blindTest: { scores: [6.5, 6.5], errors: [2, 3], minutes: 19, costUsd: 0.35, date: '2026-11-01', large: { scores: [6.5, 6.5], minutes: 70, costUsd: 1.9 } },
        secondsPerCall: 20,
      },
      {
        id: 'claude-opus-5-5',
        label: 'Claude Opus 5.5',
        hint: 'Le plus cher, un peu mieux noté sur un gros corpus.',
        // ÉcoSol, méthode commune : 53 demandes en 12 minutes, 441 000 jetons envoyés et 158 000 écrits (1/11/2026).
        blindTest: { scores: [7.5, 7], errors: [2, 3], minutes: 12, costUsd: 4.9, date: '2026-11-01', large: { scores: [8, 7.5], minutes: 30, costUsd: 19 } },
        secondsPerCall: 14,
      },
    ],
    needsKey: true,
    keyUrl: 'https://platform.claude.com/settings/keys',
    supportsJsonMode: false,
    freeRequestsPerMinute: 20,
    freeTier: 'Payant, sans offre gratuite durable : crédit prépayé, avec un plafond de dépenses réglable.',
    dataPolicy: 'no-training',
    dataNote: "Les appels à l'API ne servent pas à entraîner les modèles ; ils sont supprimés sous 30 jours par défaut.",
    family: 'other',
    bestFor: 'Rédiger et analyser de longs textes.',
    kind: 'direct',
    featured: true,
    extraHeaders: { 'anthropic-dangerous-direct-browser-access': 'true' },
    omitTemperature: true,
    steps: [
      {
        text: 'Créez un compte sur la console Anthropic et ajoutez un crédit (fixez un plafond de dépenses).',
        link: { label: 'Ouvrir la console Anthropic', url: 'https://platform.claude.com/' },
      },
      { text: 'Dans « API keys », créez une clé et copiez-la.', link: { label: 'Aller aux clés Anthropic', url: 'https://platform.claude.com/settings/keys' } },
      { text: 'Collez la clé ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-6.1-sol',
    suggestedModels: ['gpt-6.1-sol', 'gpt-6-luna', 'gpt-6-astra'],
    needsKey: true,
    keyUrl: 'https://platform.openai.com/api-keys',
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 20,
    freeTier: 'Payant : crédit prépayé (5 $ minimum), sans offre gratuite.',
    dataPolicy: 'no-training',
    dataNote:
      "Les appels à l'API ne servent pas à entraîner les modèles par défaut ; journaux de sécurité gardés 30 jours. Hébergement en Europe possible pour certains projets.",
    family: 'other',
    bestFor: 'Les modèles GPT, si vous avez déjà un compte développeur OpenAI.',
    kind: 'direct',
    steps: [
      {
        text: 'Créez un compte développeur OpenAI et ajoutez un crédit (fixez un plafond de dépenses).',
        link: { label: 'Ouvrir la plateforme OpenAI', url: 'https://platform.openai.com/' },
      },
      { text: 'Dans « API keys », créez une clé et copiez-la.', link: { label: 'Aller aux clés OpenAI', url: 'https://platform.openai.com/api-keys' } },
      { text: 'Collez la clé ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'xai',
    label: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-4.3',
    suggestedModels: ['grok-4.3', 'grok-4.7'],
    needsKey: true,
    keyUrl: 'https://console.x.ai/',
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 20,
    freeTier: 'Payant ; une éventuelle offre gratuite est à vérifier sur la console xAI.',
    dataPolicy: 'no-training',
    dataNote: "Pas d'entraînement sans autorisation explicite ; conservation 30 jours pour l'audit. Hébergement probablement aux États-Unis.",
    family: 'other',
    bestFor: 'Les modèles Grok, avec un très grand contexte.',
    kind: 'direct',
    steps: [
      {
        text: 'Créez un compte sur la console xAI, ajoutez un crédit, puis créez une clé.',
        link: { label: 'Ouvrir la console xAI', url: 'https://console.x.ai/' },
      },
      { text: 'Collez la clé ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'cohere',
    label: 'Cohere',
    baseUrl: 'https://api.cohere.ai/compatibility/v1',
    defaultModel: 'command-a-03-2025',
    suggestedModels: ['command-a-03-2025'],
    needsKey: true,
    keyUrl: 'https://dashboard.cohere.com/api-keys',
    study:
      "Clé d'essai gratuite, sans carte : 1 000 demandes par mois, de quoi faire une quinzaine de synthèses. Fonctionne depuis le navigateur (vérifié le 14/10/2026) ; qualité pas encore évaluée.",
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 20,
    freeTier: "Clé d'essai gratuite, sans carte : 1 000 demandes par mois, pour évaluer seulement (pas pour un usage commercial).",
    dataPolicy: 'check',
    dataNote: 'Entreprise canadienne ; vérifiez dans la console si les demandes de la clé d’essai peuvent servir à améliorer les modèles.',
    family: 'other',
    bestFor: 'Une offre d’essai gratuite avec un modèle de taille professionnelle.',
    kind: 'direct',
    steps: [
      { text: 'Créez un compte Cohere : une clé d’essai est créée d’office.', link: { label: 'Aller aux clés Cohere', url: 'https://dashboard.cohere.com/api-keys' } },
      { text: 'Collez la clé ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-flash',
    suggestedModels: ['deepseek-flash', 'deepseek-v4-pro'],
    needsKey: true,
    keyUrl: 'https://platform.deepseek.com/api_keys',
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 20,
    freeTier: 'Payant, très bon marché (moitié prix en heures creuses), sans offre gratuite.',
    dataPolicy: 'check',
    dataNote: "Données stockées en Chine ; la réutilisation des appels à l'API n'est pas clairement exclue. À éviter pour des données de participants.",
    family: 'other',
    bestFor: 'Des modèles très bon marché, pour des données non sensibles.',
    kind: 'direct',
    steps: [
      {
        text: 'Créez un compte DeepSeek, ajoutez un solde, puis créez une clé.',
        link: { label: 'Aller aux clés DeepSeek', url: 'https://platform.deepseek.com/api_keys' },
      },
      { text: 'Collez la clé ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'qwen',
    label: 'Alibaba (Qwen)',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen3.7-plus',
    suggestedModels: ['qwen3.7-plus', 'qwen3.8-flash', 'qwen3.8-max'],
    needsKey: true,
    keyUrl: 'https://modelstudio.console.alibabacloud.com/',
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 20,
    freeTier: '1 million de jetons offerts par modèle pendant 90 jours (offre internationale).',
    dataPolicy: 'check',
    dataNote: "Hébergement à Singapour ou aux États-Unis, au choix ; la réutilisation des données n'est pas documentée clairement.",
    family: 'other',
    bestFor: 'Les modèles Qwen, avec un quota offert pour essayer.',
    kind: 'direct',
    steps: [
      {
        text: 'Créez un compte Alibaba Cloud (Model Studio, région internationale), puis une clé d’API.',
        link: { label: 'Ouvrir Model Studio', url: 'https://modelstudio.console.alibabacloud.com/' },
      },
      { text: 'Collez la clé ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'moonshot',
    label: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.ai/v1',
    defaultModel: 'kimi-k3',
    suggestedModels: ['kimi-k3', 'kimi-k2.6'],
    needsKey: true,
    keyUrl: 'https://platform.kimi.ai/',
    supportsJsonMode: true,
    freeRequestsPerMinute: 20,
    freeTier: 'Payant ; offre gratuite non documentée.',
    dataPolicy: 'check',
    dataNote: "Serveurs à Singapour ; la politique n'exclut pas la réutilisation des appels à l'API pour améliorer les modèles.",
    family: 'other',
    bestFor: 'Les modèles Kimi, pour des données non sensibles.',
    kind: 'direct',
    steps: [
      {
        text: 'Créez un compte sur la plateforme Kimi, ajoutez un crédit, puis créez une clé.',
        link: { label: 'Ouvrir la plateforme Kimi', url: 'https://platform.kimi.ai/' },
      },
      { text: 'Collez la clé ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'scaleway',
    label: 'Scaleway (Paris)',
    baseUrl: 'https://api.scaleway.ai/v1',
    defaultModel: 'mistral-medium-3.5-128b',
    suggestedModels: ['mistral-medium-3.5-128b', 'qwen3.5-397b-a17b', 'gpt-oss-120b', 'llama-3.3-70b-instruct'],
    needsKey: true,
    keyUrl: 'https://console.scaleway.com/iam/api-keys',
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 20,
    freeTier: '1 million de jetons offerts pour commencer, puis paiement à l’usage.',
    dataPolicy: 'no-training',
    dataNote:
      'Hébergé à Paris ; les données ne servent pas à entraîner les modèles et ne sont pas conservées (sauf les demandes en erreur, deux semaines au plus).',
    family: 'other',
    bestFor: 'Des modèles ouverts hébergés en France, pour des données à garder en Europe.',
    kind: 'host',
    steps: [
      {
        text: 'Créez un compte Scaleway, puis une clé d’API dans « IAM ».',
        link: { label: 'Aller aux clés Scaleway', url: 'https://console.scaleway.com/iam/api-keys' },
      },
      { text: 'Collez la clé secrète ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'together',
    label: 'Together AI',
    baseUrl: 'https://api.together.ai/v1',
    defaultModel: 'openai/gpt-oss-120b',
    suggestedModels: ['openai/gpt-oss-120b', 'Qwen/Qwen3.6-Plus', 'deepseek-ai/DeepSeek-V4-Pro-0813'],
    needsKey: true,
    keyUrl: 'https://api.together.ai/settings/api-keys',
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 20,
    freeTier: 'Payant : 5 $ minimum, sans offre gratuite.',
    dataPolicy: 'no-training',
    dataNote: "Pas d'entraînement sans accord exprès ; la non-conservation se règle par organisation (désactivée par défaut).",
    family: 'other',
    bestFor: 'Un large choix de modèles ouverts, avec une seule clé.',
    kind: 'host',
    steps: [
      {
        text: 'Créez un compte Together AI, ajoutez un crédit, puis créez une clé.',
        link: { label: 'Aller aux clés Together', url: 'https://api.together.ai/settings/api-keys' },
      },
      { text: 'Collez la clé ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'fireworks',
    label: 'Fireworks AI',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    defaultModel: 'accounts/fireworks/models/gpt-oss-120b',
    suggestedModels: ['accounts/fireworks/models/gpt-oss-120b'],
    needsKey: true,
    keyUrl: 'https://app.fireworks.ai/settings/users/api-keys',
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 20,
    freeTier: 'Petit crédit offert à l’inscription, puis paiement à l’usage.',
    dataPolicy: 'no-training',
    dataNote: 'Aucune conservation par défaut pour les modèles ouverts.',
    family: 'other',
    bestFor: 'Des modèles ouverts rapides, sans conservation des données.',
    kind: 'host',
    steps: [
      {
        text: 'Créez un compte Fireworks, puis une clé d’API.',
        link: { label: 'Aller aux clés Fireworks', url: 'https://app.fireworks.ai/settings/users/api-keys' },
      },
      { text: 'Collez la clé ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'deepinfra',
    label: 'DeepInfra',
    baseUrl: 'https://api.deepinfra.com/v1/openai',
    defaultModel: 'deepseek-ai/DeepSeek-V4-Flash-0731',
    suggestedModels: ['deepseek-ai/DeepSeek-V4-Flash-0731', 'openai/gpt-oss-120b'],
    needsKey: true,
    keyUrl: 'https://deepinfra.com/dash/api_keys',
    supportsJsonMode: true,
    freeRequestsPerMinute: 20,
    freeTier: 'Paiement à l’usage ; une éventuelle offre d’essai est à vérifier.',
    dataPolicy: 'no-training',
    dataNote: "Données gardées en mémoire seulement, sans entraînement, sauf pour les modèles Google et Anthropic qu'il relaie (politique de ces éditeurs).",
    family: 'other',
    bestFor: 'Des modèles ouverts bon marché.',
    kind: 'host',
    steps: [
      { text: 'Créez un compte DeepInfra, puis une clé d’API.', link: { label: 'Aller aux clés DeepInfra', url: 'https://deepinfra.com/dash/api_keys' } },
      { text: 'Collez la clé ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'huggingface',
    label: 'Hugging Face',
    baseUrl: 'https://router.huggingface.co/v1',
    defaultModel: 'openai/gpt-oss-120b',
    suggestedModels: ['openai/gpt-oss-120b', 'openai/gpt-oss-120b:cheapest'],
    needsKey: true,
    keyUrl: 'https://huggingface.co/settings/tokens',
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 20,
    freeTier: 'Crédits à acheter (abonnement PRO : 2 $ inclus par mois), sans marge sur le prix des hébergeurs.',
    dataPolicy: 'check',
    dataNote: 'Hugging Face ne garde ni les demandes ni les réponses ; chaque hébergeur final applique sa propre politique.',
    family: 'other',
    bestFor: 'Les modèles ouverts de nombreux hébergeurs, avec votre compte Hugging Face.',
    kind: 'router',
    steps: [
      {
        text: 'Dans votre compte Hugging Face, créez un jeton d’accès (« Access Tokens ») autorisé pour « Inference Providers ».',
        link: { label: 'Aller aux jetons Hugging Face', url: 'https://huggingface.co/settings/tokens' },
      },
      { text: 'Collez le jeton ci-dessous, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'lmstudio',
    label: 'LM Studio (sur votre ordinateur)',
    study: 'Mêmes modèles que sur Ollama : sous le niveau de l’offre gratuite de Gemini sur un ordinateur doté de 24 Go de mémoire (14/10/2026).',
    baseUrl: 'http://localhost:1234/v1',
    defaultModel: '',
    suggestedModels: [],
    needsKey: false,
    supportsJsonMode: false,
    freeRequestsPerMinute: 60,
    freeTier: 'Gratuit : le moteur tourne sur votre ordinateur, avec une interface pour choisir et télécharger les modèles.',
    dataPolicy: 'local',
    dataNote: 'Vos verbatims sont traités sur cet ordinateur.',
    family: 'local',
    bestFor: 'Des données sensibles, avec une application graphique pour gérer les modèles.',
    kind: 'local',
    steps: [
      {
        text: 'Installez LM Studio, téléchargez un modèle depuis l’application et chargez-le.',
        link: { label: 'Télécharger LM Studio', url: 'https://lmstudio.ai/' },
      },
      { text: 'Dans l’onglet « Developer », démarrez le serveur et activez « Enable CORS » (sans cela, le navigateur ne peut pas l’appeler).' },
      { text: 'Indiquez le nom du modèle chargé, puis cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'custom',
    label: 'Service compatible OpenAI',
    baseUrl: '',
    defaultModel: '',
    suggestedModels: [],
    needsKey: true,
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 10,
    freeTier: 'Tout service exposant une API compatible OpenAI (LM Studio, vLLM, un relais personnel…).',
    dataPolicy: 'check',
    dataNote: 'Vérifiez la politique de données du service choisi.',
    family: 'other',
    bestFor: 'Un service compatible OpenAI que vous connaissez déjà (LM Studio, vLLM, un relais…).',
    kind: 'custom',
    steps: [{ text: "Renseignez l'adresse du service dans les réglages avancés, puis votre clé d'accès ci-dessus." }],
  },
]

export function presetById(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.id === id)
}

/** La méthode d'analyse d'une nouvelle synthèse : la méthode commune, avec le réglage de ce modèle s'il en a un. */
export function methodForModel(presetId: string, model: string): MethodId {
  const preset = presetById(presetId)
  return preset?.models?.find((m) => m.id === model)?.method ?? preset?.modelMethods?.find((x) => model.includes(x.match))?.method ?? 'commune'
}
