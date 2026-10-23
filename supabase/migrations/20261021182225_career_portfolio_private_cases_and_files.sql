
-- SELF Career Prep personal portfolio; additive only, no existing data touched.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values (
  'self-career-portfolio','self-career-portfolio',false,15728640,
  array['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

create table if not exists public.career_portfolio_cases (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 track text not null check (track in ('PE','VC','Consulting')),
 decision text not null default '',
 review_checks jsonb not null default '{}'::jsonb check (jsonb_typeof(review_checks)='object'),
 status text not null default 'draft' check (status in ('draft','submitted','self_checked')),
 updated_at timestamptz not null default now(),
 primary key(user_id,track)
);
create table if not exists public.career_portfolio_files (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 track text not null check (track in ('PE','VC','Consulting')),
 object_path text not null unique,
 filename text not null,
 mime_type text not null,
 bytes integer not null check (bytes > 0 and bytes <= 15728640),
 created_at timestamptz not null default now(),
 check (object_path like user_id::text || '/' || track || '/%')
);
create index if not exists career_portfolio_files_owner_track_created_idx on public.career_portfolio_files(user_id,track,created_at desc);
alter table public.career_portfolio_cases enable row level security;
alter table public.career_portfolio_files enable row level security;
grant select,insert,update,delete on public.career_portfolio_cases to authenticated;
grant select,insert,delete on public.career_portfolio_files to authenticated;
create policy career_portfolio_cases_select_own on public.career_portfolio_cases for select to authenticated using ((select auth.uid())=user_id);
create policy career_portfolio_cases_insert_own on public.career_portfolio_cases for insert to authenticated with check ((select auth.uid())=user_id);
create policy career_portfolio_cases_update_own on public.career_portfolio_cases for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy career_portfolio_cases_delete_own on public.career_portfolio_cases for delete to authenticated using ((select auth.uid())=user_id);
create policy career_portfolio_files_select_own on public.career_portfolio_files for select to authenticated using ((select auth.uid())=user_id);
create policy career_portfolio_files_insert_own on public.career_portfolio_files for insert to authenticated with check ((select auth.uid())=user_id);
create policy career_portfolio_files_delete_own on public.career_portfolio_files for delete to authenticated using ((select auth.uid())=user_id);
create policy career_portfolio_storage_select_own on storage.objects for select to authenticated
 using(bucket_id='self-career-portfolio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy career_portfolio_storage_insert_own on storage.objects for insert to authenticated
 with check(bucket_id='self-career-portfolio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy career_portfolio_storage_delete_own on storage.objects for delete to authenticated
 using(bucket_id='self-career-portfolio' and (storage.foldername(name))[1]=(select auth.uid())::text);
