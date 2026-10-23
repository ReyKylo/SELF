# Supabase migration parity — SELF (`btiwxqjiptbwaunjibjh`)

Checked 23 Oct 2026 by comparing `supabase_migrations.schema_migrations` (read-only) with `supabase/migrations/`.
Comparison hashes SQL with comments and whitespace removed, so comment-only edits do not count as drift.

| DB version | DB name | Repo file | Result |
| --- | --- | --- | --- |
| 20261020172006 | self_phase1_workspace_core | 20261020172006_… | identical code |
| 20261020182848 | self_phase2_hybrid_whiteboards | 20261020182848_… | identical code |
| 20261020200643 | self_concept_c_canvas_scene_storage | 20261021030100_… | identical code, **different version number** |
| 20261021043847 | self_concept_d_unified_knowledge_blocks | 20261021114000_… | same DDL; only the `COMMENT ON COLUMN` text differs; **different version number** |
| 20261021070900 | self_career_phase1_core | 20261021135000_… | identical, **different version number** |
| 20261021074322 | career_phase2_operations | 20261021152000_… | identical, **different version number** |
| 20261021080536 | career_phase3_opportunities | 20261021170000_… | identical, **different version number** |
| 20261021110608 | enable_pg_net_for_self_storage_import | — | intentionally not in repo (see below) |
| 20261021111423 | career_cv_private_pdf_download_backfill | 20261021183000_… | identical, **different version number** |
| 20261021112805 | remove_unused_pg_net_after_self_cv_import | — | intentionally not in repo (see below) |
| 20261021182225 | career_portfolio_private_cases_and_files | 20261021182225_… | **added in this change**; was applied to the DB but missing from the repo |

## Notes
- `pg_net` was created and dropped again during a one-off CV import. The pair has no net effect, so no repo file exists for it. Do not re-create it.
- Repo file names were not renamed to the DB versions, to keep history and references stable. The Supabase CLI matches by version, so run `supabase migration repair` (or rename the files) before the first `supabase db push` from this repo. Do that only with an explicit decision, because it changes migration history.
- The DB is the source of truth for what is applied today. No database write was made for this reconciliation.
