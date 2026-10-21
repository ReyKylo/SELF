# REFERENCE INTELLIGENCE & DESIGN DNA — SELF Career Prep

Build base: ReyKylo/SELF main 75e5e9e44b56b74ea577ebfdc0685e4cc00a5c80. Routine approved V4 addition, not a new visual direction. User authorized integration on 22 October 2026.

## Brief
Add Career Prep within the existing Career rail, alongside Interview Prep, CV Library and other operations. Tabs: 3-Day Sprint / Expert Evidence / YouTube / Sources. Preserve current shell, blue/dark-light tokens and scaled type. Indonesian instructional content, original English document/video titles. Content: 41 source audit entries, 12 panels, 9 videos, 3 fictional worked exercises.

## Evidence and boundaries
Permanent council baseline: 5 videos, 7 images; inherited independent analysis, not rewatched this run. Integrity verifier passes. Consult original selected frames V3/012.00 and V5/054.77 for filter orientation and split inspection. No new visual reference supplied; approved V4 verbal specification in user's attachment governs. Research assets are source pointers, not locally licensed screenshots; right pane must say so and open actual original section. No fake financial exhibit or purported AI execution.

## Proposed task adaptation
- V1 0/9.8–11, P1: Career rail and explicit active section remain stable. Preserve selected library tab/track when moving between evidence and video.
- V3 8.5–12/14.5–16, P3/P8: visible track/search filters, result counts and one clear action. Search no-match differs from load failure.
- V5 54–60, P4: explanation left, source inspection right; a selected evidence panel exposes INI APA / INI KENAPA / CARA ACHIEVE / ANALISIS AI. On smaller content widths stack panes, not shrink text.
- I7 central table, P5: source and video rows expose actual identity, publisher, classification, status and relevant actions without decorative metric grid.
- I4 whole empty view, P6: source-pointer state and missing video coverage honestly explained; no artificial progress.
- V2 2.15 and V5 75–80, P2: explicit Add project to My Work creates one canonical Task only on click, then opens that task. Pending, failed and confirmed result distinct; no second task database. Repeated clicks disabled; existing tasks re-open. No automatic database seeding or outreach.

## Scope / states / acceptance
Public nonpersonal teaching content packaged as static JSON and Markdown; fetch lazily with honest loading/error/retry. No new tables/schema/auth changes. Canonical task creation uses existing authenticated host.insert and state.tasks; user ID remains inserted by existing host API. Learning selections reset on account change. No personal lesson-completion persistence promised.

Applicable checks: V01–V05, S01–S03, I01–I05, A01, D01–D03. I06 N/A: no drag task in a reading library; existing task boards untouched. P01/P03 bounded checks without blanket timing promises; P02 N/A new animation not central; P04 dataset fixed 41/12/9.

Fixtures: actual curated content; mocked empty Career tables and synthetic signed-in test identity for isolated local QA only. Browser workflows: enter module, switch tabs/tracks, select panel/video, no-match search/reset, loading failure/retry, canonical Task create/open/failure/double-click/account switch; desktop 1366 and mobile 390, light/dark, 150% text, keyboard. Do not bypass production authentication or write QA records into user's production account.

## Deliberate departures
No graphs/Gantt/Kanban added: teaching evidence needs a focused reader and searchable catalogs. No invented screenshots, completion badges, actual-deal claims or course watch tracking. Library learning videos are embedded only after explicit selection/play, with original YouTube link fallback. No complete visual-parity claim until runtime review. No reskin or change to Whiteboard/CV/Interview/Radar behavior.

## Review gate
Two independent Lookers check factual adaptation before coding; separate leader challenges and accepts. Independent runtime reviews and QA occur after build. Source findings remain inherited baseline; runtime evidence must identify exact fixture/build. Existing production login and external video availability can remain explicitly unverified; core library rendering and local integrations must be exercised.

### Review amendments
Learning rendering precedes unrelated private Career record load/error gates; public course content must remain available when that API fails. On successful task insert, retain the returned canonical record in owner-scoped state before reload. A reload failure cannot be reported as a failed insert or invite a duplicate retry. Database network ambiguity must say check My Work, not promise idempotence across tabs. Selective fixture tests cover these cases.
Deterministic Task identity amendment: derive a stable UUID from user ID + fixed sprint key using SHA-256 (custom UUIDv8); use it as the existing Task primary key. Preflight lookup then POST; reconcile the same ID after conflicts or uncertain acknowledgement. This avoids concurrent-tab duplicate records without new schema; tests must exercise conflict and lost response. Marker in notes remains discoverable to humans, but does not enforce identity.
