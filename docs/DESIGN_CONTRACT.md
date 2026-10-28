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

## Rooms shell (approved 2026-10-23)
The user approved the Rooms direction and asked for it to be built. Spec: `docs/design/ROOMS_BUILD_SPEC.md`; reasoning: `docs/design/ROOMS_REDESIGN_BLUEPRINT.md`.
- **Navigation:** five doors (Today, Work, Hunt, Study, Studio) replace the eight-item sidebar. Each room has at most one row of sub-navigation. Settings and Search stay reachable. `state.view` values are unchanged. `?shell=classic` restores the previous shell.
- **Tint:** each room tints the shell with an existing SELF accent. The tint appears on the active door, the aurora wash, the room's primary buttons and its kicker. Status and priority colours stay semantic.
- **Badges** come only from loaded data. No placeholder numbers (gate 4 below still applies).
- **Motion:** 90 to 420 ms, transform and opacity only, entrance once per navigation (never on a data refresh), and everything off under `prefers-reduced-motion`.
- **Drag and drop** works by mouse, touch and keyboard, saves only through the existing save functions with Undo, and never implies an order that is not stored.
- **Today (Home in Rooms):** Quick Capture stays on top. My Priorities becomes **Three for today** (pinned or best-ranked open tasks) beside an Agenda and an Inbox triage stack; Continue Where You Left Off and the activity counts stay below. The classic shell keeps the original Home.
- **Palette:** Ctrl/⌘ K (or `/` outside a text field) opens a command palette: go to a room or section, open a task, Space, board, person or company, or create from shorthand (`Kirim CV besok #Career !high`). It never creates a Space without an explicit command and saves nothing until Enter. The classic shell keeps Ctrl K for Search.
- **Unchanged:** 16px base text with 100 to 150% scaling, targets around 40px or more (doors 72px; the phone bar 58px plus the safe area), designed dark and light themes.

## Apple layer (requested 2026-10-28)
The owner asked for the visuals to be rebuilt "more Apple" and then for everything to be built. `apple.css` (loaded last) re-skins the Rooms shell to Apple HIG conventions: system font and macOS type ramp, neutral system surfaces in dark and light, a floating glass sidebar with labelled rows, segmented sub-navigation, flat tinted buttons. It changes the charcoal and gradient parts of the Visual DNA above on purpose; room tints, room structure, theme persistence, text scaling and reduced motion stay. Details, the status of every idea and what is still open: `docs/design/APPLE_REBUILD.md`.

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
