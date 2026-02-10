// Cloudflare R2 Client (S3-compatible)
// Used for temporary audio file storage before transcription

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'openscribe-audio';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional: custom domain or R2.dev URL

// Validate configuration
function validateConfig() {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 configuration missing. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.');
  }
}

// Create S3 client configured for Cloudflare R2
function createR2Client(): S3Client {
  validateConfig();
  
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Generate a presigned URL for uploading a file directly to R2
 * @param fileKey - The key (path) for the file in the bucket
 * @param contentType - The MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL for PUT request
 */
export async function generateUploadUrl(
  fileKey: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = createR2Client();
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });
  
  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Get the public URL for a file in R2
 * @param fileKey - The key (path) for the file in the bucket
 * @returns Public URL for the file
 */
export function getPublicUrl(fileKey: string): string {
  // Use custom domain if configured, otherwise use R2.dev URL
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${fileKey}`;
  }
  
  // Default R2.dev URL (requires public bucket access enabled)
  return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.dev/${fileKey}`;
}

/**
 * Delete a file from R2 (used after transcription is complete)
 * @param fileKey - The key (path) for the file to delete
 */
export async function deleteFile(fileKey: string): Promise<void> {
  const client = createR2Client();
  
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
  });
  
  await client.send(command);
}

/**
 * Generate a unique file key for audio uploads
 * @param originalFileName - The original file name
 * @returns A unique file key with timestamp and random suffix
 */
export function generateFileKey(originalFileName: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = originalFileName.split('.').pop()?.toLowerCase() || 'mp3';
  
  return `audio/${timestamp}-${randomSuffix}.${extension}`;
}

/**
 * Extract file key from a public R2 URL
 * @param url - The public URL of the file
 * @returns The file key, or null if not a valid R2 URL
 */
export function extractFileKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Handle custom domain
    if (R2_PUBLIC_URL && url.startsWith(R2_PUBLIC_URL)) {
      return urlObj.pathname.slice(1); // Remove leading slash
    }
    
    // Handle R2.dev URL
    if (urlObj.hostname.includes('.r2.dev')) {
      return urlObj.pathname.slice(1); // Remove leading slash
    }
    
    return null;
  } catch {
    return null;
  }
}
