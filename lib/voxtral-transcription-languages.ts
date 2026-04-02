/**
 * Langues proposées dans l’UI ; le code ISO est envoyé à Mistral en `language` (multipart) quand
 * l’utilisateur n’utilise pas la détection auto. Voir `transcribe()` dans `lib/mistral.ts` pour la
 * limite du modèle (sortie parfois multilingue malgré `language` fixé).
 *
 * @see https://docs.mistral.ai/api/endpoint/audio/transcriptions
 */
export const VOXTRAL_TRANSCRIPTION_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'es', label: 'Español' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
] as const;

export type VoxtralTranscriptionLanguageCode =
  (typeof VOXTRAL_TRANSCRIPTION_LANGUAGES)[number]['code'];

const ALLOWED = new Set<string>(
  VOXTRAL_TRANSCRIPTION_LANGUAGES.map((l) => l.code)
);

export function isAllowedVoxtralTranscriptionLanguage(
  code: string | undefined | null
): code is VoxtralTranscriptionLanguageCode {
  return !!code && ALLOWED.has(code);
}

export function getVoxtralLanguageLabel(code: string): string | undefined {
  return VOXTRAL_TRANSCRIPTION_LANGUAGES.find((l) => l.code === code)?.label;
}
