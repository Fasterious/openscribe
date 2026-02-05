import { NextRequest, NextResponse } from 'next/server';
import { transcribeFromUrl } from '@/lib/mistral';
import { createClient } from '@/lib/supabase/server';
import { 
  generateTranscriptionId, 
  storeTranscription, 
  createPreview 
} from '@/lib/transcription-cache';
import { VOXTRAL_PRICE_PER_MINUTE } from '@/types';

export const maxDuration = 300; // 5 minutes max pour le timeout

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioUrl, language } = body;

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'audioUrl is required' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur est authentifié
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAuthenticated = !!user;

    // Mesurer le temps de transcription
    const startTime = Date.now();

    // Transcription synchrone via Voxtral (Mistral)
    const result = await transcribeFromUrl(audioUrl, {
      diarize: true,
      language: language || undefined,
    });

    const transcriptionTimeMs = Date.now() - startTime;

    // Calculer le coût estimé
    const audioDurationMinutes = (result.audioDurationSeconds || 0) / 60;
    const cost = audioDurationMinutes * VOXTRAL_PRICE_PER_MINUTE;

    // Ajouter les métriques au résultat
    const enrichedResult = {
      ...result,
      transcriptionTimeMs,
      cost: Math.round(cost * 10000) / 10000, // 4 décimales
    };

    // Si authentifié, retourner le résultat complet
    if (isAuthenticated) {
      return NextResponse.json({ 
        result: enrichedResult,
        isPreview: false,
      });
    }

    // Si non authentifié, stocker le résultat complet et retourner l'aperçu
    const transcriptionId = generateTranscriptionId();
    storeTranscription(transcriptionId, enrichedResult);

    const previewResult = createPreview(enrichedResult);

    return NextResponse.json({ 
      result: previewResult,
      transcriptionId,
      isPreview: true,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transcribe' },
      { status: 500 }
    );
  }
}
