# SELF product upgrade plan: from five modules to one career operating system

**Build status (24 Oct 2026):** built so far: Studio Recipes (§5.2, `studio-recipes.js`, six recipes), Walkthrough (§5.3, `studio-present.js`), Message Composer (§5.7, inside Outreach), Hunt Outreach (replaces the People page), Daily Drill (§5.12, device-local), Export and bulk actions (see ERP_UX_PLAN). Still to build: Dossier, Game Day, Weekly Review, Shutdown, Add to calendar, Radar Swipe, Harvest, Structure Check, Skill Map, Proof Pack and all Wave 2 items.


**Role:** product direction, written as the PM for SELF. It sits on top of the Rooms redesign ([blueprint](./ROOMS_REDESIGN_BLUEPRINT.md), [build spec](./ROOMS_BUILD_SPEC.md)) and turns it from a visual change into a product upgrade.
**Base:** `main` at `14ef361` (includes Career Prep Phase 6 Work Samples).
**Builders:** Sonnet and Haiku, one phase per PR, using the prompts in §8. Nothing here has been built.

---

## 1. What SELF is, and what's holding it back

SELF is unusual. It puts four things in one private app that normally live in four products:
1. a personal task system (Spaces, Tasks, Inbox, Links);
2. a thinking canvas (Concept D whiteboard: shapes, knowledge cards, frames, smart connectors, layouts, images);
3. a job-search CRM (companies, people, applications, touchpoints, interviews, CVs, templates, Radar);
4. a professional training studio (sprints, 18 lessons, analyst labs, Director Review, Work Samples, a portfolio with private files, 36 competencies).

**The problem:** these four were built in phases and they barely talk to each other. In the code today:
- A company, its people, its applications, its interviews and your notes about it live on **five separate pages**. Nothing shows "everything about Northstar".
- The canvas can hold Task cards, but **not** a company, person or application. Career thinking happens outside the thinking tool.
- Career Prep produces real work (labs, Work Samples, portfolio files), but none of it shows up when you **interview** with a firm, which is the moment it matters.
- Interview reflection, thank-you notes and follow-ups depend on memory. The data exists (`career_interviews.reflection`, `career_touchpoints.next_step`, `career_templates`), but nothing asks for them at the right time.
- There's no rhythm. SELF answers "what exists?" but never "what should I do this week, and how did last week go?"

**The thesis:** keep the data, connect it, and add **rituals**: moments where SELF hands you the right things at the right time. The Rooms shell decides where things live. This plan decides what each room does better than any single-purpose app could.

## 2. Product principles (the taste filter)
Every feature below passed these five tests. Use them to reject future ideas too.
1. **Connect before you create.** Prefer a feature that links existing data over one that adds new data entry.
2. **Rituals beat dashboards.** A 10-minute guided weekly review is worth more than a page of charts.
3. **Honest by construction.** No invented numbers, no fake AI, no implied saved order. "Self-check" never reads as "expert reviewed". Simulated cases stay labelled SIMULATED.
4. **The canvas is for thinking like an analyst.** Templates should encode real analyst structures (issue trees, deal theses, memo spines), not generic mind maps.
5. **Additive and reversible.** Wave 1 needs no database change. Wave 2 changes are additive columns and tables with RLS, each approved separately.

## 3. The upgrade at a glance

