# SELF — Phase 1 visual / interaction contract (Wireframe V2)
**Reference:** User-approved nine-screen dark UI wireframe, 20 October 2026. Keep this design as the baseline for subsequent phases. Rebuilds may improve implementation but must not silently substitute a generic template.

## Visual DNA
- Spacious charcoal canvas, darker left navigation, rounded graphite surfaces, cool blue primary actions, restrained pastel space-category accents.
- Clear hierarchy: meaningful large titles; generous breathing room and comfortable card padding. No tiny default type.
- Sidebar left with Home / Spaces / Boards / My Work / My Links / Inbox / Search / Settings; consistent orientation across views.
- Home: warm heading, single prominent Quick Capture card, My Priorities side-by-side with Continue Where You Left Off, unobtrusive activity metrics below.
- Spaces: large square-ish visual tiles with distinctive accent and icon; add tile last.
- My Work: structured task grid with Space, Status, Priority and deadline. Space assignment is not limited to work.
- Task Detail: generous right-side Notion-like sheet with large editable title, editable properties, Description / Checklist / Notes / Links / Subpages; do not reduce task details to a checkbox popup.
- Dark and Light themes designed intentionally, not inversion. Theme is persistent.
- Type default 16px, up to 150% scaling. Clickable targets generally around 40px or larger. Reduced-motion preference respected.
- Clicky feel: 140–240ms hover/press feedback, hover elevation and subtle side panel animation. Functional controls always show success/error state.

## Acceptance gates
1. Verify nine-screen hierarchy against user reference before announcing visual parity; screenshot actual running browser desktop/mobile, not a generated mockup.
2. Verify Add/Edit/Delete Task, checklist, notes, status, space, link auto capture, dark/light toggle and text scaling with real state changes.
3. Confirm Supabase RLS auth separation across at least two accounts.
4. No invented counts or placeholder user data in production. Empty states should invite correct next action.
5. Honor Phase boundaries: board canvas intentionally reserved for Phase 2.
6. Never force-push or overwrite prior work without inspecting the target branch.

## Known follow-ups
- Phase 1 Notes use a plain textarea with markdown shortcuts. A full block editor with richer interaction is a future enhancement.
- Actual visual screenshot QA remains required before claiming exact parity with reference.
