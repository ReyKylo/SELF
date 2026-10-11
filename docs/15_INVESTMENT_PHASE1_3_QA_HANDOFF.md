# SELF Investment Intelligence — Phase 1.3 QA Handoff

**Date:** 2026-10-11
**Branch:** `feature/investment-intelligence-academy-v1`
**Pull Request:** https://github.com/ReyKylo/SELF/pull/2
**Production:** NOT merged / NOT deployed

## Automated QA — PASSED

- [Latest passing source & build verification](https://github.com/ReyKylo/SELF/actions/runs/38134483229)
- [Latest passing real-browser Chromium suite](https://github.com/ReyKylo/SELF/actions/runs/38134483232)
- [25 screenshots + machine-readable report](https://github.com/ReyKylo/SELF/actions/runs/38134483232/artifacts/11700925750)

GitHub Actions confirmed **24 passing browser assertion groups** and no browser page errors in tested flows, including:

- Academy Lesson 01 and Lesson 02 progress, quiz and teaching-back.
- Phase 1.2 Research Notebook, as-of sources, user notes, saved slide seed.
- **Phase 1.3 Financial Lab** route, editable merchant acquisition assumptions, immediate 12-month revenue recalculation, Base/Downside/Upside changes, local scenario snapshot.
- Spreadsheet-like monthly CSV and Markdown model-note downloads.
- Sensitivity grid and accessible keyboard-reasoning challenge.
- Promotion of saved model projection as explicit **user-created analyst assumption** into Research Notebook, and persistence after browser refresh.
- Responsive overflow checks across desktop 1440px, laptop 1280px, tablet 768px, and phone 390px.
- Existing SELF navigation and localStorage denied-write warning.

The model's deterministic unit test (run by `tools/build_cloudflare.py`) checks month 1 output, 12-month revenue sums, month-12 annualized ARR run-rate, simple CAC payback formula, scenario ordering, source-provenance labels, exports and round-tripping.

## Bugs fixed

1. Older Academy and Notebook smoke harnesses needed to load the V1.3 module when evaluating route maps.
2. E2E selectors differentiated stage tabs from similarly named in-page CTAs.
3. New Active Case link caused 9px horizontal overflow at tablet width; the responsive CTA layout now wraps vertically on smaller screens.

## Interpretation cautions

- This is a scenario teaching tool, NOT a professional historical Shopify forecast, valuation, or actual 2011 result.
- $438K MRR, ~10K customers anchored from the [Bessemer October 12, 2010 Shopify memo](https://www.bvp.com/memos/shopify); no 2011 company forecast existed per that memo.
- Simple CAC payback excludes churn, unlike the original memo's churn-adjusted payback.
- Model outputs in Research Notebook are labeled `analyst assumption`, not `historical fact`.
- No evidence of future returns is used to justify the as-of 2010 model.

## Open release gates

- The **Reference-Grounded Design Council** has NOT independently scored captured screenshots against the X demo videos and four supplied images.
- No real-device QA on Safari/iPad or private Cloudflare preview.
- Storage remains browser-local and is not included in SELF Supabase sync or legacy backup.
- No formula-editable XLSX, AI Mentor, professional memo, editable PPTX or complete IC deck yet.
- PR stays DRAFT; no user data migration, production merge or publication.

## Next increment

**Phase 1.4 — Model → Investment Memo Workshop:** guided thesis writing, source citations, financial chart claims, basic transaction ownership sensitivity, and draft slides, keeping the user's original reasoning primary. Deliver real XLSX and PPTX in a separate later gate once format fidelity and calculation engines have been validated.
