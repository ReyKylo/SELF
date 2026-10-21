# SELF Career Phase 2 — Operations Release Gate
Date: 2026-10-21
Base: Career Phase 1 commit 4933918
Branch: feat/career-phase2-operations
Scope: incremental integration with original SELF shell and canonical data.

## Actual features
- Application pipeline: native HTML5 drag/drop across Wishlist / Applied / Interviewing / Offer / Closed. Dropdown stage for touch/keyboard; server-confirmed saves and Undo for latest successful move. Failure retains previous stage + Undo history. Existing career_applications table reused.
- Networking: owner-scoped career_touchpoints attached to canonical career_people; dated channel, summary and next step. Person drawer displays timeline; successful touchpoint updates last_contacted_at separately with truthful warning if secondary update fails.
- CV Library: version labels, target focus and notes. Private 8-MB PDF/DOCX stored in self-career-documents bucket; users only access their user-id prefix; browser requests a signed link for a 5-minute private download. Career Applications can reference a CV version. Existing records remain editable if a file upload fails.
- Interview Prep: sessions by existing career_applications, meeting date/format/status, preparation and reflection. No calendar side effects.
- Templates: draft text saved by category and copied to clipboard manually; no messages sent.
- Reminders: links to original SELF tasks via career_task_links; reuse existing task or create new canonical task, follow-up filtered view, open original task detail, unlink without deleting the task. When task creation succeeds but its link fails, task stays safely in My Work and the error clearly says so.
- Radar remains Phase 3 only, not automatically activated.

## Supabase database
Additive migration: supabase/migrations/20261021152000_career_phase2_operations.sql
- New: career_touchpoints, career_cv_versions, career_interviews, career_templates, career_task_links; each user_id owner policy for SELECT, INSERT, UPDATE, DELETE (4 policies).
- Old: core Tasks, Companies, People, Applications, My Links, Spaces and Boards retained.
- Application gains only nullable cv_version_id owner-composite foreign key.
- Task links enforce exactly one Career target and same-user ownership through composite foreign keys.
- Storage bucket self-career-documents public=false, size <=8 MiB, PDF/DOCX mime allowlist, owner-prefix RLS policies for select/insert/delete.
- Migration applied successfully to Supabase project btiwxqjiptbwaunjibjh and verified with read-only RLS, bucket and FK queries. No user data was reset or deleted.

## Changed code
- career-phase2.js: isolated operations (extends SELF Career Phase 1), CRUD, drop/stage, modal forms, canonical task linking, record timeline.
- career-phase2.css: scoped responsive UI and quiet interactions; no fullscreen dimming.
- career.js: uses new Phase2 pages/detail extensions, resets data on account switch, stays in same Career route.
- app.js: routes Career Phase2 actions/forms to shared app; supplies real Task CRUD, safe storage upload/signed read.
- index.html/tools/build_cloudflare.py: load and ship additional assets. No framework, no new SPA.
- CI regression test tests/smoke_career_phase2.cjs covers all Phase2 workflows including offline save, canonical Tasks, copy-only templates, private CV and account data separation; original Phase 1/Core/Concept C/D suites retained.

## Production browser acceptance not yet verified
- Run signed-in desktop 1536x900, 1366x768, mobile ~390px. Confirm comfortable large typography and light/dark at 100–150% scaling.
- Move application stage, refresh; Undo, refresh again. Confirm database persistence.
- Add Person interaction; refresh; verify timeline survives and Last Contacted updated.
- Upload PDF/DOCX, open private signed link, attach CV to Application. Test upload failures; verify error never silently claims full success.
- Add/edit interview and template; copy template; verify no automatic sending.
- Create/link follow-up Task, open in My Work, change status, view Career Reminders; unlink and ensure Task remains.
- Two authenticated accounts verify isolation, especially signed CV downloads. Mock tests and schema RLS review are not the same as real cross-account browser tests.
- Check layout and no flashes in existing SELF Whiteboard and Task Detail. No claim of Cloudflare production QA before browser check.

## Known limitations
- Native HTML5 drag and drop is desktop-friendly; dropdown offers mobile alternative.
- Each linked Task targets one Career record; task reuse across multiple Career records is a future enhancement.
- CV replacement/delete currently does not garbage-collect old private object files. Storage access remains private; cleanup can be added in later maintenance.
- No provider-based Opportunity Radar, automated follow-up notifications, email sends or interviews scheduled on Google Calendar.
- Pre-existing Supabase warning: leaked-password protection is disabled in Auth; not modified here.
