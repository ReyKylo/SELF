-- SELF Career Tracker: any link or note is one row with a status, a next step and an activity log
-- (docs/design/HUNT_TRACKER_PLAN.md §5). Additive: two new tables, no change to existing rows.
CREATE TABLE IF NOT EXISTS public.career_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text CHECK (url IS NULL OR url ~* '^(https?://|mailto:)[^[:space:]]+$'),
  kind text NOT NULL DEFAULT 'other' CHECK (kind IN ('job','person','company','other')),
  source text NOT NULL DEFAULT 'website'
    CHECK (source IN ('linkedin','linkedin_jobs','jobstreet','glints','kalibrr','job_board','ats','company_site','email','website','referral','other')),
  title text NOT NULL DEFAULT '' CHECK (char_length(title) <= 200),
  company_name text NOT NULL DEFAULT '' CHECK (char_length(company_name) <= 160),
  company_id uuid,
  industry text NOT NULL DEFAULT '' CHECK (char_length(industry) <= 80),
  location text NOT NULL DEFAULT '' CHECK (char_length(location) <= 160),
  status text NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox','active','waiting','done','dropped')),
  close_reason text NOT NULL DEFAULT '' CHECK (char_length(close_reason) <= 200),
  next_step text NOT NULL DEFAULT '' CHECK (char_length(next_step) <= 200),
  next_due date,
  deadline date,
  notes text NOT NULL DEFAULT '',
  person_id uuid,
  application_id uuid,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id,user_id),
  CONSTRAINT career_track_has_content CHECK (url IS NOT NULL OR char_length(trim(title)) > 0),
  CONSTRAINT career_track_company_owner FOREIGN KEY (company_id,user_id)
    REFERENCES public.career_companies(id,user_id) ON DELETE SET NULL (company_id),
  CONSTRAINT career_track_person_owner FOREIGN KEY (person_id,user_id)
    REFERENCES public.career_people(id,user_id) ON DELETE SET NULL (person_id),
  CONSTRAINT career_track_application_owner FOREIGN KEY (application_id,user_id)
    REFERENCES public.career_applications(id,user_id) ON DELETE SET NULL (application_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS career_tracks_owner_url_uniq ON public.career_tracks(user_id,url) WHERE url IS NOT NULL;
CREATE INDEX IF NOT EXISTS career_tracks_owner_status_idx ON public.career_tracks(user_id,status,next_due);
CREATE INDEX IF NOT EXISTS career_tracks_owner_activity_idx ON public.career_tracks(user_id,last_activity_at DESC);
CREATE INDEX IF NOT EXISTS career_tracks_owner_company_idx ON public.career_tracks(user_id,company_id);

CREATE TABLE IF NOT EXISTS public.career_track_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('created','status','next_step','note','edit','linked','touched')),
  summary text NOT NULL CHECK (char_length(trim(summary)) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_track_event_owner FOREIGN KEY (track_id,user_id)
    REFERENCES public.career_tracks(id,user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS career_track_events_owner_track_idx ON public.career_track_events(user_id,track_id,created_at DESC);

ALTER TABLE public.career_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_track_events ENABLE ROW LEVEL SECURITY;
-- Mirrors the four explicit owner-scoped actions of the other career tables.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['career_tracks','career_track_events'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname='owner_select') THEN
      EXECUTE format('CREATE POLICY owner_select ON public.%I FOR SELECT TO authenticated USING ((select auth.uid()) = user_id)',t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname='owner_insert') THEN
      EXECUTE format('CREATE POLICY owner_insert ON public.%I FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id)',t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname='owner_update') THEN
      EXECUTE format('CREATE POLICY owner_update ON public.%I FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id)',t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname='owner_delete') THEN
      EXECUTE format('CREATE POLICY owner_delete ON public.%I FOR DELETE TO authenticated USING ((select auth.uid()) = user_id)',t);
    END IF;
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon',t);
  END LOOP;
END $$;
