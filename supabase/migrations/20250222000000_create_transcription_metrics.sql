-- Table des métriques de transcription pour analytics
-- Permet d'estimer les temps de transcription selon taille, durée, source (local vs openscribe)
-- Insérée uniquement via Service Role (backend), pas d'accès client

CREATE TABLE IF NOT EXISTS public.transcription_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Timings (ms)
  upload_duration_ms INTEGER,
  transcription_duration_ms INTEGER NOT NULL,
  -- Données audio
  file_size_bytes BIGINT,
  audio_duration_seconds NUMERIC(10, 2),
  -- Contexte
  client_ip TEXT,
  source TEXT, -- 'local' | 'openscribe' (selon IP ou header)
  user_id UUID REFERENCES auth.users(id), -- NULL si anonyme
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes analytics
CREATE INDEX IF NOT EXISTS idx_transcription_metrics_created_at ON public.transcription_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_transcription_metrics_source ON public.transcription_metrics(source);
CREATE INDEX IF NOT EXISTS idx_transcription_metrics_audio_duration ON public.transcription_metrics(audio_duration_seconds);

-- RLS activé : aucune policy = aucun accès pour anon/authenticated
-- Seul le Service Role (backend) peut insérer
ALTER TABLE public.transcription_metrics ENABLE ROW LEVEL SECURITY;

-- Commentaire pour documentation
COMMENT ON TABLE public.transcription_metrics IS 'Métriques de transcription pour analytics et estimation des temps. Inséré uniquement par le backend via Service Role.';
