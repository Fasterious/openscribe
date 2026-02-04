/**
 * POC - Test de l'API Voxtral (Mistral) pour la transcription
 * 
 * Usage: npx tsx scripts/test-voxtral.ts
 * 
 * Prérequis: Ajouter MISTRAL_API_KEY dans .env.local
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  console.error('❌ MISTRAL_API_KEY manquante dans .env.local');
  console.log('\nAjoute cette ligne dans ton .env.local:');
  console.log('MISTRAL_API_KEY=ton_api_key_ici');
  process.exit(1);
}

// URL audio de test (depuis la doc Mistral)
const TEST_AUDIO_URL = 'https://docs.mistral.ai/audio/obama.mp3';

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

interface TranscriptionResponse {
  text: string;
  segments?: TranscriptionSegment[];
}

async function testBasicTranscription(): Promise<void> {
  console.log('🎤 Test 1: Transcription basique (sans diarization)');
  console.log(`   Audio: ${TEST_AUDIO_URL}\n`);

  const formData = new FormData();
  formData.append('model', 'voxtral-mini-latest');
  formData.append('file_url', TEST_AUDIO_URL);

  const response = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const result: TranscriptionResponse = await response.json();
  
  console.log('✅ Transcription réussie!\n');
  console.log('📝 Texte:');
  console.log('─'.repeat(50));
  console.log(result.text);
  console.log('─'.repeat(50));
  
  return;
}

async function testTranscriptionWithDiarization(): Promise<void> {
  console.log('\n🎤 Test 2: Transcription avec diarization');
  console.log(`   Audio: ${TEST_AUDIO_URL}\n`);

  const formData = new FormData();
  formData.append('model', 'voxtral-mini-latest');
  formData.append('file_url', TEST_AUDIO_URL);
  formData.append('diarize', 'true');
  formData.append('timestamp_granularities[]', 'segment'); // Requis avec diarize

  const response = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const result: TranscriptionResponse = await response.json();
  
  console.log('✅ Transcription avec diarization réussie!\n');
  console.log('📝 Texte avec speakers:');
  console.log('─'.repeat(50));
  console.log(result.text);
  console.log('─'.repeat(50));

  if (result.segments) {
    console.log('\n📊 Segments détectés:', result.segments.length);
    console.log('\nPremiers segments:');
    result.segments.slice(0, 3).forEach((seg, i) => {
      console.log(`  ${i + 1}. [${seg.start?.toFixed(2)}s - ${seg.end?.toFixed(2)}s] ${seg.speaker || 'N/A'}: "${seg.text?.substring(0, 50)}..."`);
    });
  }
}

async function testTranscriptionWithTimestamps(): Promise<void> {
  console.log('\n🎤 Test 3: Transcription avec timestamps');
  console.log(`   Audio: ${TEST_AUDIO_URL}\n`);

  const formData = new FormData();
  formData.append('model', 'voxtral-mini-latest');
  formData.append('file_url', TEST_AUDIO_URL);
  formData.append('timestamp_granularities[]', 'segment');

  const response = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const result: TranscriptionResponse = await response.json();
  
  console.log('✅ Transcription avec timestamps réussie!\n');
  
  if (result.segments) {
    console.log('📊 Segments avec timestamps:');
    console.log('─'.repeat(50));
    result.segments.slice(0, 5).forEach((seg) => {
      const start = seg.start?.toFixed(2) || '?';
      const end = seg.end?.toFixed(2) || '?';
      console.log(`[${start}s → ${end}s] ${seg.text}`);
    });
    if (result.segments.length > 5) {
      console.log(`... et ${result.segments.length - 5} segments de plus`);
    }
    console.log('─'.repeat(50));
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     POC Voxtral (Mistral) - Test Transcription     ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  try {
    // Test 1: Basique
    await testBasicTranscription();

    // Test 2: Avec diarization  
    await testTranscriptionWithDiarization();

    // Test 3: Avec timestamps
    await testTranscriptionWithTimestamps();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✨ Tous les tests passés en ${duration}s`);
    console.log('\n📋 Résumé:');
    console.log('   - API Voxtral fonctionne ✅');
    console.log('   - Diarization disponible ✅');
    console.log('   - Timestamps segment disponibles ✅');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
