import type { TranscriptionResult } from '@/types';

// Cache en mémoire pour stocker les transcriptions complètes
// En production, utiliser Redis ou Supabase
const transcriptionCache = new Map<string, {
  result: TranscriptionResult;
  createdAt: number;
}>();

// Durée de vie du cache : 1 heure
const CACHE_TTL_MS = 60 * 60 * 1000;

// Nettoyer les entrées expirées toutes les 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of transcriptionCache.entries()) {
    if (now - entry.createdAt > CACHE_TTL_MS) {
      transcriptionCache.delete(id);
    }
  }
}, 10 * 60 * 1000);

/**
 * Génère un ID unique pour la transcription
 */
export function generateTranscriptionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Stocke une transcription complète dans le cache
 */
export function storeTranscription(id: string, result: TranscriptionResult): void {
  transcriptionCache.set(id, {
    result,
    createdAt: Date.now(),
  });
}

/**
 * Récupère une transcription complète depuis le cache
 */
export function getTranscription(id: string): TranscriptionResult | null {
  const entry = transcriptionCache.get(id);
  if (!entry) return null;
  
  // Vérifier si l'entrée a expiré
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    transcriptionCache.delete(id);
    return null;
  }
  
  return entry.result;
}

/**
 * Supprime une transcription du cache
 */
export function deleteTranscription(id: string): void {
  transcriptionCache.delete(id);
}

import { PREVIEW_PERCENTAGE } from '@/types';

/**
 * Crée un aperçu limité de la transcription
 */
export function createPreview(result: TranscriptionResult): TranscriptionResult {
  const preview: TranscriptionResult = {
    ...result,
    // Tronquer le texte
    text: truncateText(result.text, PREVIEW_PERCENTAGE),
    // Tronquer le speaker_text
    speaker_text: result.speaker_text 
      ? truncateText(result.speaker_text, PREVIEW_PERCENTAGE)
      : undefined,
    // Limiter les segments
    segments: result.segments
      ? result.segments.slice(0, Math.max(1, Math.ceil(result.segments.length * PREVIEW_PERCENTAGE)))
      : undefined,
    // Supprimer les word_segments pour l'aperçu
    word_segments: undefined,
  };
  
  return preview;
}

function truncateText(text: string, percentage: number): string {
  const words = text.split(' ');
  const previewWords = Math.max(10, Math.ceil(words.length * percentage));
  const truncated = words.slice(0, previewWords).join(' ');
  
  if (previewWords < words.length) {
    return truncated + '...';
  }
  return truncated;
}
