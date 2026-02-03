import { NextRequest, NextResponse } from 'next/server';
import { startTranscriptionJob } from '@/lib/runpod';

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

    // Lancer le job RunPod avec l'URL
    const jobId = await startTranscriptionJob({
      audio: audioUrl,
      language: language || undefined,
    });

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start transcription' },
      { status: 500 }
    );
  }
}
