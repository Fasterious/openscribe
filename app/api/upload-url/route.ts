import { NextRequest, NextResponse } from 'next/server';
import { generateUploadUrl, generateFileKey, getPublicUrl } from '@/lib/r2';
import { createClient } from '@/lib/supabase/server';
import { getUserApiKey } from '@/lib/user-api-keys';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_DISPLAY } from '@/types';

// Une présignature ne sert que quelques minutes : le client uploade dans la foulée.
// Une heure laissait une fenêtre d'écriture inutilement large sur le bucket.
const UPLOAD_URL_TTL_SECONDS = 600;

/**
 * POST /api/upload-url
 * Génère une URL présignée pour uploader directement vers Cloudflare R2.
 *
 * Authentification obligatoire : cette route donne un droit d'écriture sur le
 * bucket de l'hébergeur. Elle exige en plus une clé Mistral configurée, car un
 * upload qui ne pourra jamais être transcrit n'a aucune raison d'être stocké.
 *
 * Body :
 * - fileName: string
 * - contentType: string (MIME, ex. 'audio/mpeg')
 * - fileSize: number (octets, déclaré par le client)
 *
 * Réponse : { uploadUrl, fileUrl, fileKey }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Garde économique : pas de stockage pour qui ne peut pas transcrire.
    try {
      await getUserApiKey(user.id, 'mistral');
    } catch {
      return NextResponse.json(
        { error: 'Clé API Mistral non configurée. Rendez-vous dans les paramètres pour la configurer.' },
        { status: 403 }
      );
    }

    const { fileName, contentType, fileSize } = await request.json();

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    const allowedExtensions = ['mp3', 'wav', 'm4a', 'flac', 'ogg'];
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Invalid file type. Voxtral supports: MP3, WAV, M4A, FLAC, OGG' },
        { status: 400 }
      );
    }

    // Taille déclarée par le client. C'est une garde de premier niveau, pas une
    // preuve : un PUT présigné accepte n'importe quel volume tant que
    // content-length n'est pas un en-tête signé (cf. lib/r2.ts).
    if (typeof fileSize !== 'number' || !Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json({ error: 'fileSize is required' }, { status: 400 });
    }
    if (fileSize > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `Fichier trop volumineux. Maximum : ${MAX_UPLOAD_DISPLAY}.` },
        { status: 413 }
      );
    }

    const fileKey = generateFileKey(fileName);
    const mimeType = contentType || getMimeType(fileExtension);
    const uploadUrl = await generateUploadUrl(fileKey, mimeType, UPLOAD_URL_TTL_SECONDS);
    const fileUrl = getPublicUrl(fileKey);

    return NextResponse.json({ uploadUrl, fileUrl, fileKey });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    ogg: 'audio/ogg',
  };

  return mimeTypes[extension] || 'audio/mpeg';
}
