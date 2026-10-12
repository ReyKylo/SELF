# SELF Investment Intelligence — Phase 1.4 QA Handoff

**Completed:** 2026-10-11 (Asia/Jakarta)
**Working branch:** `feature/investment-intelligence-academy-v1`
**Draft PR:** https://github.com/ReyKylo/SELF/pull/2
**Status:** **Implementation and automated source/Chromium checks PASSED.** No production deployment or merge.

## Verified workflow evidence

- **Passing complete static build & regression suite, implementation commit b04b5ab1:** https://github.com/ReyKylo/SELF/actions/runs/38135859848
- **Passing real Chromium QA, implementation commit b04b5ab1:** https://github.com/ReyKylo/SELF/actions/runs/38135856774
- **31 real-browser full-page screenshots + machine-readable report:** https://github.com/ReyKylo/SELF/actions/runs/38135856774/artifacts/11700868302
  - Includes Investment Memo editor, incomplete/cleared review, storyboard, mobile, tablet, and earlier Academy/Financial Lab screens.
  - Artifact retention is controlled by GitHub Actions; current workflow uses seven-day retention.

## 28 browser assertion groups — PASS

- Existing Academy Lesson 01/02 and historical Case integration still operate, including quizzes, progress, evidence notes, note exports and refresh persistence.
- Financial Lab accepts updated customer/churn scenarios, performs 12-month calculations, creates CSV/Markdown exports and passes selected analyst assumptions into Research Notebook.
- Phase 1.4 Memo shows six source-linked manuscript sections; user drafting persists across navigation.
- Original historical evidence can be attached to sections. Reconciling conflicts is a *user-acknowledged action*, not a fabricated historical explanation.
- Explicit `aria-pressed` acknowledgment controls reliably persist the 2010 data-integrity checklist despite full-view rerenders.
- Deterministic review changes from incomplete to `Completeness checks cleared` once the scripted test populates all sections, sources, 2010 flags, frozen model and conditional terms.
- Markdown memo, printable HTML and slide storyboard exports download successfully. Memo and slide headings persist after reload.
- Desktop 1440px, laptop 1280px, tablet 768px and mobile 390px routes pass horizontal-overflow checks, including Memo.
- Browser had no unhandled errors in checked flow. No-write localStorage state displays warning.

## Tested failure paths & patches during this iteration

1. The base builder used an overly broad `</head>` insertion anchor. The memo printable HTML source contained another literal `</head>`. Builder now targets the exact `\n</head><body` document boundary.
2. Earlier smoke harnesses now load the memo module when evaluating the route map.
3. Unit assertions now match emitted source labels and simulation disclaimers, rather than hardcoded phrases absent from the output.
4. Chromium test used a selector matching both the Review tab and a “Review memo” CTA; the selector was scoped.
5. Native checkbox change/rerender caused unstable browser checks and non-persistent review-acknowledgment interaction; replaced with explicit stateful keyboard-operable buttons with `aria-pressed` and tested their saved state.

## Integrity & scope limitations

- Memo review is **deterministic completeness/provenance validation**, not real AI mentor, institutional investment approval, model audit, or source-by-source third-party certification.
- Bessemer historical source: https://www.bvp.com/memos/shopify — original October 12, 2010 memo mixed with later retrospective commentary on the public page. All underwriting conclusions must use data available as-of that date, or explicitly label modern pedagogy/hindsight.
- Original memo's pre-money valuation terms and growth percentage discrepancy remain **unreconciled**; the app asks the analyst to acknowledge them and avoid invented certainty.
- Financial Lab model forecasts are hypothetical learner-created assumptions, not actual Shopify 2011 revenue, cash flow, EBITDA or valuation.
- The editable memo/workshop exports **Markdown** and printable **HTML**. This phase does **not** create actual downloadable PDF, PPTX or formula-based XLSX.
- Draft data remains **browser-local**, not synced via existing SELF Supabase or backed up by the legacy Workspace tools.
- The user's original Design Council reference videos/four still images have not been inspected for independent pixel-level visual scoring; screenshots exist, but visual signoff is outstanding.
- No Cloudflare private origin deployment, manual Safari/iOS testing, production merge, or public sharing.

## Recommended next gated increment

**Phase 1.5 — IC Defense & Deck Studio foundation:** independent decision challenges, model citation integrity inside slides, editable slide data model, controlled export, and separately validated professional PowerPoint outputs. Before production merge, conduct reference-grounded design review, private hosting/auth approval, and migration/backup planning.