| # | Feature | Room | What it does | Wave | Size | Builder |
|---|---|---|---|---|---|---|
| 1 | **Dossier** ★ | Hunt | One living page per company: people, applications, interviews, touchpoints, tasks, boards, Radar source | 1 | L | Sonnet |
| 2 | **Studio Recipes** ★ | Studio | Analyst-grade board templates: Issue Tree, Deal Thesis, IC Memo Spine, Story Bank, Company Map | 1 | M | Sonnet |
| 3 | **Walkthrough** ★ | Studio | Present a board frame by frame with camera moves, for rehearsing a case | 1 | M | Sonnet |
| 4 | **Game Day** ★ | Hunt × Study | Interview prep cockpit: dossier, the track's Director challenges, story bank, timer, then reflection and thank-you | 1 | L | Sonnet |
| 5 | **Weekly Review** | Today | Sunday ritual: close, carry, follow up, pick next week | 1 | M | Sonnet |
| 6 | **Shutdown** | Today | End-of-day carry-over and one-line log | 1 | S | Haiku |
| 7 | **Message Composer** | Hunt | Template plus person and company merge fields, copy, then "Log as sent" | 1 | S | Haiku |
| 8 | **Add to calendar** | Hunt | Download an `.ics` file for any interview | 1 | S | Haiku |
| 9 | **Radar Swipe** | Hunt | Triage Radar results as a card deck (reuses the triage stack) | 1 | S | Haiku |
| 10 | **Harvest** | Studio | Selected canvas cards become Tasks in one move | 1 | S | Sonnet |
| 11 | **Structure Check** | Studio | Finds empty cards, orphans and unlabeled branches before you present | 1 | S | Haiku |
| 12 | **Daily Drill** | Study → Today | One 5-minute lesson check a day | 1 | S | Haiku |
| 13 | **Skill Map** | Study | 36 competencies: what the content covers vs what you've produced | 1 | M | Sonnet |
| 14 | **Proof Pack** | Study | One-page summary per track of your decision, checks and files | 1 | M | Sonnet |
| 15 | **Live Cards** | Studio | Company, person and application cards on the canvas with live state | 2 | M | Integrator + Sonnet |
| 16 | **Stage history** | Hunt | Time in each stage and median days to reply | 2 | M | Integrator + Sonnet |
| 17 | **Momentum** | Today | A quiet heatmap of completed work | 2 | S | Integrator + Haiku |
| 18 | **Repeat** | Work | Recurring tasks | 2 | M | Integrator + Sonnet |
| 19 | **Synced progress** | Study | Drills and Skill Map evidence across devices | 2 | S | Integrator + Haiku |

★ = flagship bet. "Integrator" means a reviewed additive migration, run once by the authorized Integrator only (AGENTS.md).

## 4. Repackaging: what gets merged, renamed or retired
Taste is also subtraction. These changes reduce surface without losing anything.

| Today | Becomes | Why |
|---|---|---|
| Career › Overview + Applications | Hunt › **Pipeline** | Two pages showing the same funnel |
| Career › Companies (a list) | Hunt › **Dossiers** | The company becomes the hub object (§5.1) |
| Career › CV Library + Templates + Reminders | Hunt › **Kit** | Supporting material, used occasionally |
| Career › Reminders as a separate concept | **Follow-ups** shown in Today's agenda (still stored as SELF Tasks via `career_task_links`) | A reminder is a task with a date; Today already shows those |
| Career Prep's 10 tabs | Study › **Build / Learn / Get challenged** (Work Sample sits under Get challenged) | Three verbs instead of ten nouns |
| Quick Capture mode buttons | One capture line with grammar (`#space !high besok`) | Fewer clicks, same data |
| Interview Prep page | Hunt › Interviews, opening into **Game Day** | Prep becomes an event, not a form |
| `?canvas=legacy` editor | Retire **after** Rooms ships and the user confirms no legacy-only boards remain. Data is untouched; same tables. | Two editors means double maintenance. Needs its own approval. |
| The "Opportunity Radar" name | **Radar** | Shorter; the "on-demand, estimated relevance" wording stays |

## 5. Feature specs

Each spec covers: the problem, the experience, what it reuses, data changes, acceptance criteria, and what it must never do.

