/**
 * POC - Test Voxtral avec fichier audio local
 * 
 * Usage: npx tsx scripts/test-voxtral-local.ts
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

// Fichier audio local à tester
const AUDIO_FILE = '~/Downloads/exemple.mp3';

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker_id?: string;  // Correct field name from Mistral API
}

interface TranscriptionResponse {
  text: string;
  segments?: TranscriptionSegment[];
}

async function testLocalFile(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   Test Voxtral - Fichier Local avec Diarization    ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const fileName = basename(AUDIO_FILE);
  console.log(`📁 Fichier: ${fileName}`);
  
  // Lire et encoder le fichier en base64
  console.log('📦 Encodage en base64...');
  const audioBuffer = readFileSync(AUDIO_FILE);
  const audioBase64 = audioBuffer.toString('base64');
  console.log(`   Taille: ${(audioBuffer.length / 1024).toFixed(1)} KB\n`);

  // Créer un Blob pour le FormData
  const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

  const formData = new FormData();
  formData.append('model', 'voxtral-mini-latest');
  formData.append('file', audioBlob, fileName);
  formData.append('diarize', 'true');
  formData.append('timestamp_granularities[]', 'segment');  // segment + diarization (recommended for UX Research)

  console.log('🚀 Envoi à l\'API Voxtral...\n');
  const startTime = Date.now();

  const response = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: formData,
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const result: TranscriptionResponse = await response.json();
  
  console.log(`✅ Transcription réussie en ${duration}s!\n`);
  
  // Afficher le texte complet
  console.log('📝 Transcription complète:');
  console.log('─'.repeat(60));
  console.log(result.text);
  console.log('─'.repeat(60));

  // Afficher les segments avec speakers
  if (result.segments && result.segments.length > 0) {
    console.log(`\n📊 ${result.segments.length} segments détectés:\n`);
    
    // Compter les speakers uniques
    const speakers = new Set(result.segments.map(s => s.speaker_id).filter(Boolean));
    if (speakers.size > 0) {
      console.log(`👥 Speakers identifiés: ${Array.from(speakers).join(', ')}\n`);
    } else {
      console.log(`⚠️  Aucun speaker_id détecté dans les segments\n`);
    }

    // Afficher tous les segments
    console.log('Segments détaillés:');
    console.log('─'.repeat(60));
    result.segments.forEach((seg, i) => {
      const start = seg.start?.toFixed(2) || '?';
      const end = seg.end?.toFixed(2) || '?';
      const speaker = seg.speaker_id || 'unknown';
      console.log(`[${start}s → ${end}s] [${speaker}]`);
      console.log(`   ${seg.text}\n`);
    });
    console.log('─'.repeat(60));
  }

  console.log('\n✨ Test terminé!');
}

testLocalFile().catch((error) => {
  console.error('\n❌ Erreur:', error instanceof Error ? error.message : error);
  process.exit(1);
});
