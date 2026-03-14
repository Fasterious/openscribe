-- Colonnes formatées pour les durées (heures, minutes, secondes, millisecondes)
-- Exemple: "0h 1m 4s 819ms"

ALTER TABLE public.transcription_metrics
  ADD COLUMN IF NOT EXISTS upload_duration_formatted TEXT,
  ADD COLUMN IF NOT EXISTS transcription_duration_formatted TEXT;

COMMENT ON COLUMN public.transcription_metrics.upload_duration_formatted IS 'Durée upload formatée (ex: 0h 1m 4s 280ms)';
COMMENT ON COLUMN public.transcription_metrics.transcription_duration_formatted IS 'Durée transcription formatée (ex: 0h 0m 4s 819ms)';
