# SELF Rooms: redesign implementation blueprint

**Status:** proposal from the 2026-10-23 design exploration. Nothing here is implemented or approved yet.
**Prototypes:** `design/concepts/ledger.html`, `design/concepts/desk.html`, `design/concepts/rooms.html` (static and self-contained; not in the Cloudflare `ASSETS` list, so they never deploy).
**Base:** `main` at `c8b3f1a`. Re-verify every line reference below against latest `main` before editing.
**Executor:** a single Integrator session (per `AGENTS.md`). Shared files are touched in every phase, so each phase needs explicit user authorization.
**Detailed build spec:** [`ROOMS_BUILD_SPEC.md`](./ROOMS_BUILD_SPEC.md) covers the motion system, the drag-and-drop engine, screen-by-screen specs and copy-paste prompts per phase. Where the two differ, the spec wins.

---

## 0. Gates before any code

1. **The user picks the direction.** This blueprint assumes Rooms (Concept 3) with two parts borrowed from the other concepts: the Ledger capture grammar and the Desk keyboard layer.
2. **Amend the design contract.** `docs/DESIGN_CONTRACT.md` names Wireframe V2 as "the visual baseline, not disposable inspiration". Rooms replaces the shell and Home, so a docs-only PR (Phase R0) must record the user's approval and the new shell rules. Without that PR, no shell code merges.
3. **No Supabase changes.** Every phase uses tables, columns and RLS policies that already exist. Any PR that adds a migration is out of scope and gets rejected.
4. **One phase per PR, merged in order.** Rebase each phase on the newly merged `main`.

## 1. What the repository shows (verified)

| Fact | Where |
|---|---|
| The shell is one template: 8-item sidebar, topbar and 6-item mobile bar | `app.js:74` `chrome()`, `app.js:73` `nav()` |
| Routing is `state.view` mapped to a renderer | `app.js:226` `render()`, `app.js:227` `go()` |
| Career adds a second rail with 10 pages | `career.js:4` `PAGES`, `career.js:~196` `render()`, `career.js:261` `setPage()` |
| Career Prep adds a third layer of 10 tabs (Work Sample added in `14ef361`) | `career-learning.js:5` `TABS` |
| Home ranks tasks only; interviews and follow-ups never reach it | `app.js:81` `priorityRank()`, `app.js:90` `renderHome()` |
| Inbox can only be deleted from; there is no "turn into task" or "file to Space" | `app.js:185` `renderInbox()` |
| Inbox, tasks and the other Phase 1 tables allow owner `update` under RLS | `supabase/migrations/20261020172006_…sql:91-95` |
| Interviews (`scheduled_at`) and touchpoints (`next_step`, `contact_at`) are already loaded client-side | `career-phase2.js` `SELFCareerPhase2.ui` (`interviews`, `touchpoints`), `load(owner)` |
| People carry `last_contacted_at` and `relationship_stage` | `career.js` `ui.people`, migration `20261021135000` |
| Tests assert on markup strings: `sidebar`, `career-workspace`, `CAREER STUDIO` | `tests/smoke_render.cjs` |
| Deploys copy an explicit file list | `tools/build_cloudflare.py:9` `ASSETS` |
| CI runs `node --check` per file, then the smoke suite | `.github/workflows/self-quality.yml` |

The core problem: a user can face **three stacked navigation layers and 28 destinations** (8 + 10 + 10) before reaching content, and the daily view cannot see the Career data that drives the user's week.

## 2. The direction in one paragraph

SELF gets five **rooms**, organized by what the user is doing rather than by table: **Today** (plan the day), **Work** (all tasks, Spaces, links), **Hunt** (the hiring pipeline and people), **Study** (Career Prep) and **Studio** (whiteboards). A door rail replaces the sidebar, and each room allows at most one sub-navigation row. **Focus mode** opens any task full screen. A **Ctrl/⌘ K palette** replaces Search as the main way to move around and create. Every room tints the shell with an existing SELF accent (`COLORS` in `app.js`), so the palette carries over.

## 3. Route map (keep `state.view`; add rooms on top)

