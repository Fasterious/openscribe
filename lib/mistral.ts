// Mistral Voxtral API Client for audio transcription

import type { TranscriptionResult, TranscriptionSegment } from '@/types';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  console.warn('Warning: MISTRAL_API_KEY is not set');
}

const MISTRAL_BASE_URL = 'https://api.mistral.ai/v1';
const MISTRAL_TRANSCRIPTION_URL = `${MISTRAL_BASE_URL}/audio/transcriptions`;
const MISTRAL_FILES_URL = `${MISTRAL_BASE_URL}/files`;

// ============================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,  // 1 seconde
  maxDelayMs: 8000,      // 8 secondes max
  retryableStatuses: [429, 503, 502, 500],  // Rate limit, Service unavailable, Bad gateway, Server error
};

/**
 * Attend un délai donné
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Effectue une requête fetch avec retry automatique et backoff exponentiel
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> {
  let lastError: Error | null = null;
  let delay = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Si succès ou erreur non-retryable, retourner directement
      if (response.ok || !config.retryableStatuses.includes(response.status)) {
        return response;
      }

      // Erreur retryable - on va réessayer
      const statusText = response.status === 429 
        ? 'Rate limit exceeded' 
        : `Server error (${response.status})`;
      
      console.warn(`[Mistral API] ${statusText}, attempt ${attempt + 1}/${config.maxRetries + 1}, retrying in ${delay}ms...`);
      
      // Si c'est la dernière tentative, retourner la réponse d'erreur
      if (attempt === config.maxRetries) {
        return response;
      }

      // Attendre avant de réessayer
      await sleep(delay);
      
      // Backoff exponentiel avec jitter
      delay = Math.min(delay * 2 + Math.random() * 500, config.maxDelayMs);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Erreur réseau - réessayer si pas la dernière tentative
      if (attempt === config.maxRetries) {
        throw lastError;
      }
      
      console.warn(`[Mistral API] Network error, attempt ${attempt + 1}/${config.maxRetries + 1}, retrying in ${delay}ms...`);
      await sleep(delay);
      delay = Math.min(delay * 2 + Math.random() * 500, config.maxDelayMs);
    }
  }

  // Ne devrait jamais arriver, mais TypeScript veut un retour
  throw lastError || new Error('Max retries exceeded');
}

// ============================================
// MISTRAL CLOUD FILE STORAGE
// ============================================

interface MistralFileUploadResponse {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

interface MistralSignedUrlResponse {
  url: string;
  expires_at?: number;
}

/**
 * Upload un fichier audio vers le cloud Mistral
 * @returns L'ID du fichier uploadé
 */