### 5.1 Dossier ★ (Hunt)
**Problem.** Company knowledge is spread across 5 pages; before a call you open them one by one.
**Experience.** Hunt › Dossiers lists companies as cards (name, industry, open applications, people, last touch). Opening one shows:
```
Northstar Capital (sample)              Investment · Jakarta   [Open board] [Compose message]
┌ Applications ─────────────┐ ┌ People ───────────────────────┐ ┌ Next ─────────────────────┐
│ Analyst, PE  Interviewing │ │ Sari · Associate  19d  ● late │ │ Fri 15:30 Case interview  │
│ applied 14 Okt · CV v3    │ │ Dimas · Analyst   12d         │ │ [Game Day] [Add to cal]   │
└───────────────────────────┘ └───────────────────────────────┘ │ Task: send notes (Sat)    │
┌ Timeline (newest first) ──────────────────────────────────────┐ └───────────────────────────┘
│ 22 Okt  ✉ Touchpoint with Sari: coffee chat · next: send notes │ ┌ Your work ────────────────┐
│ 14 Okt  ➜ Applied: Analyst, PE (CV v3)                         │ │ Board: Northstar map      │
│ 10 Okt  ★ Saved from Radar (score 82: investment, Jakarta)     │ │ Work Sample: PE (draft)   │
│  2 Okt  ✎ Company note edited                                  │ └───────────────────────────┘
└────────────────────────────────────────────────────────────────┘
Research notes (company.notes, editable inline)
```
- **Timeline** merges, by date: touchpoints (`contact_at`) for people at this company, applications (`applied_at`, or `created_at` as "Added"), interviews (`scheduled_at`), Radar items with `application_id` pointing to its applications, and linked tasks (`career_task_links.company_id` or via the application or person). Label every row with its source.
- **Your work**: boards whose cards reference the company (Wave 2 Live Cards; in Wave 1, boards **titled** with the company name are matched case-insensitively and labelled "matched by title"), plus the portfolio or Work Sample for the application's track.
- **Open board**: creates or opens the board "<Company> map" from the Company Map recipe (§5.2).

**Reuses** existing loaders (`SELFCareer.ui.companies/people/applications`, `SELFCareerPhase2.ui.interviews/touchpoints`, `SELFCareerPhase3.ui.items`) and the existing record drawers for editing. **No schema change.**
**Never** fetch outside data about a company, or show "last touch" for people without touchpoints ("No contact logged").
**Accept when:** every timeline row opens its source record; a company with no linked data shows "Nothing linked yet: add a person or an application" with both buttons; and a unit test covers the merge with fixtures for all 5 sources.

### 5.2 Studio Recipes ★ (Studio)
**Problem.** The canvas has one generic starter ("Moodboard"). An analyst needs structures.
**Experience.** "New board" opens a recipe picker (cards with a mini preview):

| Recipe | Structure (frames, then cards inside) | Track |
|---|---|---|
| **Issue Tree** | Key question, then 3 branches (MECE), then 2–3 hypotheses each, plus an "Analyses to run" frame; tree layout | Consulting |
| **Deal Thesis** | Thesis, then Value drivers, then Key risks, then Diligence questions, then Kill criteria; flow layout | PE |
| **IC Memo Spine** | Recommendation, Market, Product, Traction (cohorts/NRR), Team, Terms and ownership, Risks, Ask | VC |
| **Story Bank** | 6 STAR cards (Situation / Task / Action / Result) tagged by competency: leadership, analysis, conflict, failure, initiative, teamwork | Interviews |
| **Company Map** | Company, then People (one card each), Applications, Open questions, Notes; pre-filled from the Dossier | Hunt |
| **Weekly Map** | This week's three, Wins, Carry-over, Learn next | Rituals |

- **Build approach:** generalise the existing `makeStarter()` in `canvas-v3.js` (about line 571) into `buildFromRecipe(recipe)`. It already inserts `knowledge_cards`, `board_items` and `board_edges` in sequence, with "Starter incomplete" error handling. Recipes are **data**: one JSON file, `content/studio-recipes.json`, with `{id,title,track,objects:[{kind,x,y,w,h,title,summary?,parent?}],edges:[[a,b,label?]]}`. Expose `SELFBoards.createFromRecipe(title, recipeId, {spaceId, fill})`, where `fill` substitutes `{company}`, `{person}` and similar from a Dossier.
- **Layout:** after creation, call the existing `applyLayout('tree'|'flow')`, then `fitBoard()`.
- **Never** insert recipe content into an existing non-empty board (same guard as `makeStarter`), or claim recipes are expert-certified. Each recipe gets a "Structure guide" card with a one-line source note (e.g. "Issue tree: standard hypothesis-driven structure").

