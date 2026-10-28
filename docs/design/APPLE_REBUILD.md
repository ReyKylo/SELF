# SELF Apple rebuild: what is built, what is not

Date: 2026-10-28 · Branch: `claude/funny-curie-0q19xv` · Requested by the owner in chat ("rebuild the visuals, more Apple", then "build everything").

This turns the wireframes in `design/concepts/` into the real app where it is safe to do so without a schema change. The wireframes stay as the reference:

| File | What it shows |
|---|---|
| `design/concepts/rooms-wireframe-v4.html` | Apple visual baseline for all rooms |
| `design/concepts/rooms-wireframe-v5.html` | v4 plus the review fixes: Today timeline, smart capture, ⌘K, Hunt company view, editable inspector, states |
| `design/concepts/studio-canvas-v6.html` | 43 canvas ideas, each with a Try it button |

Everything below is in production source and covered by tests. Nothing here needs a Supabase migration, and no shared database state was written.

## 1. Visual layer (`apple.css`, loaded last)

- System font stack with the macOS type ramp (14px base on desktop, 16px on phones; the 100–150% text scale still applies).
- Neutral system surfaces for dark (true black, raised greys) and light (#f5f5f7), Apple system colours for semantic states.
- Sidebar: floating glass panel with labelled room rows on desktop, an icon column from 601 to 960px, and the bottom bar on phones (the 48px door height test still holds).
- Glass top bar, flat tinted primary buttons, hairline cards, fields on a fill.
- Work and Career sub-navigation become segmented controls.
- The aurora gradient behind rooms is removed (HIG: no surface gradients). Room tints from `rooms.css` are unchanged; one tint is visible at a time.
- Lesson prose keeps a ~68 character measure.

## 2. Today (`today.js`, `app.js`)

- **Next up** card: the SELF Calendar event or interview happening now or starting within the hour; otherwise the first of Three for today, with the reason ("Overdue by 2 days", "Due today"). Pure `nextUp()`.
- **Schedule** card: today's timed SELF Calendar events (`self.cal.events.<user>`, already mirrored to `user_kv` by `user-sync.js`) and scheduled interviews, in time order, with a red now line. Tasks have dates but no times, so they stay in Three and Agenda.
- **Quick Capture** has no Note/Task/Link/Board picker. It previews what `capture-parse.js` reads (kind, Space, due date, priority, warnings), saves on Enter, then offers Undo. The kind chip only overrides the guess. Old explicit modes still work (`state.captureMode`).
- Today refreshes once a minute when nothing is being typed or dragged.

## 3. Work and states (`app.js`)

- Status, priority, Space and due date changes in Task Details show the change in words with Undo.
- Offline is a state, not an error: the save indicator says "Offline", one toast explains it, and "Back online" when it returns. A save that fails offline says the typed text is kept.

## 4. Canvas (`canvas-v3.js`, `canvas-v3.css`)

- Ctrl/Cmd+F find with highlights and Enter to step through matches.
- Ctrl/Cmd+1–9 jumps to frames in Present order; Ctrl/Cmd+0 fits all.
- C on a selected object, arrows to pick a target, Enter to connect (also the accessible path).
- Pasting a list makes one sticky per line; pasting plain text makes one sticky.
- Under 30% zoom, cards become quiet blocks and frame titles scale up (a fitted board, about 35%, still shows text).
- Delete offers Undo in the toast; / opens the insert menu; ? toggles the help line.
- Frame titles use the label colour in light mode (the default dark-mode ink was below 3:1).

## 4b. Canvas round 2 (2026-10-28)

- Glass chrome for the canvas header, toolbar, bottom tools and insert menu.
- Type to create: while editing, Tab adds a connected sticky to the right and Alt+Enter a sibling below, both ready to type in. Dragging a connector into empty space already existed in SELF; the new object now opens for typing.
- Outline panel (O or the list button): frames in Present order, contents, "Still empty" marker, click to fly.
- Presenter notes per frame in the walkthrough bar, stored under `self.studio.notes.<board>.<frame>` (mirrored to the account by `user-sync.js`; no schema change). Timer and pace already existed.
- Cards linked to a task show it live: status, due date, overdue, done, or "Task removed".
- Tests: `browser_canvas_additions` (extended), `browser_canvas_live_task` (new).

## 5. Status of every idea from the reviews

### Rooms review (v4 → v5)

| Idea | Status |
|---|---|
| Today as a timeline with Next up | Built (Next up + Schedule + now line) |
| Smart capture, no kind picker, Undo | Built |
| ⌘K palette | Already in SELF (`palette.js`), restyled |
| Hunt company detail | Already in SELF (Company Dossier + Game Day in `dossier.js`) |
| Replace dashboard stat tiles | Partly: Hunt pills restyled; Today's count bar is unchanged |
| Calendar week view, phone access | Already in SELF (`calendar.js`, Calendar door in the phone bar) |
| Empty, loading, error, offline states | Offline built; empty and error states already existed per room; no new skeleton loaders |
| Editable inspector with Undo | Built as Undo on the existing Task Details fields; still a side sheet, not a split view |
| Smooth room tint | Already in SELF (`rooms.js` glides the tint) |
| Study reader | Built as a readable measure; no separate reader mode |

### Canvas ideas (43 in `studio-canvas-v6.html`)

- **Built now:** find, frame jump keys + fit all, keyboard connect, paste a list, semantic zoom, delete with Undo, / insert, help line with keys.
- **Already in SELF before this work:** insert menu on double-click, duplicate (Ctrl/Cmd+D), fit selection (F), undo/redo, Present walkthrough, recipes, minimap, image paste/drop, link paste, contextual toolbar, connector labels and routing, frames, smart align/tidy on multi-select, cards placed on several boards.
- **Wireframe only (not built):** type-to-create with Return/Tab, drag a connector into empty space to create, pen shape recognition, sticky stacks, auto-layout frames, lock frame, kanban frame that changes task status, live task/pipeline cards on the canvas, Company Map prefill from Hunt, Weekly Map synced with Today, Story Bank flashcards, presenter notes and rehearsal recording, export as memo/PDF/image, outline panel, focus a frame, version history, offline queue on the canvas, simulated-case chip on boards.

Why some are not built: several need data SELF does not store yet (version history, presenter notes, frame layout and lock flags, kanban status columns), or they write across rooms (live cards, Weekly Map sync) and should get their own design review and tests before they change shared records. They are good next steps; none is blocked by this branch.

## 6. Tests

New, all wired into CI:

- `tests/smoke_today_now.cjs`: `scheduleFor` and `nextUp`, pure.
- `tests/browser_today_now.cjs`: Next up, Schedule, now line, smart capture to a task with Space, due date and priority, Undo, kind override.
- `tests/browser_work_undo.cjs`: Undo on task properties, offline and back-online states.
- `tests/browser_canvas_additions.cjs`: find, frame jumps, keyboard connect, paste list, delete Undo, far zoom, / insert.

Full local run on this branch: 70 of 70 test files pass. Cloudflare build passes and ships `apple.css`.

## 7. Still open (honest)

- **Real logged-in browser QA** on the deployed site, light and dark, desktop and phone. All checks so far ran against the synthetic fixture.
- The canvas keyboard additions use plain letters (C, /, ?) only when no field has focus, the same rule as the existing R, N, V and F keys.
- Push: the branch could not be pushed from the Claude session (GitHub returned 403). Push it and open a PR once the GitHub connection has write access.
