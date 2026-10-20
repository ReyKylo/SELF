-- SELF Phase 1: private, owner-scoped workspace.
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  icon text not null default 'folder',
  accent text not null default 'blue',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid,
  title text not null check (char_length(trim(title)) between 1 and 250),
  status text not null default 'todo' check (status in ('todo','planning','in_progress','review','done')),
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  due_date date,
  description text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint tasks_own_space foreign key (space_id,user_id) references public.spaces(id,user_id) on delete set null (space_id)
);
create table public.task_checklist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  text text not null check (char_length(trim(text)) between 1 and 500),
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint checklist_own_task foreign key (task_id,user_id) references public.tasks(id,user_id) on delete cascade
);
create table public.task_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  title text not null default 'Untitled page',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pages_own_task foreign key (task_id,user_id) references public.tasks(id,user_id) on delete cascade
);
create table public.task_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  title text not null default '',
  url text not null check (url ~* '^https?://'),
  created_at timestamptz not null default now(),
  constraint links_own_task foreign key (task_id,user_id) references public.tasks(id,user_id) on delete cascade
);
create table public.inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid,
  title text not null check (char_length(trim(title)) between 1 and 250),
  body text not null default '',
  kind text not null default 'note' check (kind in ('note','link')),
  created_at timestamptz not null default now(),
  constraint inbox_own_space foreign key (space_id,user_id) references public.spaces(id,user_id) on delete set null (space_id)
);
create table public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark','light')),
  text_scale integer not null default 100 check (text_scale between 100 and 150),
  updated_at timestamptz not null default now()
);
create index idx_spaces_user on public.spaces(user_id,created_at);
create index idx_tasks_user_status on public.tasks(user_id,status,updated_at desc);
create index idx_tasks_user_due on public.tasks(user_id,due_date);
create index idx_checklist_task on public.task_checklist(task_id,position);
create index idx_task_pages_task on public.task_pages(task_id,created_at);
create index idx_task_links_task on public.task_links(task_id);
create index idx_inbox_user on public.inbox(user_id,created_at desc);
alter table public.spaces enable row level security;
alter table public.tasks enable row level security;
alter table public.task_checklist enable row level security;
alter table public.task_pages enable row level security;
alter table public.task_links enable row level security;
alter table public.inbox enable row level security;
alter table public.preferences enable row level security;
do $$
declare t text;
begin
  foreach t in array array['spaces','tasks','task_checklist','task_pages','task_links','inbox','preferences']
  loop
    execute format('create policy owner_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)',t);
    execute format('create policy owner_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',t);
    execute format('create policy owner_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',t);
    execute format('create policy owner_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',t);
    execute format('grant select, insert, update, delete on public.%I to authenticated',t);
    execute format('revoke all on public.%I from anon',t);
  end loop;
end $$;
