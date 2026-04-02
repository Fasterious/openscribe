-- CSV Analysis Sessions
CREATE TABLE public.csv_analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) NOT NULL,
  filename TEXT NOT NULL,
  status TEXT DEFAULT 'parsing' CHECK (status IN ('parsing', 'extracting', 'clustering', 'synthesizing', 'complete', 'error')),
  current_step INTEGER DEFAULT 1,
  model_used TEXT NOT NULL DEFAULT 'gemini',
  step_1_parsed JSONB,
  step_2_quintuplets JSONB,
  step_3_clusters JSONB,
  step_5_final JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.csv_analysis_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses"
  ON public.csv_analysis_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Authenticated users can create analyses"
  ON public.csv_analysis_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their analyses"
  ON public.csv_analysis_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their analyses"
  ON public.csv_analysis_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Service role full access on csv_analysis_sessions"
  ON public.csv_analysis_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_csv_analysis_sessions_creator
  ON public.csv_analysis_sessions(creator_id);
