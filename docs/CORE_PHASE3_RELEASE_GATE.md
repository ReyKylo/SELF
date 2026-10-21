# SELF — Core Phase 3 Release Gate
Date: 2026-10-21
Scope: strengthen the existing SELF foundation before Career.

## Delivered
- My Work drag-and-drop across To Do / Planning / In Progress / Review / Done. Real backend status updates, clear drop targets, native keyboard/touch-compatible status dropdowns.
- Undo the most recent successful stage move. If an undo fails, history is preserved to retry.
- Accurate Saved, Saving, Unsaved changes and Not saved feedback. Failed Quick Capture, task/space/link/subpage creation or deletion does not dismiss forms or erase typed drafts.
- Task Detail no longer darkens/blurs the whole screen or replays overlay animations on every save.
- My Priorities across all Spaces: overdue, due today, high priority, dated and normal work.
- My Links remains a GENERAL library: one displayed tile for the same URL referenced in tasks, boards and Quick Capture, plus source filters and search. Original relationships are not deleted.
- Global Search covers tasks, Spaces, boards, inbox notes and general links. Board results open the existing whiteboard.
- A failed optional URL-indexing step no longer makes an already-successful note write appear lost.

## Unchanged
- Concept D whiteboard and its data.
- Career routes and Opportunity Radar automation.
- Supabase tables, migrations, policies, data and bucket. No destructive database actions.
- The existing SELF shell and its light/dark/text scale settings.

## Automated release gate
- Existing Phase 1, Phase 2, Concept C and Concept D regression suites stay green.
- tests/smoke_core_phase3.cjs covers stage moves, Undo failures, native dropdowns, partial network failures, unsaved edits, safe Quick Capture, priority ranking, My Links and global board search.
- Cloudflare Workers static build passes.
- Read-only database audit confirmed RLS enabled and 4 owner policies on 11 core tables.

## Production UI acceptance (still outstanding)
- At desktop and mobile sizes ensure columns, dropdowns and search remain visible.
- Move status, refresh, Undo and refresh again; backend persists both changes.
- Disable network when saving a Task Note: no data vanish and no false Saved indicator.
- Failed Quick Capture retains entered words; retry does not duplicate entries.
- Verify general My Links with repeated URLs across spaces; Career-specific grouping is NOT introduced.
- Search an existing board, open it, and verify Concept D writing, connecting and zooming are unaffected.
- Verify dark/light, 100–150 percent text scaling, no flicker.

## Known caveats
- Native drag-and-drop depends on device/browser; card status select is the reliable fallback.
- My Links dedupe applies to display, not deletion of underlying source records.
- Auth leaked-password-protection warning remains open as pre-existing configuration work:
  https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- GitHub CI uses smoke tests; the authenticated Cloudflare production app is not yet browser-verified.

## Next
After live UI acceptance: freeze Phase 3 Core and start approved Career Phase 1 inside SELF. Do not redesign the overall app.
