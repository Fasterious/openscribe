-- ============================================================
-- Durcissement RLS — Lot 0
--
-- Idempotent : DROP POLICY IF EXISTS avant chaque CREATE POLICY
-- (Postgres n'a pas de CREATE POLICY IF NOT EXISTS).
--
-- Rappel d'architecture, indispensable pour relire ce fichier :
--   * Les routes qui utilisent createAdminClient() (lib/supabase/admin.ts)
--     passent par la service_role key, qui a BYPASSRLS. Aucune policy
--     ci-dessous ne les affecte.
--   * Les routes qui utilisent lib/supabase/server.ts passent par la clé
--     anon + le cookie de session : elles dépendent des policies.
--   * Supabase Realtime applique les policies RLS pour décider de la
--     livraison des postgres_changes. Restreindre un SELECT peut donc
--     casser un abonnement temps réel, silencieusement.
-- ============================================================

-- ------------------------------------------------------------
-- csv_analysis_sessions
-- ------------------------------------------------------------

-- FAILLE PRINCIPALE. Cette policy a été écrite avec l'intention de couvrir
-- la service_role, mais sans clause TO elle s'applique à PUBLIC. Les
-- policies permissives étant OU-ées, elle annulait les quatre policies
-- auth.uid() = creator_id qui la précèdent : tout porteur de la clé anon
-- pouvait lire, modifier et supprimer n'importe quelle analyse via PostgREST.
-- La service_role n'en a pas besoin (BYPASSRLS).
DROP POLICY IF EXISTS "Service role full access on csv_analysis_sessions"
  ON public.csv_analysis_sessions;

-- L'UPDATE n'avait pas de WITH CHECK : un créateur authentifié pouvait
-- réécrire creator_id et transférer son analyse à un tiers.
DROP POLICY IF EXISTS "Creators can update their analyses"
  ON public.csv_analysis_sessions;
CREATE POLICY "Creators can update their analyses"
  ON public.csv_analysis_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- ------------------------------------------------------------
-- workshop_sessions
-- ------------------------------------------------------------

-- "Anyone can view active sessions" (SELECT USING true) est CONSERVÉE :
-- les participants anonymes chargent la question de l'atelier via
-- GET /api/workshop/sessions/[id], qui n'est pas authentifiée par design.

DROP POLICY IF EXISTS "Creators can update their sessions"
  ON public.workshop_sessions;
CREATE POLICY "Creators can update their sessions"
  ON public.workshop_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- ------------------------------------------------------------
-- workshop_responses
-- ------------------------------------------------------------

-- "Anyone can view responses" (SELECT USING true) est CONSERVÉE
-- VOLONTAIREMENT. app/workshop/[sessionId]/participate/page.tsx s'abonne
-- aux postgres_changes en tant qu'anon non authentifié : restreindre ce
-- SELECT couperait le mur des réponses en direct sans lever d'erreur.
-- Risque accepté et documenté : un porteur de la clé anon peut énumérer
-- les réponses de tous les ateliers. À traiter au Lot 2 (jeton de session
-- côté participant plutôt qu'un SELECT global).

-- En revanche, les écritures anonymes n'ont aucune raison d'exister :
-- les deux seuls chemins d'écriture de l'application sont
-- app/api/workshop/responses/route.ts et responses/batch/route.ts,
-- tous deux en service role. La policy UPDATE prétendait filtrer "via
-- token" mais son prédicat était USING (true) : aucun contrôle de jeton.
DROP POLICY IF EXISTS "Anyone can submit responses"
  ON public.workshop_responses;
DROP POLICY IF EXISTS "Participants can update their own responses via token"
  ON public.workshop_responses;

-- ------------------------------------------------------------
-- workshop_analyses
-- ------------------------------------------------------------

-- INSERT : app/api/workshop/analyze/route.ts écrit en service role.
DROP POLICY IF EXISTS "Service role can insert analyses"
  ON public.workshop_analyses;

-- SELECT : restreint au créateur de la session. La page participant
-- n'affiche jamais l'analyse ; seul le tableau de bord facilitateur la lit,
-- via un client anon + cookie, donc auth.uid() est disponible.
--
-- ⚠️ Effet de bord à accepter en conscience : après cette migration, une
-- machine NON connectée (vidéoprojecteur, second écran) ne peut plus
-- afficher l'analyse d'un atelier. Si ce parcours compte, ne pas appliquer
-- ce bloc et conserver "Anyone can view analyses".
DROP POLICY IF EXISTS "Anyone can view analyses"
  ON public.workshop_analyses;
CREATE POLICY "Creators can view analyses of their sessions"
  ON public.workshop_analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workshop_sessions s
      WHERE s.id = workshop_analyses.session_id
        AND s.creator_id = auth.uid()
    )
  );
