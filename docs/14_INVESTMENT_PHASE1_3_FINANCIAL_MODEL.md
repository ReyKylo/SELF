# SELF Investment Intelligence — Phase 1.3 Financial Analyst Practice

**Status:** PR candidate / feature branch, not deployed to SELF production.
**Branch:** `feature/investment-intelligence-academy-v1`
**GitHub PR:** https://github.com/ReyKylo/SELF/pull/2
**Access in app build:** `/#investment` → Financial Model.

## Intent

Allow a beginner VC analyst to **personally construct and defend** a simple 12-month subscription merchant-economics scenario, without presenting made-up projections as historical 2011 Shopify financials.

## Features shipped

1. A visually distinct Financial Lab with short Indonesian explanations and English analyst terminology.
2. Five **editable Base Case assumptions**: monthly new merchants, monthly logo churn, monthly ARPU, gross margin, customer acquisition cost (CAC).
3. Model starting anchor: approximately 10,000 merchants and US$438K MRR as reported by Bessemer in October 2010. These are approximate figures; the model treats them as working starting values.
4. Deterministic 12-month calculation table and charts. Results include month-12 merchants, MRR, annualized ending ARR run-rate (not revenue booked), simple CAC payback, total modeled year revenue, gross profit, acquisition spend, and a contribution-before-opex proxy.
5. Downside, Base Case, Upside using explicit, fixed scenario rules; and churn × new-customer sensitivity grid (month-12 ARR run-rate).
6. Interactive, deterministic critical-reasoning question clarifying that this simple CAC payback is **NOT** the memo's churn-adjusted 7–9 month payback.
7. Learner-authored assumption explanation, explicit local snapshot save, CSV of monthly table, and Markdown model notes export.
8. Promotion to Research Notebook only when written reasoning is provided. Adds a note labeled **analyst assumption / not historical**, linked to the primary source for the **original starting figures only**. Existing note with the same scenario ID is updated rather than duplicated.
9. Academy Home, Case Workspace, Navigation and Portfolio draft links to Financial Worksheet.
10. Isolated localStorage key: `self.investment.model.v13` (not synced to Supabase or existing workspace backup).

## Calculation contract

For months 1–12:

- `ending_merchants[t] = ending_merchants[t-1] × (1 - monthly_churn_pct/100) + monthly_new_merchants`
- `MRR[t] = ending_merchants[t] × ARPU`
- `gross_profit[t] = MRR[t] × gross_margin_pct/100`
- `acquisition_spend[t] = monthly_new_merchants × CAC`
- `contribution_before_opex[t] = gross_profit[t] - acquisition_spend[t]`
- `simple_CAC_payback_months = CAC / (ARPU × gross_margin_pct/100)` (ignores churn)
- `ending_ARR_run_rate = MRR[12] × 12` (NOT booked annual sales)
- 12-month totals are sums of the monthly estimates.

Default Base Case assumptions are **practice assumptions only**, not Bessemer's projections:

| Input | Base | Downside mapping | Upside mapping |
|---|---:|---:|---:|
| New customers per month | 850 | ×0.65 | ×1.30 |
| Monthly logo churn | 4% | +2 percentage points | −1 percentage point |
| ARPU/month | US$43.80 | ×0.95 | ×1.07 |
| Hypothetical gross margin | 75% | −5 percentage points | +3 percentage points |
| CAC | US$200 | ×1.10 | ×0.95 |

Scenarios cap input ranges. Sensitivity holds price/margin/CAC at Base Case and shifts merchant adds ±25% and churn ±2 percentage points.

**Material limitations:** no cohort curves, expansion/transaction fees, seasonal growth, marketing channel constraints, taxes, capex, operating costs, working capital, funding structure, cash runway, option pool, or professional full-year valuation. The results are illustrative, not financial advice.

## Historical source and lookahead discipline

Original: [Bessemer Venture Partners Shopify Investment Memo, 12 Oct 2010](https://www.bvp.com/memos/shopify). The memo explicitly states that Shopify had **not forecasted 2011** at the time. As a consequence, no results from this learning model may be misrepresented as realized or internally approved 2011 numbers. The online memo also has later retrospective callouts and several numeric/term discrepancies flagged in Phase 1.2.

## Verification

- `python3 tools/build_cloudflare.py` including legacy static checks, model unit mathematics, previous Academy and Research Notebook tests.
- `node tools/qa_investment_model_v13.cjs` for month-by-month model, scenario ordering, persistence, exports and provenance.
- Real Chromium workflow `.github/workflows/investment-browser-qa.yml` for model editing, snapshot, 12-row table, CSV and Markdown export, sensitivity, keyboard-based challenge, research-notebook promotion, refresh, desktop/tablet/mobile overflow.

## Still missing / release gate

- No independent source-level QA or human Design Council review of archived reference visuals.
- No real AI Mentor or Excel spreadsheet engine/export; the CSV is a simple numeric month-by-month worksheet, not an XLSX formula model.
- No editable professional investment deck or final investment committee memo.
- No cloud user sync. Browser localStorage may be lost and is not shared between devices.
- No production deployment or security verification behind private Cloudflare access.
- On-demand data review and visual screenshot inspection remain separate from automated tests.

Keep PR #2 in draft until deliberate review of reference-grounded visual quality, persistence requirements, and private deployment policies.