export async function uploadToMistralCloud(
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  if (!MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is not configured');
  }

  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: 'audio/mpeg' });
  formData.append('file', blob, fileName);
  formData.append('purpose', 'audio');

  const response = await fetchWithRetry(MISTRAL_FILES_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload to Mistral cloud: ${error}`);
  }

  const result: MistralFileUploadResponse = await response.json();
  return result.id;
}

/**
 * Obtient une signed URL pour un fichier uploadé sur le cloud Mistral
 * @param fileId - L'ID du fichier retourné par uploadToMistralCloud
 * @param expiryHours - Durée de validité de l'URL (défaut: 24h)
 */
export async function getMistralSignedUrl(
  fileId: string,
  expiryHours: number = 24
): Promise<string> {
  if (!MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is not configured');
  }

  const response = await fetchWithRetry(`${MISTRAL_FILES_URL}/${fileId}/url?expiry=${expiryHours}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get signed URL: ${error}`);
  }

  const result: MistralSignedUrlResponse = await response.json();
  return result.url;
}

/**
 * Upload un fichier et retourne directement la signed URL
 * Combine uploadToMistralCloud + getMistralSignedUrl
 */
export async function uploadAndGetSignedUrl(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ fileId: string; signedUrl: string }> {
  const fileId = await uploadToMistralCloud(fileBuffer, fileName);
  const signedUrl = await getMistralSignedUrl(fileId);
  return { fileId, signedUrl };
}

// ============================================
// TRANSCRIPTION
// ============================================

export interface MistralTranscriptionInput {
  audioUrl?: string;        // URL publique de l'audio
  audioBuffer?: Buffer;     // Buffer du fichier audio (pour upload direct)
  audioFileName?: string;   // Nom du fichier (requis si audioBuffer)
  language?: string;        // Code langue (ex: "en", "fr")
  diarize?: boolean;        // Activer la diarization (identification des speakers)
}

// Structure de la réponse Mistral
interface MistralSegment {
  text: string;
  start: number;
  end: number;
  speaker_id?: string;
}

interface MistralTranscriptionResponse {
  model: string;
  text: string;
  language?: string;
  segments?: MistralSegment[];
  usage?: {
    prompt_audio_seconds: number;
    prompt_tokens: number;
    total_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Convertit la réponse Mistral vers le format TranscriptionResult unifié
 */
function convertMistralResponse(response: MistralTranscriptionResponse): TranscriptionResult {
  // Convertir les segments Mistral vers notre format unifié
  const segments: TranscriptionSegment[] = response.segments?.map(seg => ({
    start: seg.start,
    end: seg.end,
    text: seg.text.trim(),
    speaker: seg.speaker_id || undefined,
  })) || [];

  // Générer le texte avec speakers si diarization activée
  let speakerText: string | undefined;
  if (segments.some(s => s.speaker)) {
    speakerText = segments
      .map(seg => `[${seg.speaker}] ${seg.text}`)
      .join('\n');
  }

  // Durée audio depuis les métadonnées d'usage
  const audioDurationSeconds = response.usage?.prompt_audio_seconds;

  return {
    text: response.text.trim(),
    speaker_text: speakerText,
    segments,
    detected_language: response.language,
    language: response.language,
    audioDurationSeconds,
  };
}

/**
 * Transcrit un fichier audio via l'API Voxtral (Mistral)
 * 
 * @param input - Options de transcription (URL ou Buffer)
 * @returns Résultat de transcription au format unifié
 */
export async function transcribe(input: MistralTranscriptionInput): Promise<TranscriptionResult> {
  if (!MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is not configured');
  }

  if (!input.audioUrl && !input.audioBuffer) {
    throw new Error('Either audioUrl or audioBuffer must be provided');
  }

  const formData = new FormData();
  formData.append('model', 'voxtral-mini-latest');

  // Ajouter l'audio (URL ou fichier)
  if (input.audioUrl) {
    formData.append('file_url', input.audioUrl);
  } else if (input.audioBuffer) {
    const blob = new Blob([input.audioBuffer], { type: 'audio/mpeg' });
    formData.append('file', blob, input.audioFileName || 'audio.mp3');
  }

  // Diarization (avec timestamps segment requis)
  if (input.diarize !== false) {
    formData.append('diarize', 'true');
    formData.append('timestamp_granularities[]', 'segment');
  } else {
    // Sans diarization, on peut quand même avoir les timestamps
    formData.append('timestamp_granularities[]', 'segment');
  }

  // Langue (optionnel - sinon détection automatique)
  // Note: language n'est pas compatible avec timestamp_granularities selon la doc
  // On laisse la détection automatique pour avoir les timestamps
  
  const response = await fetchWithRetry(MISTRAL_TRANSCRIPTION_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Mistral API error: ${response.status}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.message) {
        errorMessage = typeof errorJson.message === 'string' 
          ? errorJson.message 
          : JSON.stringify(errorJson.message);
      }
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  const result: MistralTranscriptionResponse = await response.json();
  return convertMistralResponse(result);
}

/**
 * Transcrit un fichier audio depuis une URL
 * Raccourci pour transcribe({ audioUrl })
 */
export async function transcribeFromUrl(
  audioUrl: string, 
  options?: { diarize?: boolean; language?: string }
): Promise<TranscriptionResult> {
  return transcribe({
    audioUrl,
    diarize: options?.diarize ?? true,
    language: options?.language,
  });
}

/**
 * Transcrit un fichier audio depuis un Buffer
 * Raccourci pour transcribe({ audioBuffer })
 */
export async function transcribeFromBuffer(
  audioBuffer: Buffer,
  fileName: string,
  options?: { diarize?: boolean; language?: string }
): Promise<TranscriptionResult> {
  return transcribe({
    audioBuffer,
    audioFileName: fileName,
    diarize: options?.diarize ?? true,
    language: options?.language,
  });
}
