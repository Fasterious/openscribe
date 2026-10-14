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
export interface ModelChoice {
  id: string
  /** Nom lisible. */
  label: string
  /** Pourquoi le choisir, en une phrase. */
  hint: string
  /** Partie de la liste (ex. « Inclus dans l'offre gratuite »). */
  section?: string
  recommended?: boolean
  /** Méthode d'analyse propre à ce modèle (voir src/core/analysis/methods.ts) ; à défaut, la référence. */
  method?: MethodId
  /** Paramètres propres au modèle, ajoutés à chaque demande. */
  extraBody?: Record<string, unknown>
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
        method: 'ministral',
      },
      { id: 'ministral-8b-2512', label: 'Ministral 8B', hint: 'Plus rapide, des idées moins fines.', section: "Inclus dans l'offre gratuite", method: 'ministral' },
      { id: 'ministral-3b-2512', label: 'Ministral 3B', hint: 'Très rapide, pour un essai seulement.', section: "Inclus dans l'offre gratuite", method: 'ministral' },
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
    ],
    needsKey: true,
    keyUrl: 'https://admin.mistral.ai/organization/api-keys',
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
        method: 'groq',
        // Sa réflexion consomme la réponse : courte, pour laisser place au JSON.
        extraBody: { reasoning_effort: 'low' },
      },
      { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B', hint: 'Bon en français, mêmes limites.', section: "Inclus dans l'offre gratuite", method: 'groq' },
      {
        id: 'openai/gpt-oss-20b',
        label: 'GPT-OSS 20B',
        hint: 'Plus rapide, moins fin.',
        section: "Inclus dans l'offre gratuite",
        method: 'groq',
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
        method: 'gemini',
      },
      {
        id: 'gemini-3.1-flash-lite',
        label: 'Gemini 3.1 Flash-Lite',
        hint: 'Plus ancien, mêmes limites.',
        section: "Inclus dans l'offre gratuite",
        method: 'gemini',
      },
      {
        id: 'gemini-3.8-flash',
        label: 'Gemini 3.8 Flash',
        hint: 'Plus fin, mais 20 demandes par jour en gratuit : une synthèse n’y tient pas.',
        section: 'Avec la facturation activée',
        method: 'gemini',
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
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'qwen3:8b',
    suggestedModels: ['qwen3:8b', 'mistral-small3.2', 'gemma3:12b'],
    needsKey: false,
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
        text: "Sur Mac, ouvrez le Terminal (sur Windows, l'invite de commandes) et téléchargez un modèle (environ 5 Go, une seule fois) :",
        code: 'ollama pull qwen3:8b',
      },
      { text: 'Revenez ici : OpenScribe détecte Ollama et ses modèles tout seul. Cliquez sur « Enregistrer et tester ».' },
    ],
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-5-5',
    suggestedModels: ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5'],
    needsKey: true,
    keyUrl: 'https://platform.claude.com/settings/keys',
    supportsJsonMode: false,
    freeRequestsPerMinute: 20,
    freeTier: 'Payant, sans offre gratuite durable : crédit prépayé, avec un plafond de dépenses réglable.',
    dataPolicy: 'no-training',
    dataNote: "Les appels à l'API ne servent pas à entraîner les modèles ; ils sont supprimés sous 30 jours par défaut.",
    family: 'other',
    bestFor: 'Une rédaction et une analyse de longs textes de grande qualité, pour un rapport à diffuser.',
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

/** La méthode d'analyse à suivre pour ce modèle : la sienne si elle existe, sinon la référence. */
export function methodForModel(presetId: string, model: string): MethodId {
  return presetById(presetId)?.models?.find((m) => m.id === model)?.method ?? 'reference'
}
