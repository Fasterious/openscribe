// Mistral Voxtral API Client for audio transcription

import type { TranscriptionResult, TranscriptionSegment } from '@/types';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  console.warn('Warning: MISTRAL_API_KEY is not set');
}

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/audio/transcriptions';

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

  return {
    text: response.text.trim(),
    speaker_text: speakerText,
    segments,
    detected_language: response.language,
    language: response.language,
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
  
  const response = await fetch(MISTRAL_API_URL, {
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
