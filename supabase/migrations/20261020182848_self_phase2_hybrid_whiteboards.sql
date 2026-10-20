-- SELF Phase 2: Hybrid Whiteboards
-- Cards are canonical content. Each board item has its own placement.
create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null default '',
  pan_x double precision not null default 0,
  pan_y double precision not null default 0,
  zoom double precision not null default 1 check (zoom between 0.25 and 2.5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,user_id),
  constraint boards_own_space foreign key (space_id,user_id)
    references public.spaces(id,user_id) on delete set null (space_id)
);
create table public.knowledge_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'note' check (kind in ('note','task','link','group','board')),
  title text not null default 'Untitled',
  summary text not null default '',
  body text not null default '',
  key_points text not null default '',
  accent text not null default 'blue' check (accent in ('blue','green','purple','yellow','red','cyan')),
  url text,
  task_id uuid,
  target_board_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,user_id),
  constraint card_url_is_web check(url is null or url ~* '^https?://'),
  constraint cards_own_task foreign key(task_id,user_id)
    references public.tasks(id,user_id) on delete set null (task_id),
  constraint cards_own_board foreign key(target_board_id,user_id)
    references public.boards(id,user_id) on delete set null (target_board_id)
);
create table public.board_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid not null,
  card_id uuid not null,
  x double precision not null default 120 check (x between -100000 and 100000),
  y double precision not null default 120 check (y between -100000 and 100000),
  w double precision not null default 270 check (w between 180 and 1200),
  h double precision not null default 190 check (h between 110 and 900),
  z integer not null default 0,
  unique(board_id,card_id),
  unique(id,board_id,user_id),
  constraint item_own_board foreign key(board_id,user_id)
    references public.boards(id,user_id) on delete cascade,
  constraint item_own_card foreign key(card_id,user_id)
    references public.knowledge_cards(id,user_id) on delete cascade
);
create table public.board_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid not null,
  source_item_id uuid not null,
  target_item_id uuid not null,
  label text not null default '',
  created_at timestamptz not null default now(),
  check(source_item_id <> target_item_id),
  unique(board_id,source_item_id,target_item_id),
  constraint edge_own_board foreign key(board_id,user_id)
    references public.boards(id,user_id) on delete cascade,
  constraint edge_source_on_board foreign key(source_item_id,board_id,user_id)
    references public.board_items(id,board_id,user_id) on delete cascade,
  constraint edge_target_on_board foreign key(target_item_id,board_id,user_id)
    references public.board_items(id,board_id,user_id) on delete cascade
);
create index boards_by_user on public.boards(user_id,updated_at desc);
create index cards_by_user on public.knowledge_cards(user_id,updated_at desc);
create index items_by_board on public.board_items(board_id,z);
create index items_by_card on public.board_items(card_id);
create index edges_by_board on public.board_edges(board_id);
alter table public.boards enable row level security;
alter table public.knowledge_cards enable row level security;
alter table public.board_items enable row level security;
alter table public.board_edges enable row level security;
do $$
declare t text;
begin
  foreach t in array array['boards','knowledge_cards','board_items','board_edges'] loop
    execute format('create policy self_owner_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)',t);
    execute format('create policy self_owner_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',t);
    execute format('create policy self_owner_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',t);
    execute format('create policy self_owner_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('revoke all on public.%I from anon',t);
  end loop;
end $$;
