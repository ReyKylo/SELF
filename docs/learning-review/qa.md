# Independent QA — SELF Career Prep

Role: independent QA agent, separate from Builder and both Lookers. Date: 22 October 2026 (WIB).

## Reading receipt and scope

Read the full reference-design-council SKILL, Design DNA, evaluation map, anti-patterns and project adaptation. Reference anchors are inherited baseline analyses, not a claim of rewatching five videos. V3 8.5–12/14.5–16 motivates visible filter scope and clear; V5 54–60 motivates task-specific split inspection; V2 confirmation and V5 75–80 motivate independently induced failure and persistence checks. I06 is N/A because this reading library has no drag operation.

Runtime: local actual SELF frontend with Chromium headless 145, intercepted synthetic Supabase data and actual curated teaching JSON. No production user records, credentials, database writes, or RLS tests. Fonts were held to local fallbacks. Reproducible script: `node tests/browser_career_learning.cjs` with Playwright available through `CODEX_PRIMARY_RUNTIME_NODE_MODULES` and the helper's configured browser executable. Precise reviewed content/build hash and ordered results: `qa-results.json`.

## Reproduced defect and repair verification

**MAJOR found, now closed:** the Task drawer's inline `onclick="event.stopPropagation()"` prevented delegated Close/tab actions. Opening a sprint Task then clicking Close left the overlay covering the library and blocked the next day selection. Reported to Builder. Builder removed the inline interception and guarded only backdrop-hit closing. The final browser regression uses the actual Close button and requires the overlay to disappear before continuing; all task cases passed after repair. No production behavior beyond this local build is inferred.

## Verified runtime checks

| Criteria | Actions and fixture | Actual result | Status |
|---|---|---|---|
| S01 / I01 | Open Career Prep with empty synthetic Tasks | No automatic task creation; explicit button opens canonical Task detail | PASS / VERIFIED locally |
| D01 / D03 | Two Task click events under artificial delay; page reload and reopen | One POST/row, same ID after reload; existing task opens without another POST | PASS / VERIFIED locally |
| S02 / D01 / D03 | Server commits POST then aborts acknowledgement | Follow-up GET reconciles stable ID; same task opens, no false error or duplicate | PASS / VERIFIED locally |
| S02 / D01 | Task service returns 503, then restored | Explicit error, no phantom row/POST; retry creates exactly one task and opens it | PASS / VERIFIED locally |
| D01 / D03 | Hold old-account POST, use actual synthetic sign out/sign in, release old response | New account stays in library with no old task overlay or injected record | PASS / VERIFIED locally |
| I02 / D02 | Filter VC; no-match search; clear | Counts match rows: 4/12, 0/12, then 12/12 | PASS / VERIFIED locally |
| P1 / I03 | Select VC04 → related YouTube → back | PagerDuty evidence and focused title restored; video does not embed automatically | PASS / VERIFIED locally |
| S01 / provenance | Open source list and source-pointer evidence | 41 actual rows; title-screening/index-only states remain explicit; no fabricated screenshot | PASS / VERIFIED locally |
| S02 | All unrelated Career table requests return 503 | Static learning still opens | PASS / VERIFIED locally |
| S02 | Curated JSON returns 503; press Retry after recovery | Honest error, then actual sprint content | PASS / VERIFIED locally |
| V02 / V03 / A01 / I03 | Four tabs at 390×844 and 1366×768, 150% text; keyboard typing; live theme toggle | No document horizontal overflow; search retains focus; responsive control wrapping; theme changes | PASS / VERIFIED for those bounded checks |

Screenshots `qa-390-150.png` and `qa-1366-150.png` are actual synthetic-fixture runtime captures. Mobile screenshot visually inspected: controls wrap, content remains in normal vertical flow, both navigation scopes retain labels; no screenshot of a real account is included.

## Final result and limits

No open blocker or major remains in the independently exercised scope. This is a bounded local runtime QA pass, not production deployment acceptance or exact screenshot parity. External YouTube playback, publisher availability/rights, production authorization between real accounts, screen-reader compliance, measured contrast, full performance trace and all-device coverage remain unverified. No 60fps, full accessibility certification, every-video-watched, or 41-deeply-reviewed claim is supported.
