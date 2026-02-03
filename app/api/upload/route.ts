import { NextRequest, NextResponse } from 'next/server';
import { generateFilePath, createUploadSignedUrl, createDownloadSignedUrl } from '@/lib/supabase';

/**
 * POST /api/upload
 * Retourne une URL signée pour l'upload direct vers Supabase
 * Le client uploadera directement vers Supabase (pas de limite de taille serveur)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileSize } = body;

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const allowedExtensions = ['mp3', 'wav', 'm4a', 'webm', 'ogg', 'mp4', 'flac'];
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file type. Supported: ${allowedExtensions.join(', ').toUpperCase()}` },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (fileSize && fileSize > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500MB' },
        { status: 400 }
      );
    }

    // Générer le chemin du fichier
    const filePath = generateFilePath(fileName);

    // Créer une URL signée pour l'upload
    const uploadUrl = await createUploadSignedUrl(filePath);

    return NextResponse.json({ 
      uploadUrl,
      filePath,
    });
  } catch (error) {
    console.error('Upload preparation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to prepare upload' },
      { status: 500 }
    );
  }
}
