-- SELF multi-user: per-account key/value store for settings that used to live only in one browser
-- (Today pins, Work saved views, Study progress, flashcard deck, Hunt drafts). Owner-scoped via RLS.
create table public.user_kv (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null check (char_length(key) between 1 and 200 and key like 'self.%'),
  value text not null check (char_length(value) <= 262144),
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_kv enable row level security;

create policy owner_select on public.user_kv for select to authenticated using ((select auth.uid()) = user_id);
create policy owner_insert on public.user_kv for insert to authenticated with check ((select auth.uid()) = user_id);
create policy owner_update on public.user_kv for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_delete on public.user_kv for delete to authenticated using ((select auth.uid()) = user_id);

-- Abuse control for open signups: at most 2000 keys per account.
create function public.user_kv_limit() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.user_kv where user_id = new.user_id) >= 2000 then
    raise exception 'user_kv key limit reached';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger user_kv_limit before insert or update on public.user_kv
  for each row execute function public.user_kv_limit();
