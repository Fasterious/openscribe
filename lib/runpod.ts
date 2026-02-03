// RunPod API Client for WhisperX transcription

import type { RunPodJobStatus, TranscriptionResult } from '@/types';

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID;

if (!RUNPOD_API_KEY) {
  console.warn('Warning: RUNPOD_API_KEY is not set');
}

if (!RUNPOD_ENDPOINT_ID) {
  console.warn('Warning: RUNPOD_ENDPOINT_ID is not set');
}

const RUNPOD_BASE_URL = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}`;

interface RunPodInput {
  audio: string; // URL de l'audio (comme dans le script Python)
  language?: string;
  diarize?: boolean;
  min_speakers?: number;
  max_speakers?: number;
}

interface RunPodRunResponse {
  id: string;
  status: string;
}

// Structure de la réponse brute de RunPod
interface RunPodRawOutput {
  output?: TranscriptionResult; // Les données sont imbriquées dans output.output
  status?: string;
}

interface RunPodStatusResponse {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  output?: RunPodRawOutput; // output contient { output: {...}, status: "success" }
  error?: string;
}

/**
 * Lance un job de transcription sur RunPod
 */
export async function startTranscriptionJob(input: RunPodInput): Promise<string> {
  if (!RUNPOD_API_KEY || !RUNPOD_ENDPOINT_ID) {
    throw new Error('RunPod configuration is missing');
  }

  const response = await fetch(`${RUNPOD_BASE_URL}/run`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RUNPOD_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to start transcription job: ${error}`);
  }

  const data: RunPodRunResponse = await response.json();
  return data.id;
}

/**
 * Vérifie le statut d'un job RunPod
 * Note: La réponse RunPod a une structure imbriquée: output.output contient les vraies données
 */
export async function getJobStatus(jobId: string): Promise<RunPodJobStatus> {
  if (!RUNPOD_API_KEY || !RUNPOD_ENDPOINT_ID) {
    throw new Error('RunPod configuration is missing');
  }

  const response = await fetch(`${RUNPOD_BASE_URL}/status/${jobId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${RUNPOD_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get job status: ${error}`);
  }

  const data: RunPodStatusResponse = await response.json();
  
  // Extraire les données imbriquées: output.output contient les vraies données de transcription
  let transcriptionOutput: TranscriptionResult | undefined;
  
  if (data.output) {
    // Structure: { output: { output: { text, segments, ... }, status: "success" } }
    if (data.output.output) {
      transcriptionOutput = data.output.output;
    } else if ('text' in data.output) {
      // Fallback si la structure est directe (sans double imbrication)
      transcriptionOutput = data.output as unknown as TranscriptionResult;
    }
  }

  return {
    id: data.id,
    status: data.status,
    output: transcriptionOutput,
    error: data.error,
  };
}

/**
 * Lance un job et attend la complétion (synchrone)
 * Utile pour les petits fichiers ou quand on veut une réponse immédiate
 */
export async function transcribeSync(input: RunPodInput): Promise<TranscriptionResult> {
  if (!RUNPOD_API_KEY || !RUNPOD_ENDPOINT_ID) {
    throw new Error('RunPod configuration is missing');
  }

  const response = await fetch(`${RUNPOD_BASE_URL}/runsync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RUNPOD_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to transcribe: ${error}`);
  }

  const data = await response.json();
  
  if (data.status === 'FAILED') {
    throw new Error(data.error || 'Transcription failed');
  }

  return data.output as TranscriptionResult;
}

/**
 * Annule un job en cours
 */
export async function cancelJob(jobId: string): Promise<void> {
  if (!RUNPOD_API_KEY || !RUNPOD_ENDPOINT_ID) {
    throw new Error('RunPod configuration is missing');
  }

  const response = await fetch(`${RUNPOD_BASE_URL}/cancel/${jobId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RUNPOD_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to cancel job: ${error}`);
  }
}