Do **not** rename or remove `state.view` values. Tests, `go()`, Career `enter()` and board routing depend on them. Rooms are derived from the view.

| Current destination | Room | Sub-section in room |
|---|---|---|
| `home` | Today | (none) |
| `inbox` | Today (triage card); full history at Work › Inbox | Inbox |
| `work` | Work | Tasks (List/Board/Calendar unchanged) |
| `spaces`, `space` | Work | Spaces |
| `links` | Work | Links |
| `career` with page `overview`, `applications` | Hunt | Pipeline |
| `career` with page `people`, `companies`, `radar`, `interviews` | Hunt | People, Companies, Radar, Interviews |
| `career` with page `cvs`, `templates`, `reminders` | Hunt | Kit (three tabs inside one section) |
| `career` with page `learning` | Study | Build: `sprint`, `analystlab`, `vclab`, `consultlab` · Learn: `masterclass`, `evidence`, `videos`, `sources` · Get challenged: `director`, `worksample` |
| `boards`, `board-editor` | Studio | Editor runs full bleed, rail collapsed |
| `search` | Palette (the page stays as a fallback route) | none |
| `settings` | Rail footer icon | none |

```js
// rooms.js
const ROOMS=[['today','Today','sun','blue'],['work','Work','list','cyan'],['hunt','Hunt','target','green'],['study','Study','graduation','purple'],['studio','Studio','board','yellow']];
function roomOf(view,careerPage){
  if(view==='career')return careerPage==='learning'?'study':'hunt';
  return {home:'today',inbox:'today',work:'work',spaces:'work',space:'work',links:'work',boards:'studio','board-editor':'studio'}[view]||null; // search/settings: no room
}
```

## 4. Phases

### R0 · Contract and approval (docs only)
- Add a "Rooms shell (approved YYYY-MM-DD)" section to `docs/DESIGN_CONTRACT.md` covering the door rail, the one-sub-nav-row rule, the room tint and Focus mode. Keep every existing accessibility rule: 16px base, 100–150% scaling, targets of about 40px or more, reduced motion, dark and light designed separately.
- Link this blueprint from `README.md`.
- **Accept when:** the user approves the PR in writing; no code changes.

### R1 · Door rail and room routing
**Files:** new `rooms.js`, new `rooms.css`; edit `app.js` (`chrome()`, `nav()`), `index.html` (script and link tags), `tools/build_cloudflare.py` (`ASSETS`), `.github/workflows/self-quality.yml` (`node --check rooms.js`), new `tests/smoke_rooms.cjs`.

- `rooms.js` exposes `window.SELFRooms={ROOMS,roomOf,renderRail(state),renderMobileBar(state)}`. `chrome()` calls it instead of building the sidebar inline.
- The rail keeps `class="sidebar"` and `aria-label="SELF navigation"`. Each door is a `<button data-action="room" data-room="…">`; the active door gets `aria-current="page"`.
- `handleAction` gets `action==='room'`, which calls `go()` with the room's default view (`today→home`, `work→work`, `hunt→career` with `SELFCareer.ui.page='overview'`, `study→career` with `ui.page='learning'`, `studio→boards`). Use Career's existing `setPage` path or set `ui.page` before calling `go('career')`, so `enter()` still runs.
- Door badges come **only from loaded state**: Today shows the count of tasks due today or overdue; Hunt shows interviews in the next 7 days, if `SELFCareerPhase2.ui.interviews` is loaded; Studio shows the board count. When data is not loaded, show no badge. Never show a placeholder number (contract gate 4).
- Mobile bar: exactly the five doors (Settings moves to the top bar). Each door is at least 48px tall and the bar respects `env(safe-area-inset-bottom)`.
- Keyboard: `Alt+1…5` switches rooms unless focus is in an input, textarea or contenteditable.
- The room tint is `--room` on `.shell`, set from the existing `COLORS` map. Use it on the active door, the room title accent and a soft radial wash at the top of `.main`. No full-colour backgrounds.
- **Accept when:**
  1. All current smoke tests pass unchanged, including `smoke_render.cjs` asserting `sidebar`.
  2. `tests/smoke_rooms.cjs` covers `roomOf` for every view and career page in §3, and checks that the rail renders five doors with exactly one `aria-current="page"`.
  3. At 1366×768 and 390×844, at 100% and 150% text scale, in dark and light themes, the page has no horizontal scroll. Prove it with Playwright screenshots stored under `docs/rooms-review/`.
  4. Every old destination is reachable in two clicks or fewer from any room.

