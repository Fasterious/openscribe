import { NextRequest, NextResponse } from 'next/server';
import { createDownloadSignedUrl } from '@/lib/supabase';

/**
 * POST /api/upload/complete
 * Appelé après que le client a uploadé directement vers Supabase
 * Retourne l'URL de téléchargement signée pour RunPod
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: 'filePath is required' },
        { status: 400 }
      );
    }

    // Générer une URL signée pour le téléchargement (1 heure de validité)
    const audioUrl = await createDownloadSignedUrl(filePath, 3600);

    return NextResponse.json({ 
      audioUrl,
      filePath,
    });
  } catch (error) {
    console.error('Upload completion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete upload' },
      { status: 500 }
    );
  }
}
