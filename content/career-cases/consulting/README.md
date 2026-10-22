# SAJIRASA | Margin collapse and scarce-capital turnaround
**SIMULATED / ORIGINAL EDUCATIONAL CASE — NOT A REAL COMPANY, CLIENT PROJECT, OR FIRM-ENDORSED CASE.**
**SELF Phase 2 / Consulting / Worker C | version 0.1.0 | 2026-10-22**

## CEO mandate — read this before looking at any framework

On 22 October 2026, SajiRasa Nusantara (a fictional refrigerated ready-meal producer/distributor selling Core and Premium packs through retail and business-to-business contracts) asks an independent consultant to decide where to put scarce money and management attention. The company has a credible brand and scale but has moved from profitable to loss-making on its **2026 annualized operating run-rate**. The CFO can commit **at most IDR 1,800 million of upfront cash** and the leadership team has **seven execution slots** during the next 90 days. Initiatives can be paired only if both limits are respected.

The CEO's exact ask: **Which intervention or feasible pair should we conditionally authorize, what explains the profit change, what still needs validating, and what evidence would make us stop or scale within 90 days?** Do not merely select the largest upside. A recommendation must separate the arithmetic explanation from an experimentally supported *causal* explanation.

### Operational constraints and accounting perimeter
- Decision information freeze: **1 October 2026**. 2024 and 2025 are fictional full-year actuals; 2026 is a fictional Jan–Sep based *annualized run-rate estimate*, **not** a reported FY2026 actual result. Annualized option benefits likewise presume full steady-state 12-month exposure, **not** that the business collects all of them in the next 90 days.
- Unit convention: segment volume = **thousand packs**; price and per-pack cost = **thousand IDR/pack**; thus product = **IDR million**. All aggregate profit and cash figures are IDR million unless stated otherwise.
- Operating profit = revenue less listed variable costs less **cash fixed operating overhead**. This is a purposely simplified **case operating profit**, not audited IFRS/PSAK EBIT, EBITDA, or free cash flow. Excludes income taxes, financing, depreciation on incremental capital expenditure, working-capital changes, and ramp timing. **Do not call it net income.**
- Realized prices include baseline trade discounts; variable costs include existing logistics/returns effects. Operational metrics are diagnostic and are **not** extra expenses to add onto Exhibit 02. The 2026 revenue forecast has no additional scenario effects applied yet.
- Each initiative's “one-time execution expense” is treated as a one-off period operating charge; capex is **cash spending, not an operating expense**. Simple payback uses upfront capex + one-time expense as investment and **recurring annual incremental operating profit** as the benefit. It is not discounted cash flow or a cash-flow forecast.
- Initiatives A/B/C are management **proposals/assumptions**, not verified causal interventions or guaranteed negotiated contracts. No savings can be recognized twice.
- Upfront spending = one-time execution expense + capex. Seven slots are mutually exclusive management capacity units; slots are additive. A+C uses 7, B+C uses 7, A+B uses 8. Budget is 1,800. Pair A+B costs 2,150 and is infeasible; A+C costs 1,650 and B+C costs 1,200.
- Assume at most one instance of each initiative. Initiative interactions are **volume-induced overlap**, not a blanket portfolio haircut: C exits 150k Core B2B packs already counted in A's saving base; B cannibalizes 50k Core Retail packs already counted in A's saving base. B and C affect separate baseline channels and have no modeled interaction. If evidence shows cross-channel customer overlap, revise this assumption.

## Company story, not a case template

SajiRasa expanded Core distribution contracts and ran targeted Premium launches. Orders and facilities are busy; executives describe sales as “still substantial.” The CFO, however, sees higher per-pack variable costs, weaker service reliability for Core, pricing pressure in Core, and a tilt away from high-contribution Premium volume. Finance asks if supplier renegotiation (A), Premium relaunch (B), or repricing/escaping low-margin B2B routes (C) earns scarce bandwidth. Operations warns that rushed supplier changes can damage product quality; sales warns that an apparently attractive B2B price increase can accelerate churn.

