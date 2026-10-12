/**
 * Registre des fournisseurs de moteurs d'IA.
 *
 * Ces informations changent souvent (offres gratuites, modèles, politiques de
 * données). Elles sont regroupées ici pour être mises à jour sans toucher au
 * reste du code. Les mentions sur les données reprennent ce que les
 * fournisseurs publient ; en cas de doute, la fiche invite à vérifier.
 */

export type DataPolicy = 'local' | 'no-training' | 'may-train-free' | 'check'

export interface ProviderPreset {
  id: string
  label: string
  baseUrl: string
  /** Modèle proposé par défaut. Préférez un identifiant de version daté. */
  defaultModel: string
  suggestedModels: string[]
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
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'mistral',
    label: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-small-latest',
    suggestedModels: ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'],
    needsKey: true,
    keyUrl: 'https://console.mistral.ai/api-keys',
    seedParam: 'random_seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 2,
    freeTier: 'Offre « Experiment » gratuite, sans carte bancaire (vérification par téléphone), débit très limité.',
    dataPolicy: 'may-train-free',
    dataNote:
      "Sur l'offre gratuite, vos données peuvent servir à améliorer les modèles, sauf si vous le refusez dans votre espace client chez Mistral. Hébergement en Europe.",
  },
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'openai/gpt-oss-120b',
    suggestedModels: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile'],
    needsKey: true,
    keyUrl: 'https://console.groq.com/keys',
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 20,
    freeTier: 'Offre gratuite sans carte bancaire, limitée en nombre de demandes par jour.',
    dataPolicy: 'check',
    dataNote: "Vérifiez la politique de données de l'offre gratuite avant d'y envoyer des données de participants.",
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    suggestedModels: ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro'],
    needsKey: true,
    keyUrl: 'https://aistudio.google.com/apikey',
    seedParam: 'seed',
    supportsJsonMode: true,
    freeRequestsPerMinute: 10,
    freeTier: 'Offre gratuite sans carte bancaire sur les modèles Flash.',
    dataPolicy: 'may-train-free',
    dataNote:
      "Sur l'offre gratuite, vos contenus peuvent être utilisés par Google et relus par des humains. À éviter pour des données de participants sans leur accord.",
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
    dataNote: "Rien ne quitte votre ordinateur. Ollama doit autoriser l'origine de cette page (variable OLLAMA_ORIGINS).",
  },
  {
    id: 'custom',
    label: 'Autre (compatible OpenAI)',
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
  },
]

export function presetById(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.id === id)
}
