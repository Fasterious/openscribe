-- Workshop Sessions
CREATE TABLE public.workshop_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) NOT NULL,
  question TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workshop_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sessions"
  ON public.workshop_sessions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create sessions"
  ON public.workshop_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their sessions"
  ON public.workshop_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their sessions"
  ON public.workshop_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Workshop Responses (participants, no auth required)
CREATE TABLE public.workshop_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.workshop_sessions(id) ON DELETE CASCADE NOT NULL,
  participant_name TEXT NOT NULL,
  participant_token UUID DEFAULT gen_random_uuid() NOT NULL,
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workshop_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view responses"
  ON public.workshop_responses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit responses"
  ON public.workshop_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Participants can update their own responses via token"
  ON public.workshop_responses FOR UPDATE
  USING (true);

CREATE INDEX idx_workshop_responses_session
  ON public.workshop_responses(session_id);

-- Enable Supabase Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.workshop_responses;

-- Workshop Analyses (clustering results)
CREATE TABLE public.workshop_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.workshop_sessions(id) ON DELETE CASCADE NOT NULL,
  model_used TEXT NOT NULL,
  clusters JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workshop_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view analyses"
  ON public.workshop_analyses FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert analyses"
  ON public.workshop_analyses FOR INSERT
  WITH CHECK (true);
