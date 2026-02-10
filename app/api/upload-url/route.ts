import { NextRequest, NextResponse } from 'next/server';
import { generateUploadUrl, generateFileKey, getPublicUrl } from '@/lib/r2';

/**
 * POST /api/upload-url
 * Generate a presigned URL for direct upload to Cloudflare R2
 * 
 * Request body:
 * - fileName: string (original file name)
 * - contentType: string (MIME type, e.g., 'audio/mpeg')
 * 
 * Response:
 * - uploadUrl: string (presigned URL for PUT request)
 * - fileUrl: string (public URL to access the file after upload)
 * - fileKey: string (the key/path of the file in R2)
 */
export async function POST(request: NextRequest) {
  try {
    const { fileName, contentType } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 }
      );
    }

    // Validate file extension (same as before)
    const allowedExtensions = ['mp3', 'wav', 'm4a', 'flac', 'ogg'];
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file type. Voxtral supports: MP3, WAV, M4A, FLAC, OGG` },
        { status: 400 }
      );
    }

    // Generate unique file key
    const fileKey = generateFileKey(fileName);

    // Determine content type
    const mimeType = contentType || getMimeType(fileExtension);

    // Generate presigned upload URL (valid for 1 hour)
    const uploadUrl = await generateUploadUrl(fileKey, mimeType, 3600);

    // Get the public URL for accessing the file
    const fileUrl = getPublicUrl(fileKey);

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      fileKey,
    });
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