The CEO cares about **run-rate operating contribution restored after fully implemented interventions**, **upfront cash**, **execution reliability**, and avoiding irreversible brand damage. Annualized improvement is a screening metric, not permission to claim year-one cash payback absent a ramp forecast.

## Exhibits and how to read them

| Exhibit | Files | What the candidate can establish | What it cannot prove |
|---|---|---|---|
| E01 Historical profitability | `exhibits/01-historical.csv` | Revenue / variable / fixed / simplified profit across 2024–26 | FY2026 audited outcome; EBITDA |
| E02 Product × channel unit economics | `exhibits/02-segment-economics.csv` | Price-volume-cost segmentation; full profit reconciliation and bridge | Why input cost or demand moved |
| E03 Operational health | `exhibits/03-operations.csv` | Core OTIF/returns/reorders deteriorate while Premium is steadier | That service defects caused cost inflation or churn |
| E04 Strategic option input assumptions | `exhibits/04-initiatives.csv` | Standalone incremental economics, investment, slots | That predicted price or volume response is certain |
| E05 Bottom-up reachable opportunity | `exhibits/05-market-sizing.csv` | B's addressable premium retail opportunity, account and pack units | Incremental orders, customer acquisition or market share |
| E06 Sensitivity inputs | `exhibits/06-scenarios.csv` | A+C base/downside/upside mechanics and overlap | Probability-weighted forecast |

All figures and operational data are **constructed fiction**. Baseline and assumptions are intentionally transparent so you can independently compute any answer from the files without requesting hidden data.

## Structured solve sequence

1. **Clarify** objective, time period, preferred profit metric, upfront and people constraints (CO-01).
2. **Issue tree**: baseline operating-profit movement = product × channel quantity / realized price / unit variable costs + fixed overhead; separate driver attribution from potential causes (CO-02, CO-04, CO-05).
3. **Segment**: compute 2025 and 2026 revenues, unit contribution and weighted contribution mix by four distinct SKU×channel intersections; isolate 2026 margin and operations (CO-04).
4. **Quantify opportunity**: convert account funnel to possible annual packs and contrast with capacity and B's incremental sales plan (CO-03).
5. **Price-volume-mix bridge**: build a complete revenue and profit bridge. Use consistent sequencing and label any interaction allocation convention. One legitimate convention is volume at old per-unit contribution, price on new units, then unit-cost changes on new units, finally fixed costs. Decompose volume into **overall pack-count effect + mix** if useful; do not conflate mix with pricing (CO-04).
6. **Model A/B/C**: use true incremental units, avoided contribution, cross-effect, recurring run-rate, up-front cash, first-full-year one-time expense, payback, capacity, and scenario testing (CO-06/07/08).
7. **CEO decision and experiment**: deliver six action-title slides, quantified recommendation, stop/scale criteria, challenge responses, and dated 90-day ownership (CO-09 to CO-12).

## Work product quality boundary

**Training:** this packet contains one guided numeric example and learning hints. **Independent assessment:** `assessment.md` must be completed cold without opening `tutor-guide.md` or source answers; deliver a new analysis model and deck. **Reviewer:** use `review-rubric.md` and deterministic `tests/cases/consulting/check-case.cjs`. Numeric QA proves calculation consistency of the provided CSVs; it does not grade business wisdom or actual learner spreadsheets.

**Output:** one inspectable spreadsheet, six-slide management decision deck, one-page assumption & hypothesis log, and 90-day gate owners. This case is not a client engagement and not a guarantee of eligibility at McKinsey, Bain, BCG, or Oliver Wyman. External practices are attributed only in `source-ledger.md`.

**Integration request (Integrator D only):** after independent QA, register this new manifest from `content/career-learning.json` and appropriate Career UI routes; design answer privacy/authentication before serving any blind answer key. Worker C has not edited shared manifests, UI, build configuration, or Supabase.
