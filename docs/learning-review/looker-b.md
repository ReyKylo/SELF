# Looker B — adaptation review

22 October 2026. Reviewer role independent of Builder and Looker A. Build base: `75e5e9e44b56b74ea577ebfdc0685e4cc00a5c80`.

## Reading receipt

Read the council SKILL.md, full Design DNA, craftsmanship examples, evaluation map and anti-patterns at `/root/.codex/skills/remote-skills/skill-6acb3b793ed481919aed9bb39e18fa97/`; read SELF adaptation, current `career.js` and `career.css`.

Current direct source inspection: V3 `assets/frames/V3/012.00.jpg` and V5 `assets/frames/V5/054.77.jpg` using image viewing. Remaining source intelligence is inherited `INSPECTED_BASELINE` analysis; I did not rewatch all original videos. No current motion measurement or backend proof is claimed.

## Independent findings

- **OBSERVED V3 12.00 s:** selected `Status: Confirmed` stays visible beside the table search and provider controls; rows remain identifiable. **INFERRED:** persistent filter context helps users interpret a narrowed result set. **PROPOSED SELF adaptation:** track/search and count remain visible after selection; reset restores the full relevant scope. Applicable I02, S01, S03.
- **OBSERVED V5 54.77 s:** stable global and contextual navigation sit left of the main Persona editing region; a separate Test chat inspection area is on the right. **INFERRED:** one shell can support a task-specific split workspace. **PROPOSED SELF adaptation:** V4 explanations left and original-source pointer right, stacking when the available content width becomes too narrow. Applicable V01–V05, I01.
- The approved textual V4 contract asks for source evidence; the package currently provides pointer-only records. Explicitly label the right-hand pointer state, retain publisher/title/exact URL/section, and avoid calling it a screenshot. This is an honest interim state already acknowledged in the package, not permission to invent or auto-host evidence.
- No reason to add a Gantt, board or node graph to a focused evidence reader. No drag requirement for the new module; existing application/task boards should remain untouched.

## Challenges and engineering guards

1. **Availability boundary:** current `career.js` renders private-record loading/errors before choosing a subpage. The new static learning reader should render ahead of those unrelated data gates. A private table failure must not become an endless library spinner or hide usable sources. Test delayed/failed local JSON separately from failed Career API.
2. **Confirmed write versus reload:** `Add project to My Work` must cache/retain the actual returned Task before a subsequent reload. A reload failure after a successful insert is not a failed insert and must not encourage duplicate creation. Busy protection alone is insufficient for this path.
3. **Account change:** task identity/cache belongs to the owner. A delayed previous-owner result must not open or label a task in a new owner's session. Do not claim ownership/security VERIFIED from existing RLS or reference screenshots.
4. **Keyboard and detail orientation:** after selecting an evidence/video row, move focus to a meaningful detail heading or preserve clear context; native filter controls should remain usable at 150% text. Actual runtime checks remain required.
5. **Scope of claims:** metadata verification does not prove lesson watched, completion or present geographic playback. No progress bar, persistent completion state or automatic learning activity may be implied unless implemented and tested.

## Sign-off

**PASS — factual adaptation sign-off for the written specification within stated boundaries.** The mappings correctly separate observed reference composition, inherited source analysis, inferred benefit and proposed target behavior. No new-reference or new-visual-direction blocker identified. Engineering guards above refine implementation/test expectations and do not require a new design choice.

**Runtime: NOT VERIFIED / pending.** This report does not approve future functionality, deployed authentication, data persistence, exact V4 visual parity or external video playback. Builder and QA must address the guards on the actual build.

# Independent running-build review — 22 October 2026

**Result: PASS for exercised scope; zero open blockers or majors observed.** This is an actual browser review, not a screenshot-only or module-unit sign-off. Builder's initial omission of app-level learning-click dispatch was encountered by this review and fixed by Builder; the workflow below was rerun from a fresh fixture afterward.

## Build / environment / evidence

