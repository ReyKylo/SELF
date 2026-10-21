# SELF — Personal Thinking Workspace
A personal workspace for work, learning, notes, tasks and links. **Core Phase 3 implementation** on the existing Phase 1/2 and Concept C/D foundation. Career remains a future modular extension.

## Run
No build tooling or dependency installation needed. Serve the directory over HTTP:
```sh
python3 -m http.server 8080
```
Open http://localhost:8080. A Supabase email/password account is required. The client connects to the existing SELF Supabase project. The key in `app.js` is **publishable** (not a service-role secret). Access is enforced by per-user row-level security policies.

## Phase 1 delivered
- Home with Quick Capture and priorities aggregated from every Space
- CRUD Spaces and Tasks, task status, priority and due dates
- Task detail side-sheet, checklist, notes and subpages
- URLs in task notes/description auto-captured into task links; link library
- Task List / Board / Calendar views, inbox and search
- Dark/Light themes, persistent scalable text 100–150%, responsive navigation
- RLS-protected tables with real PostgREST persistence and Auth

## Phase 2 delivered
- Hybrid board library, boards inside Spaces, and Quick Capture for new boards
- Interactive infinite canvas: drag to move cards, resize corners, pan background and wheel, zoom controls and Ctrl/Cmd + wheel zoom
- Create Note, Task, Link, Group, Board cards, with editable summaries, key points and detailed notes
- Drag from a card's connection dot to another card to create directed relationships
- Reuse existing cards across multiple boards: **same content, separate placement**
- Linked boards and linked tasks; task opens the existing Notion-style task details
- URL extraction from knowledge card notes and automatic inclusion in My Links
- Persistent board geometry and camera in Supabase, user-scoped RLS and FK integrity
- Dedicated `boards.js` / `boards.css`; existing Phase 1 interaction and themes preserved

## Phase 2.5 Concept C engine, upgraded by Concept D toolbar-first editing
- Blank-first shapes (rectangle, ellipse, diamond, sticky, text, frame), rich knowledge cards and task/reference blocks. One click creates an object before asking for content.
- Premium floating vector toolbar, spacious dotted canvas, sidebar and contextual four-tab inspector; preserved Phase 1 theme and font scaling.
- Resize, move, marquee and multi-select; magnetic four-side ports, dynamic connectors recalculated during pointer moves/resizes, straight/curved/elbow routing and connector labels.
- Inline double-click title editing; deep card notes, task and linked-board references; automatic Important Links extraction.
- Context-aware object style, alignment, distribution, stacking, Smart Layout (flow/tree/cluster/tidy), undo/redo for geometry, style and connections.
- Image uploads to private Supabase Storage (10 MB max, JPEG/PNG/WebP/GIF) with signed read URLs; drag/drop and clipboard paste.
- Opt-in example board button **Explore Concept C starter** adds real editable objects, without silently inserting demonstration data.
- Legacy editor remains available with `?canvas=legacy` on the SELF URL. Both editors use the same underlying boards/cards and data; no data reset.
- Back-end migration: `20261021030100_self_concept_c_canvas_scene_storage.sql` (additive).

## Core Phase 3 delivered (2026-10-21)
- Drag-and-drop task Kanban, native status dropdown for keyboard/mobile, and reliable Undo.
- No false Saved signals; unsaved field indicators and retained draft/form content when requests fail.
- Priority ordering across Spaces; generalized and searchable My Links with deduplicated display; global Search now includes boards and URLs.
- No dark-flash overlay when editing Task Details. No new Supabase migrations or Career routes.
- **Production browser QA remains open**. See [Core Phase 3 Release Gate](docs/CORE_PHASE3_RELEASE_GATE.md).

## Career Phase 1 — extension inside SELF
- Adds one Career nav entry with nine internal subpages; no separate Career dashboard app.
- Owner-private Companies, People, Applications with related record detail, manual Quick Capture and editing/deletion.
- Reuses SELF Tasks via existing New Task flow; My Links stays general and now includes Career URL references.
- Radar settings appear as inactive design specs. No automation/AI sends or invented opportunity data.
- CV Library, interview operations, networking timeline, templates and Career reminders remain Phase 2/3 work.
- Applied migration: supabase/migrations/20261021135000_self_career_phase1_core.sql.
- Read docs/CAREER_PHASE1_RELEASE_GATE.md for detailed implementation and logged-in browser QA gates.

