-- SELF Career Phase 2. Additive and owner-scoped; original SELF Tasks are canonical.
CREATE TABLE IF NOT EXISTS public.career_touchpoints (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 person_id uuid NOT NULL,
 contact_at date NOT NULL DEFAULT current_date,
 channel text NOT NULL DEFAULT 'message' CHECK (channel IN ('message','email','call','meeting','event','other')),
 summary text NOT NULL CHECK (length(trim(summary)) BETWEEN 1 AND 5000),
 next_step text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,user_id),
 CONSTRAINT career_touchpoint_person_owner FOREIGN KEY(person_id,user_id) REFERENCES public.career_people(id,user_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS public.career_cv_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 label text NOT NULL CHECK (length(trim(label)) BETWEEN 1 AND 160),
 focus text NOT NULL DEFAULT '',
 notes text NOT NULL DEFAULT '',
 storage_path text,
 file_name text,
 file_type text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,user_id),
 CONSTRAINT career_cv_private_path CHECK (storage_path IS NULL OR storage_path LIKE user_id::text || '/%')
);
ALTER TABLE public.career_applications ADD COLUMN IF NOT EXISTS cv_version_id uuid;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='career_app_cv_owner' AND conrelid='public.career_applications'::regclass) THEN
  ALTER TABLE public.career_applications ADD CONSTRAINT career_app_cv_owner
   FOREIGN KEY(cv_version_id,user_id) REFERENCES public.career_cv_versions(id,user_id) ON DELETE SET NULL (cv_version_id);
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.career_interviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 application_id uuid NOT NULL,
 title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 160),
 scheduled_at timestamptz,
 format text NOT NULL DEFAULT 'video' CHECK (format IN ('video','phone','onsite','case','other')),
 stage text NOT NULL DEFAULT 'scheduled' CHECK (stage IN ('scheduled','completed','cancelled')),
 prep_notes text NOT NULL DEFAULT '',
 reflection text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,user_id),
 CONSTRAINT career_interview_application_owner FOREIGN KEY(application_id,user_id) REFERENCES public.career_applications(id,user_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS public.career_templates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 160),
 category text NOT NULL DEFAULT 'networking' CHECK (category IN ('networking','followup','cover_letter','interview','other')),
 body text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,user_id)
);
CREATE TABLE IF NOT EXISTS public.career_task_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 task_id uuid NOT NULL,
 application_id uuid,
 person_id uuid,
 company_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,user_id),
 UNIQUE(task_id,user_id),
 CONSTRAINT career_task_one_target CHECK ((application_id IS NOT NULL)::int + (person_id IS NOT NULL)::int + (company_id IS NOT NULL)::int = 1),
 CONSTRAINT career_task_link_existing_owner FOREIGN KEY(task_id,user_id) REFERENCES public.tasks(id,user_id) ON DELETE CASCADE,
 CONSTRAINT career_task_application_owner FOREIGN KEY(application_id,user_id) REFERENCES public.career_applications(id,user_id) ON DELETE CASCADE,
 CONSTRAINT career_task_person_owner FOREIGN KEY(person_id,user_id) REFERENCES public.career_people(id,user_id) ON DELETE CASCADE,
 CONSTRAINT career_task_company_owner FOREIGN KEY(company_id,user_id) REFERENCES public.career_companies(id,user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS career_touchpoint_user_person_date ON public.career_touchpoints(user_id,person_id,contact_at DESC);
CREATE INDEX IF NOT EXISTS career_cv_user_updated ON public.career_cv_versions(user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS career_interview_user_date ON public.career_interviews(user_id,scheduled_at);
CREATE INDEX IF NOT EXISTS career_template_user_type ON public.career_templates(user_id,category);
CREATE INDEX IF NOT EXISTS career_task_owner_target_app ON public.career_task_links(user_id,application_id);
CREATE INDEX IF NOT EXISTS career_task_owner_target_person ON public.career_task_links(user_id,person_id);
CREATE INDEX IF NOT EXISTS career_task_owner_target_company ON public.career_task_links(user_id,company_id);
DO $$
DECLARE name text;
BEGIN
 FOREACH name IN ARRAY ARRAY['career_touchpoints','career_cv_versions','career_interviews','career_templates','career_task_links'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',name);
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=name AND policyname='owner_select') THEN
   EXECUTE format('CREATE POLICY owner_select ON public.%I FOR SELECT TO authenticated USING ((select auth.uid())=user_id)',name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=name AND policyname='owner_insert') THEN
   EXECUTE format('CREATE POLICY owner_insert ON public.%I FOR INSERT TO authenticated WITH CHECK ((select auth.uid())=user_id)',name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=name AND policyname='owner_update') THEN
   EXECUTE format('CREATE POLICY owner_update ON public.%I FOR UPDATE TO authenticated USING ((select auth.uid())=user_id) WITH CHECK ((select auth.uid())=user_id)',name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=name AND policyname='owner_delete') THEN
   EXECUTE format('CREATE POLICY owner_delete ON public.%I FOR DELETE TO authenticated USING ((select auth.uid())=user_id)',name);
  END IF;
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',name);
  EXECUTE format('REVOKE ALL ON public.%I FROM anon',name);
 END LOOP;
END $$;
-- Do not permit access via a public storage URL. Enforce user-owned first path component.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('self-career-documents','self-career-documents',false,8388608,
 ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='career_files_select_own') THEN
  CREATE POLICY career_files_select_own ON storage.objects FOR SELECT TO authenticated
   USING (bucket_id='self-career-documents' AND (storage.foldername(name))[1]=(select auth.uid())::text);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='career_files_insert_own') THEN
  CREATE POLICY career_files_insert_own ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (bucket_id='self-career-documents' AND (storage.foldername(name))[1]=(select auth.uid())::text);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='career_files_delete_own') THEN
  CREATE POLICY career_files_delete_own ON storage.objects FOR DELETE TO authenticated
   USING (bucket_id='self-career-documents' AND (storage.foldername(name))[1]=(select auth.uid())::text);
 END IF;
END $$;
