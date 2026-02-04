/**
 * Test de l'upload vers Mistral Cloud + Transcription
 * 
 * Usage: npx tsx scripts/test-mistral-cloud.ts
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { basename } from 'path';

config({ path: '.env.local' });

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  console.error('❌ MISTRAL_API_KEY manquante');
  process.exit(1);
}

const MISTRAL_BASE_URL = 'https://api.mistral.ai/v1';

// Fichier audio local à tester
const AUDIO_FILE = '~/Downloads/exemple.mp3';

async function testMistralCloudUpload(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     Test Mistral Cloud Upload + Transcription      ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const fileName = basename(AUDIO_FILE);
  
  // Étape 1: Lire le fichier
  console.log(`📁 Fichier: ${fileName}`);
  const audioBuffer = readFileSync(AUDIO_FILE);
  console.log(`   Taille: ${(audioBuffer.length / 1024).toFixed(1)} KB\n`);

  // Étape 2: Upload vers Mistral Cloud
  console.log('☁️  Étape 1: Upload vers Mistral Cloud...');
  const uploadStartTime = Date.now();

  const uploadFormData = new FormData();
  const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  uploadFormData.append('file', blob, fileName);
  uploadFormData.append('purpose', 'audio');

  const uploadResponse = await fetch(`${MISTRAL_BASE_URL}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: uploadFormData,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Upload failed: ${error}`);
  }

  const uploadResult = await uploadResponse.json();
  const fileId = uploadResult.id;
  const uploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
  
  console.log(`   ✅ Upload réussi en ${uploadDuration}s`);
  console.log(`   📄 File ID: ${fileId}\n`);

  // Étape 3: Obtenir la signed URL
  console.log('🔗 Étape 2: Obtention de la signed URL...');

  const signedUrlResponse = await fetch(`${MISTRAL_BASE_URL}/files/${fileId}/url?expiry=24`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      'Accept': 'application/json',
    },
  });

  if (!signedUrlResponse.ok) {
    const error = await signedUrlResponse.text();
    throw new Error(`Failed to get signed URL: ${error}`);
  }

  const signedUrlResult = await signedUrlResponse.json();
  const signedUrl = signedUrlResult.url;
  
  console.log(`   ✅ Signed URL obtenue`);
  console.log(`   🔗 URL: ${signedUrl.substring(0, 80)}...\n`);

  // Étape 4: Transcription avec la signed URL
  console.log('🎤 Étape 3: Transcription via signed URL...');
  const transcriptionStartTime = Date.now();

  const transcriptionFormData = new FormData();
  transcriptionFormData.append('model', 'voxtral-mini-latest');
  transcriptionFormData.append('file_url', signedUrl);
  transcriptionFormData.append('diarize', 'true');
  transcriptionFormData.append('timestamp_granularities[]', 'segment');

  const transcriptionResponse = await fetch(`${MISTRAL_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: transcriptionFormData,
  });

  if (!transcriptionResponse.ok) {
    const error = await transcriptionResponse.text();
    throw new Error(`Transcription failed: ${error}`);
  }

  const transcriptionResult = await transcriptionResponse.json();
  const transcriptionDuration = ((Date.now() - transcriptionStartTime) / 1000).toFixed(2);

  console.log(`   ✅ Transcription réussie en ${transcriptionDuration}s\n`);

  // Afficher les résultats
  console.log('📝 Résultat:');
  console.log('─'.repeat(60));
  console.log(transcriptionResult.text.substring(0, 500) + '...');
  console.log('─'.repeat(60));

  if (transcriptionResult.segments) {
    const speakers = new Set(transcriptionResult.segments.map((s: { speaker_id?: string }) => s.speaker_id).filter(Boolean));
    console.log(`\n👥 Speakers détectés: ${speakers.size > 0 ? Array.from(speakers).join(', ') : 'Aucun'}`);
    console.log(`📊 Segments: ${transcriptionResult.segments.length}`);
  }

  const totalDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
  console.log(`\n✨ Flux complet terminé en ${totalDuration}s`);
  console.log('\n📋 Résumé du flux Mistral Cloud:');
  console.log('   1. Upload fichier vers Mistral Cloud ✅');
  console.log('   2. Obtention signed URL ✅');
  console.log('   3. Transcription via signed URL ✅');
}

testMistralCloudUpload().catch((error) => {
  console.error('\n❌ Erreur:', error instanceof Error ? error.message : error);
  process.exit(1);
});