## Career Phase 2 — integrated operations
- Application Kanban: drag-and-drop + native stage controls + Undo; no second application table.
- People: relationship interaction timeline in the original Career record detail.
- Private CV Library: PDF/DOCX upload (8 MB maximum) with 5-minute signed links; application-to-CV association.
- Interview Prep: linked session planning, preparation and reflection.
- Templates: reusable copy-only drafts, no automatic messaging.
- Reminders: connected to existing SELF Tasks. Link existing Task or create a canonical Task; unlink never deletes My Work's task.
- Supabase migration: `supabase/migrations/20261021152000_career_phase2_operations.sql` (applied; additive with RLS).
- Opportunity Radar remains inactive until explicitly approved in Career Phase 3.
- Review `docs/CAREER_PHASE2_RELEASE_GATE.md` for production UI and account-security acceptance gates.

## Career Phase 3 — source-backed Opportunity Radar
- Within the same Career shell, a real **on-demand** public Remotive job feed displays source URL and role/company metadata.
- Transparent rule-based estimated relevance, explicit Jakarta/Indonesia or worldwide eligibility, four clusters, 75% threshold and max 15 results.
- Privately Save/Dismiss results, keep general My Links as the one cross-SELF link library, opt in before adding a draft to existing Applications.
- Editable research prompt Assist (copy-only; not a connected LLM), with no automatic company outreach or fabricated personal experience.
- 06:00 WIB schedule remains a **design specification only**, not a running automation. See `docs/CAREER_PHASE3_RELEASE_GATE.md` for scope and limits.
- Schema: `supabase/migrations/20261021170000_self_career_phase3_opportunities.sql` (additive owner-scoped).

## Phases
- **Phase 1**: Daily workspace, Spaces, My Work, Tasks, Quick Capture, dark/light theme.
- **Phase 2.5**: Creative + Smart Diagramming whiteboard (implementation committed, smoke-tested; browser visual QA still open).
- **Core Phase 3**: Task reliability, Kanban and general links/search improvements implemented; release acceptance requires real-browser review. Concept D richer inline writing remains the current whiteboard editor.

## Checks
```sh
node tests/smoke_render.cjs
node tests/smoke_api.cjs
node tests/smoke_whiteboards.cjs
node tests/smoke_concept_c.cjs
node tests/smoke_concept_d.cjs
node tests/smoke_core_phase3.cjs
node tests/smoke_career_phase1.cjs
node tests/smoke_career_phase2.cjs
node tests/smoke_career_phase3.cjs
python3 tools/build_cloudflare.py
```
A passing smoke test isn't a browser screenshot or live deployment verification. Visual and real-device checks remain required before signing off the visual contract.

## Design contract
Read `docs/DESIGN_CONTRACT.md`. Wireframe V2 is the visual baseline, not disposable inspiration.

## Security
No service-role keys in the browser. Users can select/change only their own records via RLS. Task child rows have composite foreign keys enforcing same-user ownership. Keep security checks and test authorization between accounts before production launch.

## Deploy on Cloudflare Workers Builds (existing Worker: `self`)

SELF is a zero-dependency static application deployed as **Cloudflare Workers Static Assets**, not as a Cloudflare Pages project.

The repository includes:
- `tools/build_cloudflare.py`: creates `dist/` with eighteen static app assets (`index.html`, `styles.css`, `app.js`, `boards.css`, `boards.js`, `canvas-v3.css`, `canvas-v3.js`, `concept-d.css`, `career.js`, `career.css`, `career-phase2.js`, `career-phase2.css`, `career-phase3.js`, `career-phase3.css`, `career-learning.js`, `career-learning.css`, `content/career-learning.json`, `content/portfolio-sprint.md`).
- `wrangler.jsonc`: preserves the existing Worker name `self` and points Wrangler to `dist/` as static assets.

