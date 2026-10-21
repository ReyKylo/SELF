-- SELF Career CV private PDF backfill. Existing Storage upload remains canonical for new uploads.
-- This table stores owner-scoped imported CV bytes for cases where binary transfer
-- to Supabase Storage is unavailable. Client downloads are authenticated and audited.
CREATE TABLE IF NOT EXISTS public.career_cv_embedded_files (
 cv_id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 file_name text NOT NULL CHECK (length(file_name) BETWEEN 1 AND 200),
 file_bytes bytea NOT NULL CHECK (octet_length(file_bytes) > 10 AND octet_length(file_bytes) <= 8388608),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT career_cv_embedded_owner FOREIGN KEY (cv_id,user_id)
 REFERENCES public.career_cv_versions(id,user_id) ON DELETE CASCADE
);
ALTER TABLE public.career_cv_embedded_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.career_cv_embedded_files FROM anon;
REVOKE ALL ON public.career_cv_embedded_files FROM authenticated;
GRANT SELECT ON public.career_cv_embedded_files TO authenticated;
DO $$ BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname='public' AND tablename='career_cv_embedded_files'
  AND policyname='cv_embedded_owner_read'
 ) THEN
  CREATE POLICY cv_embedded_owner_read ON public.career_cv_embedded_files
  FOR SELECT TO authenticated USING ((SELECT auth.uid())=user_id);
 END IF;
END $$;
