# Career Prep — phase status (23 October 2026)

Evidence-based reconciliation of the seven-phase roadmap in `content/career-prep-quality-blueprint.json` (`planned_release`). Career Prep is separate from **SELF Core** (shell, Spaces, Tasks, Links, Boards) and from **Career** (companies, people, applications, CVs, Radar); their phase numbers are independent.

Legend: **Code** = merged or in the open PR; **CI** = GitHub Actions; **Local QA** = run in this session; **Prod** = verified on the deployed Worker.

| Phase | Blueprint scope | Delivered (evidence) | Local QA / CI | Prod |
|---|---|---|---|---|
| 1 | Quality blueprint, 36 competencies, analogy→term teaching contract | `docs/CAREER_PREP_PHASE1_QUALITY_BLUEPRINT.md`, `content/career-prep-quality-blueprint.json` (PR #13) | `smoke_career_prep_blueprint.cjs` pass | n/a (spec) |
| 2 | Source-backed simulated cases (PE Aruna, VC ArusOps, Consulting SajiRasa) | `content/career-cases/**` (PRs #15–#18); source-only, never served | three `check-case.cjs` pass; `dist/content/career-cases` absent | not applicable (unserved) |
| 3 | Lesson implementations | 18 guided lessons + decision-transfer + 36-competency coverage (PRs #19–#21) | `smoke_career_teaching.cjs` pass | not verified |
| 4 | Full model lab | PE Sources & Uses, 5-year LBO, sensitivity/max bid; VC underwriting + cap table/waterfall; Consulting profit bridge (PRs #22–#27) | six lab smoke tests pass | not verified |
| 5 | Deterministic and judgement review | Director Review: 3 tracks × 5 challenges + twist, 100-point rubric as **content for human review**, draft/final export, confirmed reset, backtracking (PRs #28–#32) | module + full-shell Chromium tests pass (390px/1366px, 150% text, account switch, 503 retry) | deploy Ready in Cloudflare (owner screenshot); live behaviour not verified |
| 6 | Independent work samples | **This change**: Work Sample tab (blind PE/VC/Consulting briefs and data), deterministic XLSX structure check, hand-offs to the existing Portfolio Workspace and Director Review. See `PHASE6_WORK_SAMPLES.md` | content gate + 4 browser scenarios pass | not verified |
| 7 | Full QA and release | Local regression (36 test scripts), static build and exclusion checks. Production acceptance is only partly evidenced, see below | pass locally | **partially verified**: main deploys Ready; live checks outstanding |

## Phase 5 decisions verified in code
- Answers are **session-only by design**. `PHASE5_DIRECTOR_REVIEW.md` makes persistence conditional ("if persistence is approved; otherwise explicitly label local session mode"). The UI says so and offers *Download draft* before refresh or reset. Not changed.
- There is **no automatic Director score**. The same document states the score is "a reviewer judgment, not deterministic proof". The rubric (technical 30, judgment 25, evidence 20, risk 15, communication 10; draft threshold 80/100) ships as content, not as a calculator. Not changed.

## Deployment evidence (owner-supplied, 23 Oct 2026)
A Cloudflare dashboard screenshot of Workers & Pages → `self` → Deployments (provided by the owner; not independently verifiable from this repository) shows every deployment from `main` as **Ready**. The newest, version `fe1ff8d6` ("fix(career): connect Director Review to SELF…", the title of `c8b3f1a`), is shown as 16 hours old and as the active deployment. Earlier rows map by title to `e3a485e`, `5cf6026`, `dd48055`, `4342375` and the Phase 4 commits. The deployments list shows version IDs, not git SHAs, so the mapping is by commit title; the Build link per row would show the SHA.

What this supports: the production pipeline builds and deploys `main`, and Phase 5 was deployed as the active version.
What it does not show: that the live site behaves correctly (login, Career Prep, RLS), the production URL, or that the "Traffic %" control (read as 0% beside a 100% slider in the screenshot) means the version is serving all traffic. Those still need the checks in `PHASE5_PRODUCTION_RELEASE_GATE.md`.

The red `Workers Builds: self` check on PRs #32 and #33 comes from **preview builds of non-production branches**; production builds from `main` succeed. Its cause is still unknown (needs that build's log) but it does not block production. The Work Sample tab (this PR) is **not** in production until the PR is merged to `main` and deployed.

## What is not verified
- Production origin URL, authenticated login, two-real-account RLS, real-device mobile, and the live behaviour of Director Review.
- Supabase Auth leaked-password protection is disabled (dashboard setting).
- Tests run against a local fixture that intercepts Supabase. They prove the shipped code, not the deployed Worker or the real database policies.

## Release state
Code complete for Phases 1–6. Local QA complete for the tested surface. **Production verification: partial** (deploy evidence only). Do not describe Career Prep as released until `PHASE5_PRODUCTION_RELEASE_GATE.md` steps 1–10 have evidence.
