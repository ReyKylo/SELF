-- SELF Career Phase 1: owner-scoped canonical companies, people and applications.
-- Additive migration: no changes to existing Tasks, Whiteboards, Links or Spaces.
CREATE TABLE IF NOT EXISTS public.career_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 160),
  industry text NOT NULL DEFAULT '',
  website text CHECK (website IS NULL OR website ~* '^https?://[^[:space:]]+$'),
  location text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id,user_id)
);
CREATE TABLE IF NOT EXISTS public.career_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 1 AND 160),
  role_title text NOT NULL DEFAULT '',
  company_id uuid,
  email text NOT NULL DEFAULT '',
  profile_url text CHECK (profile_url IS NULL OR profile_url ~* '^https?://[^[:space:]]+$'),
  relationship_stage text NOT NULL DEFAULT 'new' CHECK (relationship_stage IN ('new','reached_out','in_conversation','maintain')),
  last_contacted_at date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id,user_id),
  CONSTRAINT career_person_own_company FOREIGN KEY(company_id,user_id)
    REFERENCES public.career_companies(id,user_id) ON DELETE SET NULL (company_id)
);
CREATE TABLE IF NOT EXISTS public.career_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  role_title text NOT NULL CHECK (char_length(trim(role_title)) BETWEEN 1 AND 200),
  hiring_stage text NOT NULL DEFAULT 'wishlist'
    CHECK (hiring_stage IN ('wishlist','applied','interviewing','offer','closed')),
  source_url text CHECK (source_url IS NULL OR source_url ~* '^https?://[^[:space:]]+$'),
  applied_at date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id,user_id),
  CONSTRAINT career_application_own_company FOREIGN KEY(company_id,user_id)
    REFERENCES public.career_companies(id,user_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS career_companies_owner_updated_idx ON public.career_companies(user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS career_people_owner_company_idx ON public.career_people(user_id,company_id);
CREATE INDEX IF NOT EXISTS career_people_owner_updated_idx ON public.career_people(user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS career_apps_owner_stage_idx ON public.career_applications(user_id,hiring_stage,updated_at DESC);
CREATE INDEX IF NOT EXISTS career_apps_owner_company_idx ON public.career_applications(user_id,company_id);
ALTER TABLE public.career_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;
-- Mirrors existing SELF's four explicit owner-scoped actions and protections.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['career_companies','career_people','career_applications'] LOOP
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
