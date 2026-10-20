-- SELF Concept C. Additive, preserves all existing data.
alter table public.board_items add column if not exists visual_kind text not null default 'knowledge', add column if not exists style jsonb not null default '{}'::jsonb, add column if not exists rotation double precision not null default 0, add column if not exists parent_item_id uuid;
alter table public.board_items add constraint board_items_visual_kind_check check (visual_kind in ('knowledge','rectangle','ellipse','diamond','sticky','text','image','frame','reference','task'));
alter table public.board_items add constraint board_items_rotation_check check (rotation between -360 and 360);
alter table public.board_items add constraint board_items_parent_not_self check (parent_item_id is null or parent_item_id <> id);
alter table public.board_items add constraint board_items_parent_same_board foreign key (parent_item_id,board_id,user_id) references public.board_items(id,board_id,user_id) on delete set null (parent_item_id);
alter table public.board_edges add column if not exists from_anchor text not null default 'auto',add column if not exists to_anchor text not null default 'auto',add column if not exists route_type text not null default 'curved',add column if not exists stroke text not null default '#9db7df',add column if not exists stroke_width integer not null default 2;
alter table public.board_edges add constraint edges_anchor_from_check check (from_anchor in ('auto','n','e','s','w'));
alter table public.board_edges add constraint edges_anchor_to_check check (to_anchor in ('auto','n','e','s','w'));
alter table public.board_edges add constraint edges_route_check check (route_type in ('straight','curved','elbow'));
alter table public.board_edges add constraint edges_width_check check (stroke_width between 1 and 12);
alter table public.knowledge_cards add column if not exists asset_path text;
create index if not exists idx_board_items_parent on public.board_items(parent_item_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('self-board-assets','self-board-assets',false,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
 on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];
create policy self_canvas_asset_select on storage.objects for select to authenticated using(bucket_id='self-board-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy self_canvas_asset_insert on storage.objects for insert to authenticated with check(bucket_id='self-board-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy self_canvas_asset_update on storage.objects for update to authenticated using(bucket_id='self-board-assets' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='self-board-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy self_canvas_asset_delete on storage.objects for delete to authenticated using(bucket_id='self-board-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
