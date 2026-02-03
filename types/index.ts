// Types pour OpenScribe

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
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
  language?: string; // Alias pour detected_language (format RunPod)
}

export interface RunPodJobStatus {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  output?: TranscriptionResult;
  error?: string;
}

export type TranscriptionStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface TranscriptionState {
  status: TranscriptionStatus;
  progress: number;
  result: TranscriptionResult | null;
  error: string | null;
  jobId: string | null;
}