### R2 · Today room
**Files:** new `today.js` (`window.SELFToday={render}`) and its CSS in `rooms.css`; `app.js` (`render()` maps `home` to `SELFToday.render`, with fallback to `renderHome`).

Layout (desktop: two columns, 1.35fr and 1fr; phone: one column):
1. **Three for today (left).** Candidates are open tasks sorted with the existing `priorityRank()`. Show the top three as large rows with a number, title, Space, checklist progress (`state.checklist`) and a **Focus** button. A swap control picks a different open task. Pins live in `localStorage` as `self.today.<userId>.<YYYY-MM-DD>`, wrapped in try/catch: a per-device convenience, no schema. Below the three, show "+N more open today → Work".
2. **Agenda (right, top).** One time-ordered list merged from:
   - tasks with `due_date` today or overdue (overdue first, with a red dot);
   - `career_interviews` where `stage='scheduled'` and `scheduled_at` falls within the next 7 days (WIB display);
   - follow-ups: the latest `career_touchpoints` per person with a non-empty `next_step`, plus people with `relationship_stage` in (`reached_out`, `in_conversation`) whose `last_contacted_at` is more than 14 days ago. Label the second kind "suggested", because it is a rule rather than a commitment.
   If Career data is not loaded, show one line: "Load Career agenda", which calls the existing Career loaders. Do not fetch Career data at app boot.
3. **Inbox triage (right, bottom).** Show one capture at a time with up to two ghost cards behind it. The actions reuse existing write paths:
   - *Make task:* `insert('tasks',{title,space_id})`, then `del('inbox',id)`. If the delete fails, keep both records and show a toast saying so (no false success).
   - *File to Space:* `patch('inbox',id,{space_id})`.
   - *Keep note:* move to the next card; local only.
   - *Delete:* the existing `delete-inbox` action.
4. **Capture bar** at the top: the Ledger grammar (R4 parser). Until R4 lands, keep the current Note/Task/Link/Board mode chips.

- **Accept when:** every agenda item links to its source record; an empty day shows "Nothing scheduled. Pick three from Work." and nothing invented; triage leaves no partial state on a failed request; there is a unit test for the agenda merge with fixed fixtures (time zone `Asia/Jakarta`).

### R3 · Hunt and Study rooms
**Files:** `career.js`, `career-learning.js`, `career.css`, `career-learning.css`.
- Add `SELFCareer.render({hosted:'hunt'|'study'})`. When hosted, the Career rail becomes a pill sub-nav limited to that room's pages. Keep the `career-workspace` wrapper and a visually hidden `<h2>CAREER STUDIO</h2>` so `smoke_render.cjs` stays truthful.
- Hunt › Pipeline puts a KPI strip above the existing `renderApplications` Kanban: counts per `hiring_stage` and stage-to-stage conversion. Show conversion only when the denominator is above zero. Add a "Needs a touch" side list using the same follow-up rule as R2.
- Study: group `TABS` into Build, Learn and Get challenged, with the tab ids unchanged. The sprint path shows Day 1 to Day 3 using progress from the canonical sprint Task's checklist, which already exists. Show no progress for days without a Task. Director Review keeps its "session only" label.
- **Accept when:** all Career smoke tests and `tests/browser_director_full_app.cjs` pass; Career deep links (`ui.page`) still work; drafts in Director Review survive switching rooms, matching the current behaviour.

