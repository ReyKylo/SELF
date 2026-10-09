-- SELF personal workspace only. No Bintang Trader resources or tables.
create table if not exists public.self_sync_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.self_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  collection text not null check (collection in (
    'companies','opportunities','contacts','tasks','goals','learning',
    'resources','journals','templates','events','inbox','boards','ideas',
    'links','activity'
  )),
  record_id text not null check (char_length(record_id) between 1 and 150),
  payload jsonb,
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, record_id),
  constraint self_records_payload_check check (
    (deleted_at is not null and payload is null) or
    (deleted_at is null and jsonb_typeof(payload) = 'object')
  )
);

alter table public.self_sync_state enable row level security;
alter table public.self_records enable row level security;

create policy "self_state_select_own" on public.self_sync_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "self_state_insert_own" on public.self_sync_state
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "self_state_update_own" on public.self_sync_state
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "self_records_select_own" on public.self_records
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "self_records_insert_own" on public.self_records
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "self_records_update_own" on public.self_records
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Revision-checked, atomic, small-batch writes. No elevated SQL privileges.
create or replace function public.self_apply_changes(
  p_expected_revision bigint,
  p_changes jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_revision bigint;
  v_change jsonb;
  v_collection text;
  v_record_id text;
  v_deleted boolean;
  v_payload jsonb;
begin
  if v_user is null then
    raise exception 'SELF_AUTH_REQUIRED';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'SELF_INVALID_REVISION';
  end if;
  if p_changes is null or jsonb_typeof(p_changes) <> 'array'
     or jsonb_array_length(p_changes) < 1
     or jsonb_array_length(p_changes) > 100
     or octet_length(p_changes::text) > 1500000 then
    raise exception 'SELF_INVALID_BATCH';
  end if;

  insert into public.self_sync_state(user_id) values (v_user)
    on conflict (user_id) do nothing;
  select revision into v_revision
    from public.self_sync_state
    where user_id = v_user for update;
  if v_revision <> p_expected_revision then
    raise exception 'SELF_SYNC_CONFLICT';
  end if;

  for v_change in select value from jsonb_array_elements(p_changes)
  loop
    v_collection := v_change->>'collection';
    v_record_id := v_change->>'record_id';
    if v_collection is null or v_collection not in (
      'companies','opportunities','contacts','tasks','goals','learning',
      'resources','journals','templates','events','inbox','boards','ideas',
      'links','activity'
    ) or v_record_id is null or char_length(v_record_id) not between 1 and 150 then
      raise exception 'SELF_INVALID_RECORD_ID';
    end if;
    v_deleted := coalesce((v_change->>'deleted')::boolean, false);
    v_payload := case when v_deleted then null else v_change->'payload' end;
    if not v_deleted and (
      jsonb_typeof(v_payload) is distinct from 'object' or
      (v_collection <> 'activity' and v_payload->>'id' is distinct from v_record_id)
    ) then
      raise exception 'SELF_INVALID_PAYLOAD';
    end if;

    insert into public.self_records(
      user_id, collection, record_id, payload, deleted_at, updated_at
    ) values (
      v_user, v_collection, v_record_id, v_payload,
      case when v_deleted then now() else null end, now()
    )
    on conflict (user_id, collection, record_id)
    do update set
      payload = excluded.payload,
      deleted_at = excluded.deleted_at,
      updated_at = now();
  end loop;

  update public.self_sync_state
    set revision = v_revision + 1, updated_at = now()
    where user_id = v_user;
  return v_revision + 1;
end;
$$;

revoke all on table public.self_records from anon;
revoke all on table public.self_sync_state from anon;
grant select, insert, update on public.self_records to authenticated;
grant select, insert, update on public.self_sync_state to authenticated;
revoke all on function public.self_apply_changes(bigint, jsonb) from public, anon;
grant execute on function public.self_apply_changes(bigint, jsonb) to authenticated;
