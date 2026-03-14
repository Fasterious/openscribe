import { NextRequest, NextResponse } from 'next/server';
import { transcribeFromUrl } from '@/lib/mistral';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  generateTranscriptionId,
  storeTranscription,
  createPreview,
} from '@/lib/transcription-cache';
import { deleteFile } from '@/lib/r2';
import { VOXTRAL_PRICE_PER_MINUTE } from '@/types';

export const maxDuration = 300; // 5 minutes max pour le timeout

/** Formate une durée en ms en "Xh Ym Zs Wms" */
function formatDurationMs(ms: number | null): string | null {
  if (ms == null) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msPart = Math.floor(ms % 1000);
  return `${h}h ${m}m ${s}s ${msPart}ms`;
}

export async function POST(request: NextRequest) {
  let fileKey: string | undefined;
  
  try {
    const body = await request.json();
    const { audioUrl, language, fileKey: fKey, metrics: clientMetrics } = body;
    fileKey = fKey; // Pour pouvoir supprimer en cas d'erreur aussi

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

    // Supprimer le fichier R2 après transcription réussie (nettoyage)
    if (fileKey) {
      try {
        await deleteFile(fileKey);
        console.log(`[R2] Deleted temporary file: ${fileKey}`);
      } catch (deleteError) {
        // Log mais ne pas faire échouer la requête si la suppression échoue
        console.warn(`[R2] Failed to delete file ${fileKey}:`, deleteError);
      }
    }

    // Enregistrer les métriques de transcription dans Supabase (analytics)
    try {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('[Metrics] SUPABASE_SERVICE_ROLE_KEY non défini, skip');
      } else {
        const forwarded = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const clientIp = forwarded?.split(',')[0]?.trim() || realIp || null;
        const source =
          clientIp === '127.0.0.1' || clientIp === '::1' ? 'local' : 'openscribe';

        const uploadDurationMs =
          clientMetrics?.uploadEndMs != null && clientMetrics?.uploadStartMs != null
            ? clientMetrics.uploadEndMs - clientMetrics.uploadStartMs
            : null;

        const metricsRow = {
          upload_duration_ms: uploadDurationMs,
          upload_duration_formatted: formatDurationMs(uploadDurationMs),
          transcription_duration_ms: transcriptionTimeMs,
          transcription_duration_formatted: formatDurationMs(transcriptionTimeMs),
          file_size_bytes: clientMetrics?.fileSizeBytes ?? null,
          audio_duration_seconds: result.audioDurationSeconds ?? null,
          client_ip: clientIp,
          source,
          user_id: user?.id ?? null,
        };
        console.log('[Metrics] Insertion...', JSON.stringify(metricsRow));

        const admin = createAdminClient();
        const { error } = await admin.from('transcription_metrics').insert(metricsRow);

        if (error) {
          console.error('[Metrics] Erreur Supabase:', error.message, error.details);
        } else {
          console.log('[Metrics] OK');
        }
      }
    } catch (metricsError) {
      console.error('[Metrics] Failed:', metricsError);
      if (metricsError instanceof Error) {
        console.error('[Metrics] Stack:', metricsError.stack);
      }
    }

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
    
    // Tenter de supprimer le fichier R2 même en cas d'erreur
    if (fileKey) {
      try {
        await deleteFile(fileKey);
        console.log(`[R2] Deleted temporary file after error: ${fileKey}`);
      } catch (deleteError) {
        console.warn(`[R2] Failed to delete file ${fileKey}:`, deleteError);
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transcribe' },
      { status: 500 }
    );
  }
}
