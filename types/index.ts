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
}

export type TranscriptionStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface TranscriptionState {
  status: TranscriptionStatus;
  progress: number;
  result: TranscriptionResult | null;
  error: string | null;
}
