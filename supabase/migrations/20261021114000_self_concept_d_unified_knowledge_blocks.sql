-- SELF Concept D v1.1: additive unified knowledge blocks (retain legacy title/body/key_points).
alter table public.knowledge_cards add column if not exists content_blocks jsonb;
comment on column public.knowledge_cards.content_blocks is 'Unified Canvas writing blocks; NULL renders legacy card notes unchanged.';
alter table public.knowledge_cards add constraint knowledge_cards_content_blocks_array_check
  check (content_blocks is null or jsonb_typeof(content_blocks)='array');
