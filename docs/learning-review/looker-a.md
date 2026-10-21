# Looker A — SELF Career Prep adaptation review

2026-10-22 · base main `75e5e9e44b56b74ea577ebfdc0685e4cc00a5c80` · pre-implementation review only.

## Reading receipt

Read current council SKILL.md, full Design DNA (five videos/seven images), craftsmanship examples, evaluation map and anti-patterns; reviewed current career.js/career.css and `LEARNING_DESIGN_ADAPTATION.md`. Current direct inspection: original retained frames V3/012.00.jpg and V5/054.77.jpg through image viewing. Other original-media findings remain INSPECTED_BASELINE, not new video viewing. No current motion, runtime persistence or target visual parity verified.

V3/12.00 directly shows the active Confirmed filter retained over rows. V5/54.77 directly shows persona editing beside a test chat with a stable global/secondary navigation structure. These support persistent filter orientation and adjacent reading/inspection, not a mandate for their colors, exact type, backend functionality or desktop split on mobile.

## Factual sign-off

**PASS — factual accuracy of the proposed adaptation, with the scoped implementation constraints below.** No new reference corpus was supplied; reuse of historic baseline is accurately labelled. P1/P3/P4/P5/P6/P8 and selected checks are relevant. Single Career Prep destination with task-specific tabs is preferable to a second dashboard. Preserving approved V4 explanation-left/source-right structure while explicitly stating pointer-only visuals is honest; it must not be called finished screenshot evidence parity.

## Challenges and required implementation attention

1. **Static learning must remain usable if private Career tables fail.** Current `career.js` selects loading/error before the selected subpage. A new static library behind that same gate would become inaccessible because an unrelated private-record load failed. Handle the learning route independently of Career data readiness; keep any private task action disabled/error-scoped until the host identity/data is available. Proposed S02/I01 engineering protection, not observed reference functionality.
2. **No broad duplicate-prevention guarantee.** Disabling a pending button plus checking host.state().tasks covers same-page repeated actions, but not a lost POST acknowledgement or concurrent browser tabs. Before retrying after an uncertain outcome, reload/search existing canonical Tasks by stable project marker. Do not label a retry safe if the outcome cannot be reconciled. D01/D03 require a failure scenario, not just a successful save toast.
3. **Two navigation layers reduce real reader width.** Stack explanation/source panes based on available reader width (including at 150% type), not simply viewport mobile breakpoint. Keep source title/section and original-link action fully visible with long titles; do not compress into a tiny two-column desktop artifact. V02/V03/S03/A01.
4. **Evidence → video → back preserves the specific panel.** Track/tab state alone is insufficient if the user returns to the wrong default evidence panel. Retain selected evidence ID and filtered list context for the same account, then reset on account switch. P1/P8.
5. **Verification and incompleteness should be contextual.** A concise pointer-only source explanation belongs to the evidence pane; source audit status belongs to each source row. Avoid presenting all research caveats in a large wall before the first learning action. V04/P3.

## Pending proof

No target implementation existed at this review. Runtime review will inspect tab/filter/select/back workflow, task pending/error/confirmed states, no-match/clear, desktop/mobile, dark/light and large type. Production authentication, real server persistence and external video playback must not be represented as verified by local mocked fixtures.

## Independent running-build review — round 1

Environment: local synthetic Supabase API via `tests/browser_learning_fixture.cjs`; headless Chromium shell; no production account, network write or personal records. Build files as present on 22 October 2026 after the parent dispatch correction. Browser interaction, not source-only review. Typography screenshot fixture blocks remote fonts, so exact downloaded font metrics remain unverified.

### Executed and VERIFIED in this bounded fixture

- 1366×768 dark: enter Career Prep, see three named day assignments; switch Expert Evidence, choose VC, correct `4 dari 12` count, select VC03 Twilio. Explanation has all four V4 sections; source pane labels original publisher/title/location plus **screenshot belum tersedia** and the real BVP URL. No screenshot parity claim.
- Select related B2B video, return to evidence: specific VC03 selection and VC scope survive. The video carries original title/channel and duration. No claim of external playback verification.
- Search nonsense: honest zero-match state; Reset restores all 12 evidence. Sources lists 41, with screened-page, direct-403/index, PDF-unreviewed and FashionCo-index-only labels distinct. FashionCo query returns its unverified-case label.
- Task request denied: visible scoped task error, zero POSTs, no success. Then simulate a POST accepted server-side but acknowledgement lost: reconciliation opens exactly one canonical Task. Close the native task panel, reopen from the sprint: POST count remains one. This verifies the fixture flow, not production persistence/RLS.
- 150% text/light at 1366: actual document scroll width 1366 equals viewport; reader stacks into one 799px column instead of shrinking text. 390×844 dark: document width 390, reader single 354px column; source link and complete provenance remain reachable. No page-level horizontal overflow observed.
- Simulated failure of all private Career endpoints followed by reload: static Career Prep still opens all three assignments.
- No uncaught browser page errors in executed workflows.

### Finding A-01 — publisher search misses sources

**Severity: minor, localized functional mismatch; repair recommended before release.** Sources search placeholder advertises `Judul, penerbit, atau topik…`, but typing `Bessemer` returns 0/41 even though 17 BVP memos exist. Reproduced from clean Sources tab, all fields/no type filtering. Cause visible in content/filter anatomy: source rows lack publisher metadata and filter excludes source URLs. User cannot use the promised publisher lookup. Repair: add publisher metadata to source records (and display/search it), or remove the promise and offer a truthful institution filter. Evidence: `looker-a-publisher-search.png`.

### Evidence captures

`looker-a-sprint-desktop.png`, `looker-a-evidence-desktop.png`, `looker-a-reader-desktop.png`, `looker-a-evidence-light-150.png`, `looker-a-evidence-mobile.png`, `looker-a-original-mobile.png`, `looker-a-publisher-search.png`. All contain synthetic fixture identity only.

### Limits and initial disposition

No open blocker or major identified in the reviewed scope. A-01 remains open pending repair/retest. Initial tab-dispatch failure occurred before parent notified its correction; the full workflow was rerun successfully after correction. Early test script closed the task before async creation had finished; this was a test wait error, corrected by waiting for actual native task panel and idle state before Escape, not a product finding. Production server persistence/security, cross-tab concurrency, external YouTube playback, deep video/frame viewing and exact original screenshot layout are not verified here. This report is independent Looker A evidence, not a sole Council/production sign-off.

## Targeted repair retest — round 2

**PASS — A-01 closed by independent browser retest.** New source records explicitly include/display publisher. On fresh fixture Sources → search Bessemer, result is exactly **17 dari 41**, all 17 rows identify Bessemer Venture Partners. This corrects the advertised publisher lookup.

Also re-executed parent/QA-directed changes: Expert Evidence VC + query `Twilio` + type Original Investment Firm Memo → related video → back restores VC03 and all three filter values (`1 dari 12`); native task drawer Close button removes the panel; reopening same sprint Task leaves exactly one POST; focused Sources tab activated with keyboard Enter. No uncaught page errors.

Final Looker A disposition: **PASS for the bounded local review; no open blocker, major or minor from this review.** Pointer-only visual limitation and production/external-service exclusions remain. This is not a production persistence/security or source-screenshot visual-parity sign-off.
