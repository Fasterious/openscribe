import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTranscription, deleteTranscription } from '@/lib/transcription-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier si l'utilisateur est authentifié
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Récupérer la transcription complète depuis le cache
    const result = getTranscription(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Transcription not found or expired' },
        { status: 404 }
      );
    }

    // Supprimer du cache après récupération (usage unique)
    deleteTranscription(id);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error fetching transcription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transcription' },
      { status: 500 }
    );
  }
}