**Accept when:** each recipe creates the right number of cards and edges (unit test against the JSON); a mid-creation failure leaves a message and a reloadable board; the `fill` substitution is HTML-escaped.

### 5.3 Walkthrough ★ (Studio)
**Problem.** In case interviews you present a structure. SELF boards can't be presented.
**Experience.** A "Present" button in the board toolbar.
- **Slide order:** frames ordered by their connecting edges when frames are chained, otherwise reading order (top-to-bottom bands, then left-to-right).
- **Controls:** → / Space for next, ← for previous, Esc to exit. A mono progress strip (`3 / 7`) and the frame title sit at the bottom.
- **Camera:** each step animates the camera to fit the frame. Reuse `fitEntities()` (it already exists); add a 450 ms eased camera interpolation, or jump instantly under reduced motion.
- **Chrome:** the editing UI fades out and objects are read-only while presenting.
- **Rehearsal timer** (optional): set a target duration (e.g. 5 min); the strip shows pace (ahead or behind).
- **No schema change.** The slide order is computed, not stored.

**Accept when:** a board with 0 frames shows "Add frames to present: each frame becomes a step"; presenting never mutates the board (asserted by a test spying on `insert`/`patch`/`del`).

### 5.4 Game Day ★ (Hunt × Study)
**Problem.** The interview is the payoff moment for all of Career Prep, yet prep is a blank form and reflection is optional.
**Experience.** Opens from an interview (Hunt › Interviews, the Today agenda, or a Dossier). Three phases follow the interview's time:
```
BEFORE (until scheduled_at)                     DURING (±2 h)           AFTER (until +48 h)
┌ Countdown 1h 28m · video · Strategy Analyst ┐  Full-screen "Focus"    ┌ Reflection (required prompt) ┐
│ Dossier summary (5.1)                       │  with your 3 talking    │ What went well / what to fix │
│ Likely challenges: Director Review prompts  │  points and the timer   │ → saved to interview.reflection│
│   for this track (review-panels.json)       │                         │ Thank-you note: Composer (5.7) │
│ Story Bank board (5.2) quick view           │                         │ → creates follow-up Task (Sat) │
│ Drill: 3 × 2-minute spoken answers (timer)  │                         │ Stage: [Interviewing ▾]        │
│ Prep checklist → interview.prep_notes       │                         └────────────────────────────────┘
└─────────────────────────────────────────────┘
```
- **Track mapping:** the track (PE / VC / Consulting) comes from the application's role and Radar cluster when known; otherwise the user picks it once, and the choice is stored in `prep_notes` as a tag line `Track: PE`. **No schema change.**
- **Challenge prompts** are the real ones from `content/career-director-review/review-panels.json` (5 per track), shown as practice questions only, with no scores.
- **Drill timer** is local only. Recording audio is a **Wave 3 option**: local `MediaRecorder` only, never uploaded, explicit consent.
- **After:** if 24 h pass after `scheduled_at` with an empty reflection, Today's agenda shows "Reflect on <interview>" until it's done or dismissed.

**Accept when:** all three phases render from fixture times (before, during, after); reflection saves through the existing interview update path; the thank-you task is created only when the user presses the button.