In **Cloudflare dashboard > Workers & Pages > self > Settings > Builds**, set:

| Setting | Value |
| --- | --- |
| Connected repository | `ReyKylo/SELF` |
| Production branch | `main` |
| Root directory | `/` (repository root) |
| Build command | `python3 tools/build_cloudflare.py` |
| Deploy command | `npx wrangler deploy` |

Do not look for a Pages-specific build output directory in Workers Builds. Wrangler reads `assets.directory` from `wrangler.jsonc`. Do not change the deploy command to `wrangler pages deploy`, as this is an existing Worker.

Local verification:

```sh
python3 tools/build_cloudflare.py
python3 -c "import json; c=json.load(open('wrangler.jsonc')); assert c['name']=='self' and c['assets']['directory']=='./dist'"
ls dist/
```

A new commit to `main` should trigger a new Workers Build. Use **Deployments** to check the build and deployment status; a successful GitHub commit alone does not mean Cloudflare is live.

## Phase 2.5 — Concept C whiteboard rebuild (design locked)

Concept C replacement has been implemented and committed on `main`. The user-reported defects (floating endpoints and forced form-first card creation) are addressed in code and regression-tested. Final actual-browser screenshot parity and production confirmation remain unverified. Do not start Phase 3 before user visual acceptance.

Required reading before writing whiteboard code:
1. [Concept C Implementation Blueprint](docs/CONCEPT_C_IMPLEMENTATION_BLUEPRINT.md): architecture, geometry, gestures, engineering and QA gates.
2. [Concept C Design Tokens](docs/concept-c-design-tokens.json): reference viewport, sizing, appearance and motion.
3. [Phase 1 Design Contract](docs/DESIGN_CONTRACT.md): maintain the existing working shell, text scaling and clicky interactions.
4. [Phase 2 Known Gaps](docs/PHASE2_RELEASE_GATE.md): tests still needing live browser verification.

**Approved visual reference:** "Concept C — Creative + Smart Diagramming" image, 1672 x 941, SHA256 5bab2bb9cc33be729efe00e31bccf82d2bd58978f64ff7d6d31a5f09254b25b7. Supplied in the chat as a reference pack. The older docs/wireframe-v2.webp is NOT the Concept C whiteboard reference. The builder must obtain the approved image before visual QA.

No destructive migrations, new Cloudflare Worker or whole-app replacement were performed. The original editor is preserved behind `?canvas=legacy`; compare actual browser screenshots to the approved image and obtain acceptance before Phase 3.



## Career Prep — expert evidence and portfolio sprint

Open **Career → Career Prep** for the three-day PE / VC / Consulting portfolio sprint, 12 evidence panels, 9 connected YouTube lessons and the 41-source audit. The V4 reader keeps explanations beside an honest source pointer; original screenshots are not fabricated or redistributed. Search by topic/publisher, inspect verification/access labels, and return from a video without losing the selected evidence and filters.

**Add project to My Work** explicitly creates or opens one canonical SELF Task per user/sprint. A deterministic UUID uses the existing task primary key to reconcile repeated clicks, concurrent tabs and lost acknowledgements; no new task table or schema migration is needed. No project is inserted just by reading.

The lesson/catalog files are nonpersonal static content in `content/`. YouTube loads only after Play or chapter selection. CV Library, Interview Prep, Radar, Tasks and Whiteboard retain their original data and views. The Task drawer's delegated Close/tab clicks are repaired so a portfolio Task can be used normally.

Checks: `node tests/smoke_career_learning.cjs` and the existing regression suite. Optional real-browser synthetic QA: `node tests/browser_career_learning.cjs` requires Playwright plus a local Chromium executable; set `SELF_QA_CHROMIUM` if necessary. The fixture starts an isolated static server and intercepts Supabase requests; it never writes to the production account.

See `docs/LEARNING_RELEASE_GATE.md` and `docs/learning-review/` for scoped independent runtime evidence and remaining live-deployment checks.
