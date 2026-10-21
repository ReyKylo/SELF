-- SELF Career Phase 3 — sourced opportunities, manual scans only.
-- Does not activate any cron, automation, or third-party application submission.
CREATE TABLE IF NOT EXISTS public.career_opportunities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 provider text NOT NULL CHECK (provider IN ('Remotive','Manual')),
 provider_id text NOT NULL DEFAULT '',
 role_title text NOT NULL CHECK (length(trim(role_title)) BETWEEN 1 AND 200),
 company_name text NOT NULL CHECK (length(trim(company_name)) BETWEEN 1 AND 200),
 location_label text NOT NULL DEFAULT '',
 job_url text NOT NULL CHECK (job_url ~* '^https://[^[:space:]]+$'),
 cluster text NOT NULL CHECK (cluster IN ('investment','strategy','venture','fintech')),
 posted_at timestamptz,
 source_checked_at timestamptz NOT NULL DEFAULT now(),
 relevance_score integer NOT NULL CHECK (relevance_score BETWEEN 0 AND 100),
 score_reason text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'new'
   CHECK (status IN ('new','saved','dismissed','converted')),
 notes text NOT NULL DEFAULT '',
 application_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,user_id),
 UNIQUE(user_id,job_url),
 CONSTRAINT career_opportunity_application_owner FOREIGN KEY(application_id,user_id)
  REFERENCES public.career_applications(id,user_id) ON DELETE SET NULL(application_id)
);
CREATE INDEX IF NOT EXISTS career_opportunity_user_score
 ON public.career_opportunities(user_id,status,relevance_score DESC);
CREATE INDEX IF NOT EXISTS career_opportunity_user_seen
 ON public.career_opportunities(user_id,source_checked_at DESC);
ALTER TABLE public.career_opportunities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='career_opportunities' AND policyname='owner_select') THEN
  CREATE POLICY owner_select ON public.career_opportunities FOR SELECT TO authenticated
   USING ((select auth.uid())=user_id);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='career_opportunities' AND policyname='owner_insert') THEN
  CREATE POLICY owner_insert ON public.career_opportunities FOR INSERT TO authenticated
   WITH CHECK ((select auth.uid())=user_id);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='career_opportunities' AND policyname='owner_update') THEN
  CREATE POLICY owner_update ON public.career_opportunities FOR UPDATE TO authenticated
   USING ((select auth.uid())=user_id) WITH CHECK ((select auth.uid())=user_id);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='career_opportunities' AND policyname='owner_delete') THEN
  CREATE POLICY owner_delete ON public.career_opportunities FOR DELETE TO authenticated
   USING ((select auth.uid())=user_id);
 END IF;
END $$;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.career_opportunities TO authenticated;
REVOKE ALL ON public.career_opportunities FROM anon;
