# Career Prep — phase status (23 October 2026)

Evidence-based reconciliation of the seven-phase roadmap in `content/career-prep-quality-blueprint.json` (`planned_release`). Career Prep is separate from **SELF Core** (shell, Spaces, Tasks, Links, Boards) and from **Career** (companies, people, applications, CVs, Radar); their phase numbers are independent.

Legend: **Code** = merged or in the open PR; **CI** = GitHub Actions; **Local QA** = run in this session; **Prod** = verified on the deployed Worker.

| Phase | Blueprint scope | Delivered (evidence) | Local QA / CI | Prod |
|---|---|---|---|---|
| 1 | Quality blueprint, 36 competencies, analogy→term teaching contract | `docs/CAREER_PREP_PHASE1_QUALITY_BLUEPRINT.md`, `content/career-prep-quality-blueprint.json` (PR #13) | `smoke_career_prep_blueprint.cjs` pass | n/a (spec) |
| 2 | Source-backed simulated cases (PE Aruna, VC ArusOps, Consulting SajiRasa) | `content/career-cases/**` (PRs #15–#18); source-only, never served | three `check-case.cjs` pass; `dist/content/career-cases` absent | not applicable (unserved) |
| 3 | Lesson implementations | 18 guided lessons + decision-transfer + 36-competency coverage (PRs #19–#21) | `smoke_career_teaching.cjs` pass | not verified |
| 4 | Full model lab | PE Sources & Uses, 5-year LBO, sensitivity/max bid; VC underwriting + cap table/waterfall; Consulting profit bridge (PRs #22–#27) | six lab smoke tests pass | not verified |
| 5 | Deterministic and judgement review | Director Review: 3 tracks × 5 challenges + twist, 100-point rubric as **content for human review**, draft/final export, confirmed reset, backtracking (PRs #28–#32) | module + full-shell Chromium tests pass (390px/1366px, 150% text, account switch, 503 retry) | not verified |
| 6 | Independent work samples | **This change**: Work Sample tab (blind PE/VC/Consulting briefs and data), deterministic XLSX structure check, hand-offs to the existing Portfolio Workspace and Director Review. See `PHASE6_WORK_SAMPLES.md` | content gate + 4 browser scenarios pass | not verified |
| 7 | Full QA and release | Local regression (36 test scripts), static build and exclusion checks. Production acceptance **blocked**, see below | pass locally | **blocked** |

## Phase 5 decisions verified in code
- Answers are **session-only by design**. `PHASE5_DIRECTOR_REVIEW.md` makes persistence conditional ("if persistence is approved; otherwise explicitly label local session mode"). The UI says so and offers *Download draft* before refresh or reset. Not changed.
- There is **no automatic Director score**. The same document states the score is "a reviewer judgment, not deterministic proof". The rubric (technical 30, judgment 25, evidence 20, risk 15, communication 10; draft threshold 80/100) ships as content, not as a calculator. Not changed.

## What is not verified
- Cloudflare: the `Workers Builds: self` check is red on PRs #32 and #33 and the log is only visible in the Cloudflare dashboard. Cause unknown. Which commit is live is unknown. No production origin is recorded in the repository.
- Authenticated production login, two-real-account RLS test, real-device mobile test, and Supabase Auth leaked-password protection (currently disabled) remain open.
- Tests above run against a local fixture that intercepts Supabase. They prove behaviour of the shipped code, not the deployed Worker or the real database policies.

## Release state
Code complete for Phases 1–6. Local QA complete for the tested surface. **Production verification: not done.** Do not describe Career Prep as released until `PHASE5_PRODUCTION_RELEASE_GATE.md` steps 1–10 have evidence.
