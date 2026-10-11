-- SELF Phase 1.6 Investment Vault / isolate from existing SELF records.
-- New table only; no modification or deletion of existing objects/data.
create table if not exists public.self_investment_documents (
  user_id uuid not null references auth.users(id) on delete cascade,
  document_key text not null check (document_key in ('academy','research','model','memo','icdeck','curriculum')),
  revision bigint not null default 1 check (revision between 1 and 1000000000),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 500000),
  updated_at timestamptz not null default now(),
  primary key (user_id, document_key)
);
alter table public.self_investment_documents enable row level security;
create policy investment_select_own on public.self_investment_documents
 for select to authenticated using (user_id = (select auth.uid()));
create policy investment_insert_own on public.self_investment_documents
 for insert to authenticated with check (user_id = (select auth.uid()) and revision = 1);
create policy investment_update_own on public.self_investment_documents
 for update to authenticated using (user_id = (select auth.uid()))
 with check (user_id = (select auth.uid()));
revoke all on table public.self_investment_documents from public, anon;
grant select, insert, update on table public.self_investment_documents to authenticated;
comment on table public.self_investment_documents is 'User-owned SELF investment-learning documents; conflict-safe client updates require matching revision.';
