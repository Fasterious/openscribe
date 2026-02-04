import { NextRequest, NextResponse } from 'next/server';
import { uploadAndGetSignedUrl } from '@/lib/mistral';

export const maxDuration = 300; // 5 minutes max pour l'upload de gros fichiers

/**
 * POST /api/upload
 * Upload le fichier vers le cloud Mistral et retourne une signed URL
 * 
 * Nouveau flux simplifié (sans Supabase Storage):
 * 1. Client envoie le fichier ici
 * 2. On uploade vers Mistral Cloud
 * 3. On retourne la signed URL pour la transcription
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const allowedExtensions = ['mp3', 'wav', 'm4a', 'webm', 'ogg', 'mp4', 'flac'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file type. Supported: ${allowedExtensions.join(', ').toUpperCase()}` },
        { status: 400 }
      );
    }

    // Convertir le fichier en Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload vers Mistral Cloud et obtenir la signed URL
    const { fileId, signedUrl } = await uploadAndGetSignedUrl(buffer, file.name);

    return NextResponse.json({ 
      audioUrl: signedUrl,
      fileId,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    );
  }
}