### 5.5 Weekly Review (Today)
**Experience.** On Sunday (or any day, via Ctrl K "Weekly review"), a 5-step guided flow with a progress dots header. Each step is one screen, and all of it is skippable:
1. **Wins:** tasks that are done and were updated this week (labelled "done and edited this week", because there's no `completed_at` until Wave 2), plus applications that changed stage this week (labelled the same way, by `updated_at`). One burst at the end.
2. **Carry or drop:** each overdue open task gets three buttons: Move to next week (sets `due_date` to next Monday), Drop (status `done`, then Undo), or Keep. This is the Ledger "carried forward" idea.
3. **People:** the Needs-a-touch list, with Compose (5.7) inline.
4. **Pipeline:** applications in Applied for more than 14 days since `applied_at`, with "Follow up" (creates a Task linked via `career_task_links`) or "Close".
5. **Next week:** pick up to 3 focus tasks for Monday (pre-fills Today's pins) and write a one-line intention, saved as an Inbox note titled `Weekly review · W43`.

**No schema change.** Every write uses existing insert and patch paths, with Undo where they change data.
**Accept when:** the flow completes with zero data (each step shows a calm empty line); a test confirms "Drop" and "Move" send exactly one PATCH each.

### 5.6 Shutdown (Today)
After 17:00 WIB, Today shows a slim bar: "Wrap up the day". It moves the unfinished Three for today to tomorrow's pins (localStorage), asks for one optional line ("What moved today?") saved as an Inbox note, and shows tomorrow's first agenda item. Size S, no schema change.

### 5.7 Message Composer (Hunt)
- Pick a template (`career_templates`, the existing categories) and a person. Placeholders `{first_name}`, `{full_name}`, `{company}`, `{role}`, `{my_name}` are replaced client-side, and unknown placeholders stay visible as `{…}` and are highlighted.
- **Copy:** a clipboard button with a ✓ morph.
- **Log as sent:** opens the existing touchpoint form pre-filled (channel, summary = the first line of the message, `next_step` suggested as "Follow up in 7 days").
- **Never** send anything. SELF has no outbound messaging, and this keeps it that way.
- **Accept when:** merge-field tests cover missing values and HTML-special characters.

### 5.8 Add to calendar (Hunt)
A button on every interview that generates an RFC 5545 `.ics` file client-side: `DTSTART` from `scheduled_at` in UTC, `SUMMARY` = interview title plus company, and `DESCRIPTION` = the prep link text only, never notes. It downloads via a `Blob` URL. **Accept when:** a unit test validates CRLF line endings and escaping of `,` `;` `\`.

### 5.9 Radar Swipe (Hunt)
Radar results shown in the triage stack from build spec §5.1: right means Save, left means Dismiss, up means "Add as application draft" (the existing opt-in path). The relevance ring and `score_reason` stay visible. Size S, no schema change.

### 5.10 Harvest (Studio)
Select cards, then a "Make tasks" toolbar action creates one Task per card (title from the card title, description from the summary) and converts each card to the Task kind linked by `task_id`, matching how existing Task cards are stored. One toast summarises "4 tasks created · Undo". Undo deletes the created tasks and restores the cards' kind. **Accept when:** a partial failure reports exactly which cards failed and leaves the others linked.

### 5.11 Structure Check (Studio)
A toolbar badge that counts issues: empty cards (no title or default title), orphan cards (no edges, not inside a frame), edges without labels in Issue Tree boards, and frames with no children. Clicking it walks through the issues with the camera. Read-only, size S.

### 5.12 Daily Drill (Study → Today)
- Each day, Today shows one 5-minute drill picked deterministically from `content/career-teaching.json` lessons (18 lessons, numeric checks with hints): `hash(userId + date) % lessons.length`, skipping lessons answered correctly in the last 7 days.
- Results are stored in `localStorage['self.drills.'+userId]` in Wave 1 and synced in Wave 2.
- The drill opens the existing lesson check UI in a compact card.

### 5.13 Skill Map (Study)
- A grid of the 36 competencies (`PE-01…12`, `VC-01…12`, `CO-01…12` from `content/career-prep-quality-blueprint.json`). Each cell has two honest layers:
  - **Coverage:** which lessons, labs and Work Samples teach it (from content mappings such as `lessons[].competencies`). Static.
  - **Your evidence:** links to *your* artifacts for that track: portfolio files (`career_portfolio_files`), the self-check state (`career_portfolio_cases.review_checks`), drills answered locally. The label reads "self-checked", never "assessed".
- Clicking a cell shows the lesson, lab, sample and evidence list.
- **Accept when:** a competency with no content mapping shows "Not covered yet". The map never shows a percentage "mastery".

### 5.14 Proof Pack (Study)
- One page per track that assembles: the decision statement (`career_portfolio_cases.decision`), the checks done, the files (names and types, private signed links only for the owner), the Skill Map coverage for that track, and a footer: "Self-prepared. Simulated case: SIMULATED."
- Export as a self-contained HTML download or a print-friendly view. It never uploads anything or creates a public link.

### 5.15 to 5.19 · Wave 2 (requires approved additive migrations)
Each one gets its own Integrator PR, with: a migration file, RLS for the four owner policies (as in the existing migrations), a rollback note, and a fixture test. **Nothing here runs until the user approves that specific migration.**

| Feature | Migration (additive) | Then |
|---|---|---|
| **Live Cards** | `knowledge_cards` add `ref_type text check (ref_type in ('company','person','application'))`, `ref_id uuid` (nullable; no FK across tables, validated in app) | Canvas cards render a live pill (stage, days since contact). Dossier "Your work" switches from title matching to real references. |
| **Stage history** | `career_application_events(id, user_id, application_id fk, from_stage, to_stage, at timestamptz)` written by `setStage` | Time in stage, median days to first reply, honest funnel ages |
| **Momentum** | `tasks` add `completed_at timestamptz` (set when status becomes `done`, cleared otherwise; backfill nothing) | Heatmap of the last 12 weeks, plus Weekly Review wins by `completed_at`. Show "since <migration date>" honestly. |
| **Repeat** | `tasks` add `recurrence text check (recurrence in ('daily','weekdays','weekly','monthly'))`, `recur_parent uuid` | Completing a recurring task creates the next one (client-side, idempotent by parent and date) |
| **Synced progress** | `career_skill_evidence(user_id, competency_id, kind check in ('drill','lab','sample'), ref text, at)` | Drills and Skill Map sync across devices |

### 5.20 Wave 3 · Explore later (not scheduled)
- Board export to PNG or PDF for the portfolio.
- Local-only mock interview audio (MediaRecorder; never uploaded).
- A connected AI assist. Today Radar's Assist is deliberately copy-only; adding a real model needs explicit approval, a privacy review and cost limits.
- Two-way calendar sync, which needs OAuth and a server; out of scope for a static Worker.

## 6. How it hangs together (one person, one week)
- **Monday, Today:** Three for today, pinned from Sunday's review. The agenda shows Thursday's interview, and the Daily Drill takes 5 minutes.
- **Tuesday, Hunt:** open the Northstar Dossier, then "Open board" builds the Company Map. Compose a message to Sari, copy it, Log as sent.
- **Wednesday, Studio:** Deal Thesis recipe for the PE case, then Harvest turns 4 diligence questions into Tasks. Structure Check before rehearsing.
- **Thursday, Game Day:** countdown, Director challenges, Story Bank, then Walkthrough of the thesis board on a call. Afterwards, the reflection gets saved and a thank-you task appears for Saturday.
- **Sunday, Weekly Review:** wins, carry or drop, people, stale applications, next week's three.

## 7. Success signals (computed on-device for the user only; SELF has no analytics)
- Weekly reviews completed in the last 4 weeks.
- Interviews with a reflection within 48 h (out of all interviews).
- People in the "In conversation" stage with no touch for more than 30 days (lower is better).
- Sprint days completed and competencies with at least one piece of evidence.

These appear in the Weekly Review's footer only. No leaderboards or streak shaming.

## 8. Build phases and copy-paste prompts
Run these **after** the Rooms phases in the build spec (R0–R6, M1, D1) have merged. Same rules: one PR each, all README checks, no Supabase writes, and an authorized Integrator for shared files.

| Phase | Contents | Depends on | Builder |
|---|---|---|---|
| U1 | Dossier, Message Composer, Add to calendar | R3 | Sonnet |
| U2 | Studio Recipes, Harvest, Structure Check | R1 | Sonnet |
| U3 | Walkthrough | U2 | Sonnet |
| U4 | Game Day | U1, U2 | Sonnet |
| U5 | Weekly Review, Shutdown | R2 | Sonnet (U5a), Haiku (Shutdown) |
| U6 | Daily Drill, Skill Map, Proof Pack | R3 | Haiku (Drill), Sonnet (Map, Pack) |
| U7 | Radar Swipe | R2 (triage stack), R3 | Haiku |
| W2-a…e | One migration and its feature per PR | user approval each | Integrator, then Sonnet or Haiku |

**U1 prompt (Sonnet):**
> Read `AGENTS.md`, the blueprint, the build spec and `docs/design/SELF_PRODUCT_UPGRADE_PLAN.md` §5.1, §5.7 and §5.8. Build Hunt › Dossiers in a new `career-dossier.js` (plus CSS in `rooms.css`), using only existing loaders and drawers. Build the Message Composer and `.ics` export as pure functions in `career-compose.js`, with tests `tests/smoke_dossier.cjs` (timeline merge across all five sources) and `tests/smoke_compose.cjs` (merge fields, escaping, ICS CRLF and escaping). Register the files in `index.html`, ASSETS and CI. No schema change and no outbound messages. Paste all test output into a draft PR.

**U2 prompt (Sonnet):**
> Read §5.2, §5.10 and §5.11. Refactor `makeStarter()` in `canvas-v3.js` into `buildFromRecipe(recipe)` without changing the existing starter's output (add a test that the "Moodboard" recipe produces the same objects and edges as before). Add `content/studio-recipes.json` with the six recipes, `SELFBoards.createFromRecipe`, a recipe picker on New board, Harvest and Structure Check. Add `tests/smoke_recipes.cjs`. Keep `?canvas=legacy` working. No schema change.

**U3 prompt (Sonnet):**
> Read §5.3. Add Walkthrough (Present mode) to the Concept D editor, reusing `fitEntities()` with a 450 ms camera tween (instant under reduced motion). Read-only while presenting; prove it with a test that spies on `api.insert/patch/del`. Keyboard: arrows, Space, Esc. Empty state for boards without frames.

**U4 prompt (Sonnet):**
> Read §5.4. Build Game Day as a Hunt view opened from interviews, Today and Dossiers. Use the real prompts from `content/career-director-review/review-panels.json`, the Story Bank recipe board when present, and the existing interview update path for prep notes and reflection. Add the "Reflect on…" agenda row after 24 h. Add `tests/browser_gameday.cjs` covering the before, during and after phases with fixed clock fixtures and Supabase intercepted.

**U5 prompt (Sonnet, then Haiku):**
> Read §5.5 and §5.6. Build the Weekly Review flow (5 steps) and the Shutdown bar inside Today, using only existing insert, patch and del paths with Undo. Label "done and edited this week" honestly (there's no `completed_at` yet). Add `tests/smoke_weekly_review.cjs`.

**U6 prompt (Haiku for Drill; Sonnet for Skill Map and Proof Pack):**
> Read §5.12–§5.14. Daily Drill: deterministic pick from `content/career-teaching.json`, with localStorage results (try/catch). Skill Map: coverage from the content mappings plus the user's evidence from portfolio tables, never as a percentage. Proof Pack: client-side HTML export labelled self-prepared and SIMULATED. Add tests for the deterministic pick and the coverage mapping.

**U7 prompt (Haiku):**
> Read §5.9. Reuse the build spec's triage stack component for Radar results. Save and Dismiss go through the existing Radar actions. Keep "estimated relevance" wording and the source link visible.

**W2 prompt (Integrator only, one per migration, after explicit user approval):**
> Read §5.15–§5.19 and the existing migrations. Write ONE additive migration with the four owner RLS policies, a rollback note and no backfill of invented data. Do not apply it. Open a PR for review. After the user approves and it is applied once by the Integrator, implement the dependent feature in a separate PR.

## 9. Risks
| Risk | Mitigation |
|---|---|
| `canvas-v3.js` is large and dense; refactors can break the editor | U2 starts with a "same output" test for the existing starter; Walkthrough is additive and read-only |
| Matching Dossier boards by title can mislabel | Labelled "matched by title" until Live Cards land |
| Rituals can feel like homework | Every step is skippable and nothing nags; Shutdown only appears after 17:00 |
| Scope creep | Waves are ordered; Wave 2 needs approval per migration; Wave 3 is explicitly unscheduled |
