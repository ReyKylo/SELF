# SELF Career — Phase 1 Integration Release Gate

Date: 2026-10-21
Base: Core Phase 3 on main (284f77a)
Approved source: SELF Career Integration Design Pack, October 21, 2026.
Status: additive database deployed, integrated client implemented in a feature PR. CI must be green before merge. Logged-in Cloudflare browser acceptance is a separate gate.

## Exactly what Phase 1 delivers
- ONE new Career item within existing global SELF sidebar (Home, Spaces, Boards, My Work, My Links, Inbox, Career, Search, Settings).
- ONE Career route with nine internal subpages: Overview, Applications, People, Companies, Opportunity Radar, CV Library, Interview Prep, Templates, Reminders.
- Overview with real manually entered Applications/People, a direct link to existing My Work for canonical tasks, and truthful inactive Radar design specs.
- Owner-scoped CRUD for canonical Company, Person and Application records, with forms and no generated/demo data in production.
- Applications grouped visually as Wishlist / Applied / Interviewing / Offer / Closed. Phase 1 editing is through the drawer, not drag-and-drop.
- People grouped as New / Reached Out / In Conversation / Maintain, independently from application stage.
- Company profiles show connected People and Applications; application deletion is separate; company deletion with active applications is denied by FK.
- Inline record forms in a familiar SELF-style side drawer. Explicit Save with visible errors and unchanged drafts on failed writes. Escape/close with unsaved-edit prompt. No screen-dimming overlay.
- Manual Career Quick Capture with Company, Person, Application, and existing SELF Task action. No duplicate Career tasks.
- Career website/profile/posting links contribute to the general My Links library without turning it into a Career feature.
- Dark/light and the existing SELF font scaling (100–150 percent), responsive internal rail and mobile horizontal subnavigation.

## Scope intentionally reserved
- CV uploads/version management, interview sessions, templates and Career-linked reminders: Phase 2.
- Application stage drag/Undo, networking touchpoint history, Career-to-Tasks join records: Phase 2.
- Opportunity Radar provider ingestion/relevance ranking and AI assist: Phase 3.
- Daily Radar spec 06:00 WIB, Jakarta, relevance >=75 percent, max 15, clusters Investment/Strategy/Venture/Fintech is DISPLAY ONLY. No automation is created or activated.

## Database and security
- Migration: supabase/migrations/20261021135000_self_career_phase1_core.sql
- Tables: career_companies, career_people, career_applications.
- Each table has user_id, owner-scoped RLS SELECT/INSERT/UPDATE/DELETE policy, UUID PK and composite (id,user_id) uniqueness.
- Person and Application company references use owner-composite foreign keys.
- Person company FK clears only company_id on delete; application FK RESTRICT protects linked application records.
- Applied additive migration successfully on btiwxqjiptbwaunjibjh. Existing Supabase Tasks, My Links, Concept D boards and data are unchanged.
- Database read-only SQL audit verified RLS enabled and four policies for each Career table; FKs confirmed. Mock API tests test owner visibility. Live two-account auth tests remain an acceptance item.
- Supabase security advisor has an unrelated pre-existing Auth warning: leaked-password protection disabled. See https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Code changes
- app.js: one Career route, nav, existing auth/API adapter, optional general My Links source (no new canonical link database).
- career.js: isolated rendering/events/state and owner-aware cache reset. No separate SPA shell or framework.
- career.css: scoped responsive surfaces and drawer. Preserves original SELF CSS tokens.
- index.html: Career assets deferred before app.js module.
- tools/build_cloudflare.py: copies and verifies new assets.
- tests/smoke_career_phase1.cjs: nine subpages, inactive Radar, create/edit/delete, reference links, server failure, account isolation in mocks.
- .github/workflows/self-quality.yml: adds new regression and JS syntax checks, retains all existing tests.

## Release acceptance still to do in a signed-in browser
1. Test at 1536px, 1366px and 390px; compare to approved Career integration wireframe. Dark and light, text scaling 100%, 125%, 150%.
2. Create Company, then Person linked to Company, then Application linked to Company. Refresh; confirm all three records and editable notes persist.
3. With linked Application try deleting Company; confirm no partial deletion, proper error. Delete Application and repeat if desired.
4. Test Quick Capture SELF Task: appears in existing My Work/My Priorities and NOT a Career-only task copy.
5. Go to My Links without first opening Career: Career website/posting should show once alongside general links after fetch.
6. Disable network when saving Company notes, ensure draft doesn't vanish and no false Saved claim.
7. Verify all old SELF areas and Concept D Whiteboard behave identically; no flashing or canvas re-mount regression.
8. Test cross-user RLS with two real authenticated users; automated mocks and policy inspection are insufficient for this full claim.
9. Deploy Cloudflare commit, then check browser console, forms and response errors; GitHub CI is not a substitute.

## Operational guidance
- Do not rerun this migration manually if it is already in migration history.
- If the Career API request fails before the schema is present, the Career page shows a load error while other SELF routes continue working.
- This implementation is deliberately incremental. Do not start Career Phase 2 until Phase 1 UI/data is accepted.
