/**
 * Messages d'erreur lisibles pour les appels LLM (Gemini, Mistral, etc.).
 * Détection sur le texte brut (souvent JSON imbriqué dans Error.message).
 */

export function isGeminiQuotaError(text: string): boolean {
  const t = text.toLowerCase();
  if (t.includes('generativelanguage.googleapis.com')) return true;
  if (t.includes('generate_content_free_tier')) return true;
  if (t.includes('free_tier') && t.includes('generativelanguage')) return true;
  if (t.includes('resource_exhausted') && (t.includes('generativelanguage') || t.includes('google.rpc'))) return true;
  if (t.includes('quota exceeded') && (t.includes('gemini') || t.includes('generativelanguage'))) return true;
  if (t.includes('quota exceeded') && t.includes('generatecontent')) return true;
  if (t.includes('ai.google.dev') && (t.includes('quota') || t.includes('429'))) return true;
  if ((t.includes('"code":429') || t.includes('"code": 429')) && t.includes('gemini')) return true;
  return false;
}

function isMistralHttpStatus(raw: string, status: number): boolean {
  return new RegExp(`Mistral API error \\(${status}\\)`, 'i').test(raw);
}

/** Rate limit / quota côté Mistral ou autres APIs (hors cas Gemini déjà traité). */
export function isLlmRateLimitError(raw: string): boolean {
  if (isGeminiQuotaError(raw)) return false;
  const t = raw.toLowerCase();
  if (isMistralHttpStatus(raw, 429)) return true;
  if (t.includes('rate_limit_error')) return true;
  if (t.includes('rate limit') || t.includes('rate_limit')) return true;
  if (t.includes('too many requests')) return true;
  if (t.includes('throttl')) return true;
  if (t.includes('request limit')) return true;
  if (/\b429\b/.test(raw) && t.includes('mistral')) return true;
  if (t.includes('retry later') && (t.includes('quota') || t.includes('limit'))) return true;
  return false;
}

function isLlmAuthError(raw: string): boolean {
  const t = raw.toLowerCase();
  if (isMistralHttpStatus(raw, 401) || isMistralHttpStatus(raw, 403)) return true;
  if (t.includes('invalid api key') || t.includes('invalid_api_key')) return true;
  if (t.includes('incorrect api key')) return true;
  if (t.includes('unauthorized') && (t.includes('api') || t.includes('mistral') || t.includes('google'))) return true;
  if ((t.includes('"code":401') || t.includes('"code": 401')) && t.includes('api')) return true;
  return false;
}

function isLlmServiceUnavailable(raw: string): boolean {
  const t = raw.toLowerCase();
  if (isMistralHttpStatus(raw, 502) || isMistralHttpStatus(raw, 503)) return true;
  if (t.includes('service unavailable')) return true;
  if (t.includes('overloaded') || t.includes('over capacity')) return true;
  if (t.includes('bad gateway')) return true;
  if (t.includes('temporarily unavailable')) return true;
  return false;
}

const GEMINI_QUOTA_FR =
  "L'API Google Gemini refuse la requête : la limite de quota (gratuit ou journalier) de ce modèle est dépassée ou temporairement saturée. " +
  'Attendez une minute ou deux, vérifiez vos plafonds et la facturation sur Google AI Studio, ou essayez un modèle Gemini « Flash » moins limité.';

const LLM_RATE_LIMIT_FR =
  "Le fournisseur du modèle limite temporairement les requêtes : trop d'appels en peu de temps ou quota atteint sur votre clé. " +
  'Patientez une ou deux minutes, puis vérifiez votre plan et vos limites sur la console du fournisseur (Mistral, Google AI, etc.).';

const LLM_AUTH_FR =
  "L'accès à l'API du modèle a été refusé : clé API absente, invalide ou sans les droits nécessaires. " +
  'Ouvrez les paramètres OpenScribe pour contrôler ou régénérer votre clé (Mistral ou Google Gemini).';

const LLM_UNAVAILABLE_FR =
  "Le service du modèle est momentanément indisponible ou surchargé (pannes ou maintenance côté fournisseur). " +
  'Réessayez dans quelques minutes ; si le problème continue, consultez le statut du service sur le site du fournisseur.';

/**
 * Réponse LLM inutilisable pour l'analyse (JSON incomplet, clusters absents, parse échoué).
 * Souvent : limite de sortie / modèle trop léger / trop de données en une seule requête.
 */
function isMalformedLlmAnalysisOutput(raw: string): boolean {
  const t = raw.toLowerCase();
  if (t.includes('missing clusters array')) return true;
  if (t.includes('invalid clustering response')) return true;
  if (t.includes('invalid response: missing clusters')) return true;
  if (t.includes('failed to parse clustering result')) return true;
  if (t.includes('failed to structure text')) return true;
  if (t.includes('response must be an array')) return true;
  if (t.includes('failed to parse clustering')) return true;
  return false;
}

const MALFORMED_ANALYSIS_JSON_FR =
  "L'analyse s'est arrêtée : le modèle n'a pas renvoyé le JSON attendu (liste de clusters manquante ou réponse tronquée / mal formée), ce qui arrive souvent avec une sortie trop volumineuse, beaucoup de verbatims d'un coup, ou un modèle moins fiable pour ce format. " +
  'Choisissez un modèle plus capable (ex. Gemini 3.1 Pro, Gemma 31B), réduisez le volume de réponses si possible, puis relancez l’analyse.';

function rawErrorString(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Message utilisateur + code HTTP recommandé pour les réponses API.
 */
export function interpretLlmFailure(error: unknown): { message: string; status: number } {
  const raw = rawErrorString(error);

  if (isGeminiQuotaError(raw)) {
    return { message: GEMINI_QUOTA_FR, status: 429 };
  }
  if (isLlmAuthError(raw)) {
    return { message: LLM_AUTH_FR, status: 401 };
  }
  if (isLlmRateLimitError(raw)) {
    return { message: LLM_RATE_LIMIT_FR, status: 429 };
  }
  if (isLlmServiceUnavailable(raw)) {
    return { message: LLM_UNAVAILABLE_FR, status: 503 };
  }
  if (isMalformedLlmAnalysisOutput(raw)) {
    return { message: MALFORMED_ANALYSIS_JSON_FR, status: 500 };
  }

  return {
    message: error instanceof Error ? error.message : 'Une erreur est survenue',
    status: 500,
  };
}
