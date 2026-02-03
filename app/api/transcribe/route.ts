import { NextRequest, NextResponse } from 'next/server';
import { startTranscriptionJob, getJobStatus } from '@/lib/runpod';

export const maxDuration = 300; // 5 minutes max pour le timeout

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const language = formData.get('language') as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4', 'audio/x-m4a', 'audio/webm', 'audio/ogg'];
    if (!allowedTypes.some(type => audioFile.type.includes(type.split('/')[1]))) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: MP3, WAV, M4A, WebM, OGG' },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB' },
        { status: 400 }
      );
    }

    // Convertir le fichier en base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Lancer le job RunPod
    const jobId = await startTranscriptionJob({
      audio_base64: base64,
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
