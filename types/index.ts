// Types pour OpenScribe

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;      // Format unifié (converti depuis speaker_id)
  speaker_id?: string;   // Format brut Mistral API
}

export interface WordSegment {
  word: string;
  start: number;
  end: number;
  score?: number;
  speaker?: string;
}

export interface TranscriptionResult {
  text: string;
  speaker_text?: string;
  segments?: TranscriptionSegment[];
  word_segments?: WordSegment[];
  detected_language?: string;
  language?: string;
  /** Choix utilisateur avant envoi : code ISO Voxtral ou 'auto' (détection automatique) */
  transcriptionLanguageRequest?: 'auto' | string;
  // Métriques
  audioDurationSeconds?: number;    // Durée totale de l'audio en secondes
  transcriptionTimeMs?: number;     // Temps de transcription en millisecondes
  cost?: number;                    // Coût estimé en USD
}

// Prix Voxtral par minute d'audio (en USD)
export const VOXTRAL_PRICE_PER_MINUTE = 0.003;

// Taille maximale d'un upload audio (1 Go — limite Mistral et Cloudflare R2).
// Partagée par le client (upload-zone) et le serveur (/api/upload-url) pour
// qu'ils ne puissent pas diverger.
export const MAX_UPLOAD_BYTES = 1 * 1024 * 1024 * 1024;
export const MAX_UPLOAD_DISPLAY = '1 GB';

// Pourcentage de contenu visible dans l'aperçu (utilisateurs non authentifiés)
export const PREVIEW_PERCENTAGE = 0.3;

export type TranscriptionStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface TranscriptionState {
  status: TranscriptionStatus;
  progress: number;
  result: TranscriptionResult | null;
  error: string | null;
}
