# SIMULATED | PT Aruna Supply — PE acquisition underwriting

**SELF Career Prep / Worker A / Phase 2.** Original training fiction, prepared **22 October 2026**. This is **not** a real company, offering memorandum, completed transaction, lender commitment, investment advice, human-reviewed certification or evidence of job readiness. All company facts, dates, financials, debt terms, lender promises and valuations are **simulated**. All currency amounts **IDR billion** unless otherwise stated (Rp1 billion = Rp1 miliar). Forecast rates in CSV are decimals.

## The investment tension

PT Aruna Supply is an **invented** Indonesian distributor of hospital imaging devices, diagnostics and consumables. Founder sellers point to EBITDA growth **22 → 29 → 39** in FY2023–FY2025 and ask **7.0x FY2025 EBITDA = EV 273**. But FY2025 **cash from operations is −9.50**, operating net working capital (AR + inventory − AP) climbs **51 → 73 → 110**, and 2025 balance includes **AR 75** (16 overdue >90 days) plus **inventory 80** (17 aged >180 days). Is growth economically valuable if receivables consume the cash lenders expect to fund debt repayment?

**Your role:** PE Associate presenting to a skeptical investment committee. Decide *buy / pass / conditional bid*, maximum **enterprise value (EV)**, credit structure, three diligence kill gates, and why the answer survives scenario shocks. Seller ask EV 273 is a **negotiating anchor**, not a confirmed fair value.

## Training route (70–130 minutes core, longer for spreadsheet)

1. Read the six original case exhibits and `source-ledger.md`; rebuild 2023–25 linked income statement, cash flow and balance sheet.
2. Work through `tutor-guide.md`, then fill `learner-tasks.md` using a spreadsheet with linked formulas; do not type end outputs directly.
3. Model a closing at the seller ask and at your revised price. Draw a five-year term loan/revolver cash waterfall and check annual covenant compliance.
4. Build both base and downside, funding-gap schedule, EV-to-equity exit and entry/exit multiple sensitivity. **Downside must show extra sponsor equity required to keep cash at 12 once revolver is full**; do not silently allow negative cash or call unfunded enterprise value an equity return.
5. Draft **two-page IC memo** and a 5-minute defense. `example-ic-memo.md` is only a *coached training example* for the original case, **not** a sealed assessment solution.
6. Only then open `assessment.md` for an independent twist; no assessment answer key is shipped. Record revisions and provenance before presenting anywhere.

## Exhibits and checks

| # | Type and scope | Decision use |
|---|---|---|
| 01 | Three-year IS / BS / CF CSV | Reconcile EBITDA, cash conversion, year-end balance sheet |
| 02 | 2025 receivable aging / slow inventory CSV | Underwrite collectibility and overhang; not proof of impairment |
| 03 | Transaction, leverage, tax and financing terms CSV | Rebuild Sources & Uses and price-to-equity |
| 04 | FY2026–2030 base/downside operational drivers CSV | Forecast revenue, EBITDA, NWC, tax and CFADS |
| 05 | Five annual net leverage/DSCR/cash covenants CSV | Determine whether financing survives stress |
| 06 | 3×3 base operating entry/exit EV multiple sensitivity CSV | Test return compression if exit multiple contracts |

### Reporting labels

- **Source fact:** issuer-authored **methodology and educational descriptions only**, linked in source ledger.
- **Case assumption / simulated data:** every financial number and story fact regarding Aruna.
- **Analyst inference:** your judgment about recoverability, seller bid and covenant headroom; not verified unless independently diligenced.

**Critical timing:** FY2025 historical cutoff is 31 Dec 2025; acquisition closes 31 Dec 2025 for a simplified model; five year-end periods 2026–2030; exit at 31 Dec 2030. The document creation date is later (22 Oct 2026), but neither the scenario nor underwriting is a real historical investment. Fixed debt interest is on **opening annual balances** and paid at year-end. Tax assumes 22% on positive EBIT less cash interest (no NOL, disallowed-interest rules or deferred tax). No dividends until exit.

### Fee / cash double-counting guardrail

At seller ask: **EV 273**; seller equity proceeds **EV − 80 debt + 13.54 cash = 206.54**. Uses: seller proceeds **206.54** + repay existing debt **80** + fees **5** = **291.54**. Target cash usable at close is only **13.54 − 12 minimum cash = 1.54**. Sources: senior acquisition term loan **130** + sponsor equity **160** + usable cash **1.54** = **291.54**. Closing target cash **12** remains in the company and must **not** be counted twice. No purchase-accounting adjustments or rollover equity are modeled.

## QA and boundaries

Run from SELF repository root: `node tests/cases/pe/check-case.cjs`. The deterministic test reads these CSVs and exercises historical 3-statement equations, aging reconciliations, sources/uses, debt waterfall, covenant gates, base/downside returns, exit matrix and two intentional corruption traps. It does **not** validate a learner's unseen XLSX or a production upload. Manual review remains required for diligence quality, narratives, formula linkages in any separately created workbook, portfolio release and recruiting use. Shared Career UI registration is an **Integrator D** task only; case files are deliberately not yet connected to production.