### R4 · Command palette and capture grammar
**Files:** new `palette.js`, new `capture-parse.js` (pure, no DOM), new `tests/smoke_capture_parse.cjs`; `app.js` (keydown handler and topbar button).
- `parseCapture(text,{today:'YYYY-MM-DD'})` returns `{kind:'task'|'note'|'link', title, spaceName?, priority?, dueDate?}`. Rules:
  - an `http(s)` URL makes it a link;
  - `#word` matches a Space by name, case-insensitive;
  - `!high`, `!low` or `!normal` sets priority;
  - date words in Indonesian and English (`hari ini/today`, `besok/tomorrow`, weekday names meaning the next occurrence) or `due:YYYY-MM-DD` set the due date;
  - an imperative verb or a due date makes it a task;
  - anything else is a note.
  It **must never** invent a Space: if `#word` matches nothing, show "No Space named … — create it?" and do not create one silently.
- Palette (Ctrl/⌘ K, plus `/` when not typing): go to a room, open a task, Space, board, link or Career record from loaded state, or create through `parseCapture` with the existing `insert` paths. Arrow keys and Enter work; Esc closes and returns focus to where it was.
- **Accept when:** at least 25 parser fixtures pass, including Indonesian weekday edge cases across a week boundary; the palette meets WAI-ARIA combobox semantics; no network request fires per keystroke.

### R5 · Focus mode
**Files:** new `focus.js`; small hook in `app.js` (`data-action="focus-task"`).
- A full-screen dialog (`role="dialog"`, `aria-modal`) shows the large task title, status, priority and due chips, the checklist, and the notes textarea. **It reuses the existing `data-task-field` / `data-check` handlers**, so saving goes through today's `handleInput` and `patch`. Do not add a parallel save path.
- The side column holds a 25-minute timer (local only, not persisted) and "Next up": the other two of Three for today.
- Esc leaves and returns focus to the button that opened it. The current task panel (`renderPanel`) stays available as "Open full details".
- **Accept when:** a checklist toggle in Focus shows up in My Work without a reload; leaving with an unsaved field shows the existing unsaved indicator; no new tables or columns.

### R6 · Visual system
**Files:** `styles.css` (tokens), `rooms.css`, `index.html` (font link).
- Add `--room`, `--room-soft` and the display face **Bricolage Grotesque**, used only for room titles and Focus titles. Body text stays Inter / DM Sans, as today.
- Room titles are 2.6–4.4rem, clamped, and scale with `--scale`. Card radius is 20px for room-level cards and 12px for list items.
- Design light and dark separately: room tints in light mode use the darker variants from the prototype (`rooms.html` `:root[data-theme="light"]`).
- **Accept when:** WCAG AA contrast holds for text and controls in both themes (record the measured ratios); `prefers-reduced-motion` turns off the room slide; at 150% text scale nothing clips.

## 5. Global acceptance (every phase)
- `node --check` passes on every JS file, and every command in the README "Checks" section passes.
- No new Supabase migration, table, column, bucket or policy.
- Browser QA runs on the Playwright fixture pattern from `tests/browser_career_learning.cjs`, which intercepts Supabase, so production is never written to.
- Screenshots at 1366 and 390, at 100% and 150%, in dark and light, are committed under `docs/rooms-review/<phase>/`.
- No placeholder counts or sample records in production markup.
- A passing CI run does not mean the change is deployed. Report live verification separately.

## 6. Non-goals
No AI features, no changes to the Concept D canvas editor's internals, no new Career data, no rewrite of Task Detail (`renderPanel`), and no persistence for focus timers or Director Review answers.

## 7. Risks and how to handle them
| Risk | Mitigation |
|---|---|
| `handleAction` exits early for `[data-career]` / `[data-learning]` clicks, so room pills inside Career could be swallowed | Room pills use `data-action="room"` outside Career markup; Career-hosted pills keep `data-career="page"` |
| `go()` resets `taskId`, `pageId` and `modal`, which would close Focus mode on a room switch | Focus mode is closed explicitly before `go()`; document this in `focus.js` |
| String-matching smoke tests break on markup changes | Keep the asserted strings truthful (visually hidden headings, kept class names); update a test only with Integrator approval and say so in the PR |
| Career data is loaded lazily | Today shows a "Load Career agenda" control instead of loading at boot or showing empty numbers |
