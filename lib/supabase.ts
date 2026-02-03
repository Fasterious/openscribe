import { createClient } from '@supabase/supabase-js';

// Variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client public (pour le frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client admin (pour le backend - avec plus de permissions)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase;

// Nom du bucket pour les fichiers audio
export const AUDIO_BUCKET = 'audio';

/**
 * Génère un chemin unique pour un fichier
 */
export function generateFilePath(fileName: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = fileName.split('.').pop() || 'mp3';
  return `uploads/${timestamp}-${randomId}.${extension}`;
}

/**
 * Crée une URL signée pour l'upload direct depuis le client
 * Cela permet de contourner la limite de taille du serveur Next.js
 */
export async function createUploadSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(AUDIO_BUCKET)
    .createSignedUploadUrl(filePath);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create upload URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Génère une URL signée pour télécharger/accéder au fichier
 */
export async function createDownloadSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(filePath, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create download URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Upload un fichier audio vers Supabase Storage (méthode serveur)
 * Pour les petits fichiers uniquement (< 50MB par défaut)
 */
export async function uploadAudioFile(
  fileBuffer: Buffer, 
  fileName: string,
  contentType: string
): Promise<{ url: string; path: string }> {
  const filePath = generateFilePath(fileName);

  // Upload vers Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(AUDIO_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  // Générer une URL signée (valide 1 heure)
  const url = await createDownloadSignedUrl(filePath);

  return {
    url,
    path: filePath,
  };
}

/**
 * Supprimer un fichier audio de Supabase Storage
 */
export async function deleteAudioFile(filePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(AUDIO_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error(`Failed to delete file: ${error.message}`);
  }
}
