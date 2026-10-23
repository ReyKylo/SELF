# Phase 6 — Independent Work Samples

Career Prep → **Work Sample** tab. Scope comes from the blueprint (`gates.G4_TECH`, `G5_DECISION`, `G6_PORTFOLIO`, `case_requirements.independent`); no new curriculum or scoring standard is introduced.

## What it is
For each track the learner gets a **blind, simulated** work sample they attempt after the guided material, build in their own workbook, store in their private Portfolio Workspace, and then defend in Director Review.

| Track | Case | Source (unchanged, reviewed) |
|---|---|---|
| PE | PT Sagara CareTrade, 100-minute timebox | `content/career-cases/pe/assessment.md` |
| VC | ArusOps regional pilot, cutoff 30 Sep 2026 | `content/career-cases/vc/blind/holdout-brief.md`, `holdout-cohorts.csv` |
| Consulting | SajiRasa cold assessment, exhibits E01–E06 | `content/career-cases/consulting/assessment.md`, `exhibits/*.csv` |

Served copies live in `content/work-samples/**` and are asserted **byte-identical** to those sources by `tests/smoke_worksample_content.cjs`.

## What it deliberately does not do
- No answer key, worked solution, tutor guide, rubric calculator, or reviewer key is served. The test fails if any served file equals a sealed or worked-out file, or contains a line of `tests/cases/vc/reviewer-key.md`.
- No automatic grading, certification, or "recruiter-ready" claim. Final judgement is human review plus the Director Review defense, as the blueprint requires (`rubric.never_claim`).
- The workbook check does **not** upload the file and does not write to the database or storage.

## Deterministic workbook structure check (G4)
`career-workbook-check.js` reads the real `.xlsx` (ZIP + OOXML) in the browser and reports sheets, formula count, typed-in numbers and cached Excel error values (`#REF!`, `#DIV/0!` and so on). Optionally it compares against the shipped starter workbook and flags starter formula cells that are now typed numbers or empty.

Honest limits, repeated in the UI: it checks **structure only**, not whether numbers, assumptions or the decision are right; error values are visible only if the file was saved by Excel or Sheets after calculation (the shipped starters carry no cached values); restructuring a model is legitimate, so starter comparison is opt-in and advisory.

Evidence: `tests/smoke_workbook_check.cjs` parses the three real starters (78 / 25 / 16 formulas), flags a formula typed over with a constant at exactly the changed cell, a cleared formula, an injected `#REF!`, a formula-free workbook, and rejects empty, plain-text, truncated, non-workbook and size-lying inputs. The test builds the broken workbooks with its own ZIP writer, independent of the module under test.

## Save and resume
Unchanged and reused: the Portfolio Workspace stores the written decision, self-check state and uploaded deliverables per account (`career_portfolio_cases`, `career_portfolio_files`, owner-scoped RLS). The Work Sample tab itself holds no learner answers; the workbook check result is in memory and is cleared on account change.

## Tests
- `tests/smoke_worksample_content.cjs` — content integrity, leak guard, wiring, honesty, markdown/CSV renderer safety.
- `tests/smoke_workbook_check.cjs` — structure check against real and deliberately broken workbooks.
- `tests/browser_worksample.cjs` — real SELF shell in Chromium at 390px and 1366px with 150% text: three tracks, downloads round-trip byte-identical, workbook check, keyboard, hand-offs to Director Review and Portfolio, 503 retry, account switch.

Production acceptance for this tab follows `PHASE5_PRODUCTION_RELEASE_GATE.md` (same unverified items).