- Base repo SHA as above, local implementation revision identified by SHA-256: `app.js` `5a5c72de36f0ee4fc8d181d6e0443984521501147633440e642c557e9d5dc916`; `career-learning.js` `ba3257a1b8d019b4bc336195a84bb2fbab0c0742587c5709f9730e0a9acbbf2c`; `career-learning.css` `1ff07b3bcc597a32f4e7d3934ca0d28bcc3e77ffbf3dd71eba0a2acc70fe0f50`; `content/career-learning.json` `b6fc23fe1d592629f148058bffd8f7b89dcecc69be6c734b7004a70ac7b687eb`.
- Headless Chromium `/tmp/self-browser/chrome-headless-shell-linux64/chrome-headless-shell`, Playwright, own local HTTP server via `tests/browser_learning_fixture.cjs`. Synthetic identity and intercepted Supabase requests; no production writes. Reduced motion; fonts blocked consistently by fixture.
- Viewports: 390×844 and 1366×768. Dark 100%, dark 150%, light 150% actually inspected. CSS scale set on document, matching SELF's `--scale` mechanism.
- Screenshots: `looker-b-mobile-sprint.png`, `looker-b-mobile-evidence.png`, `looker-b-mobile-evidence-150.png`, `looker-b-laptop-evidence.png`, `looker-b-laptop-evidence-150-light.png`.
- Machine-readable action results: `looker-b-runtime.json`, `looker-b-failure-keyboard.json`.

## Executed acceptance

| Criteria / provenance | Actions and expected | Actual / evidence | Status |
|---|---|---|---|
| V01/V04/V05 · V5 54.77 / P4 | Enter Career Prep in existing shell; inspect sprint, evidence, source and video representations | Existing rail/shell retained; split reader at available laptop width and stacked reading region when type enlarges; no generic decorative dashboard | PASS / VERIFIED for screenshots and actions |
| V02/V03/S03 · engineering device extension | 390/1366, 100/150%, open source URL disclosure | Document scroll width equals viewport in all measured states; long URL wraps; mobile reading remains legible | PASS / VERIFIED for tested viewports |
| I02/D02 · V3 12.00 / P3 | Filter VC, choose Shopify; no-match query; reset | 4/12 VC; no-match explanation differs from load error; reset 12/12; counts reconcile | PASS / VERIFIED |
| P1/I01 · V1/V5 principle adaptation | Shopify evidence → B2B Startup Metrics → back | Selected Shopify panel and VC track restored, explicit back action; actual matching title displayed | PASS / VERIFIED |
| S01 · I4 / honest states | Inspect original-source pane | Explicit “screenshot belum tersedia”, actual publisher URL and section; no invented exhibit or learning-completion claim | PASS / VERIFIED |
| I03 · keyboard engineering extension | Enter keyboard on YouTube tab and selected row; inspect focus; play/stop | Tab works by Enter; selected detail heading receives focus; Play creates iframe and focuses Stop; Stop removes iframe and focuses Play | PASS / VERIFIED for tested control sequence |
| D01/D03 · persistence / repetition extension | Add PE task; close native Task panel; reopen same project | Exactly one POST, one canonical synthetic Task; reopened same task rather than duplicate | PASS / VERIFIED against fixture |
| S02/I01 · V5 attention-state rationale | Reject content fetch with 503, retry | Explicit content error + Coba lagi; retry restores sprint | PASS / VERIFIED |
| S02/D01 · failed writes | Reject task service, then retry after recovery | No POST or record on failure; inline error, no false success; recovery creates exactly one Task | PASS / VERIFIED against fixture |

## Remaining limits / minor observation

- After resetting all filters while Shopify remains selected, the evidence strip begins at PE01 and the selected Shopify item can be horizontally offscreen. The main panel title remains correct and visible; this is a minor orientation polish opportunity, not a lost-selection or core workflow defect. Auto-revealing the selected strip item would improve continuity.
- No exhaustive contrast/compliance audit, 360px/tablet suite, high-latency measurement, frame-rate claim or production sign-in/RLS proof is made by this report.
- Embedded iframe creation and accessible controls verified; actual YouTube playback availability, every chapter, region/account restrictions and publisher downloads are not verified here.
- Synthetic API persistence validates app behavior, not deployed Supabase policies. Independent QA remains responsible for broader security/account-switch/lost-ack scenarios and regression suite.

## Targeted repair recheck

Reran fresh 390×844 browser fixture after Builder's task-panel bubbling and library context repairs. Revision hashes: `app.js` `d7540eeed61366ea471852f901247dc11ceca5c7c464af9ed2e15dc9acb359c5`, `career-learning.js` `092df9097e447f4202b2f9591ef90ce3c605235a48922f15d2af8981e1251eac`.

**VERIFIED:** native Task drawer Close button closes the drawer; reopening creates no second POST; Notes tab is clickable and retains its panel. Shopify query + VC track → related video → back restores query `Shopify`, track `VC`, and count `1 dari 12 evidence`. Zero page errors. No blocker or major introduced by these repairs. Previous visual evidence remains scoped to unchanged layout/CSS, not a new production screenshot.
