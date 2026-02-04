import { NextRequest, NextResponse } from 'next/server';
import { transcribeFromUrl } from '@/lib/mistral';

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

    // Transcription synchrone via Voxtral (Mistral)
    // Retourne directement le résultat (pas de polling nécessaire)
    const result = await transcribeFromUrl(audioUrl, {
      diarize: true,
      language: language || undefined,
    });

    // Retourne le résultat directement
    // Format compatible avec l'ancien système (result au lieu de jobId)
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transcribe' },
      { status: 500 }
    );
  }
}
