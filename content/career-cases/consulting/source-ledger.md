# Provenance, source criticism, and numerical assumption ledger
**Freeze: 2026-10-22.** This document distinguishes **official recruiting exercises**, **our fictional evidence**, and **analyst interpretation**. None of these official exercises is evidence of a publicly released confidential real-client deck. External site content and screenshots are not copied into this repository.

## Official benchmark analyses (direct pages consulted, not claimed expert-reviewed)

### S1. Bain — Coffee Shop Co. (official practice case)
- Publisher: Bain & Company. URL: https://www.bain.com/careers/hiring-process/interviewing/coffee-case-study/ ; page section **Case Setup → Analysis → Breakeven → Case Recommendation**; original date not stated on page; inspected 22 Oct 2026; public HTML, “show answer” sections visible. License to reuse external exhibit images **not established**, so no image imported. Internal SELF catalog source ID 36.
- **INI APA?** An interview practice about opening a coffee shop, market size, fixed versus per-unit expenses, and break-even sales.
- **INI KENAPA?** Its progression starts from defining the decision, then market estimate, then unit contribution, then a recommendation that questions mere break-even; the cited “better answer” asks about investment recovery and other considerations.
- **CARA ACHIEVE:** Recreate an **original** market funnel (accounts × serviceability × qualification × conversion × packs), then a variable/fixed cost model and payback. In the deck, headline the decision, not “market size.”
- **ANALISIS PROFESIONAL:** Simple assumed addressable demand does not equal captured demand; the one-year break-even setup includes opening costs and annual operating costs and should not be confused with repeat-year accounting profit. Our own A/B/C cash vs operating distinctions are explicit.

### S2. McKinsey — Electro-Light (official practice case)
- Publisher: McKinsey & Company. URL: https://www.mckinsey.com/careers/interviewing/electrolight ; sections **Client goal / Questions 1 and 2**; original page date not stated; HTML text checked 22 Oct 2026. Chart **ElectroLight** referenced as embedded image in Q2, its numeric pixels were **not separately audited or reproduced**. SELF source 33.
- **INI APA?** A hypothetical US beverage new-product launch; its next-stage question asks what share of a relevant drink market breaks even under a target price and up-front fixed costs.
- **INI KENAPA?** It makes the candidate first formulate the critical factors and only later use a particular exhibit/market-share threshold to decide whether launching is defensible.
- **CARA ACHIEVE:** Put the SajiRasa CEO question first; build E05 market sizing with relevant denominator, then test incremental volume and execution capacity instead of treating a market-size percentage as revenue.
- **ANALISIS PROFESIONAL:** A threshold is not evidence of customer adoption; an embedded market graphic may encode segmentation definitions unavailable in adjacent text. Do not claim our fictional numbers came from McKinsey.

### S3. McKinsey — Talbot Trucks (official practice case)
- Publisher: McKinsey & Company. URL: https://www.mckinsey.com/careers/interviewing/talbot-trucks ; sections **Question 1 / Question 2 (TCO)**; no publication date displayed; HTML text checked 22 Oct 2026. An embedded TCO graphic is referenced but not pixel-reviewed. SELF source 32.
- **INI APA?** A hypothetical heavy-truck manufacturer evaluating electric-truck investment; a total cost of ownership comparison includes fuel/other costs, truck asset economics and operational constraints (including driver scarcity).
- **INI KENAPA?** The comparison forces a whole-system decision, not just purchase price or one variable input.
- **CARA ACHIEVE:** Model all proposal cash plus recurring margin/cost effects, and set risk gates around service quality and implementation burden; display the complete option comparison beside the CEO decision.
- **ANALISIS PROFESIONAL:** Different assumptions on utilization, operating lifetime or residuals can reverse a TCO conclusion. Here, excluding working capital/tax/ramp means our simple payback must be labeled a screening measure.

### S4. Oliver Wyman — Supermarket Pharmacy (official practice case)
- Publisher: Oliver Wyman. URL: https://www.oliverwyman.com/careers/entry-level/interview-preparation/supermarket-pharmacy-case-interview.html ; sections **Client goal; Question 1; Questions 2–4**; original publication date not identified; HTML inspected 22 Oct 2026. SELF source 39.
- **INI APA?** An in-store pharmacy decision with explicit capital payback constraint, demand assumption, contribution/profit estimates and implementation risk.
- **INI KENAPA?** It ties recommendation to capital availability and explicitly asks what additional information or risks matter, not only the theoretical profits.
- **CARA ACHIEVE:** Set SajiRasa capital and execution constraints up front, compute portfolio feasible set and scenario payback, then put kill criteria on Slide 6.
- **ANALISIS PROFESIONAL:** The public page appears numerically **inconsistent across its illustration**: a worked example describes $4,000,000 setup and $165,000 monthly profit, while its sample recommendation says $400,000 and $16,500. These are different absolute numbers even though the ratio is the same. **Do not adopt the page's displayed amounts as unchallenged authoritative figures.** Our original scenario figures are independently reconciled.

### S5. BCG — Case Interview Preparation (official preparation guidance; NOT a verified written case)
- Publisher: BCG Careers. URL: https://careers.bcg.com/global/en/case-interview-preparation ; sections **What to Expect / Do / Don't**; publication date not stated, public HTML inspected 22 Oct 2026.
- **INI APA?** Official guidance for structuring ambiguous cases, calculating, communicating and explaining assumptions.
- **INI KENAPA?** It emphasizes process quality rather than a single magic formula or one correct solution.
- **CARA ACHIEVE:** Use a defensible bespoke issue tree and make multiple coherent choices acceptable if trade-offs and gates are clearly explained.
- **ANALISIS PROFESIONAL:** A separate **BCG written case packet or proprietary exhibit was not obtained or examined**. Do not imply we reverse engineered one. This is preparation guidance, not evidence of BCG's internal slide templates.

### S6. SELF Phase 1 quality blueprint (internal product specification, not external validation)
- Repository `docs/CAREER_PREP_PHASE1_QUALITY_BLUEPRINT.md`; `content/career-prep-quality-blueprint.json`, tracks CO-01 to CO-12; 2026-10-22; read from main SHA `0a9ba528ac362775335b9c65427a8500af700ac2`.
- Dictates analogy→terminology→definition→visual→worked exercise→independent task→review and 30/25/20/15/10 rubric. A curriculum specification is **not** a hiring firm's certification.

## Synthetic case exhibits: line of provenance

| ID | File | Origin | Date / horizon | What is a fact vs a hypothesis |
|---|---|---|---|---|
| E01 | `exhibits/01-historical.csv` | Worker C-created illustrative totals; no public filings | 2024 actual*; 2025 actual*; 2026 annualized estimate* | All figures fictional; identities arithmetically checkable |
| E02 | `exhibits/02-segment-economics.csv` | Worker C original unit/price/cost matrix | 2025 / 2026 | Quantities are synthetic given data; cost inflation *causes* unknown |
| E03 | `exhibits/03-operations.csv` | Worker C synthetic operational outcomes | 2025 / 2026 | Returns and service move together; causal role unproven |
| E04 | `exhibits/04-initiatives.csv` | Hypothetical CEO proposals | Future steady state | Every uplift, cannibalization and implementation number is a scenario assumption |
| E05 | `exhibits/05-market-sizing.csv` | Explicit funnel assumptions, not market research | Prospecting year after pilot | These assumptions bound reach only, not actual purchase intent |
| E06 | `exhibits/06-scenarios.csv` | Invented base/downside/upside stress settings | Future steady state | Scenario outcomes are analytical counterfactuals, not forecasts with calibrated probabilities |

\* “Actual” refers **only to the fictional SajiRasa narrative**, not audited real-world results.

## Specific hypotheses to investigate rather than claim proven
1. Supplier input/packaging price increases and poorer production yields explain unit cost change → request purchase invoices, batch yield, supplier clauses and split by SKU/channel.
2. OTIF failure/returns in Core contribute to repeat-order weakness → compare matched store cohorts, weather/route constraints and lagged incident counts before asserting causality.
3. B2B Core customers would tolerate a price rise with a controlled volume loss → test contracts and representative account pilots; record affected customers by contract, not by average.
4. A's per-pack saving holds for 80% of packs without higher defect/returns → validate supplier qualification and dual-source quality.
5. Premium retail marketing can add 150k net **gross incremental Premium units** with only 50k displaced Core and a discount affecting all 550k post-campaign Premium packs → run holdout experiments and reconcile sales by store.
6. Volume between channels and A's eligible production base may overlap beyond the simple modeled 150k/50k removals → trace order/customer cohorts and prevent double counting.

## Missing assumptions and exclusion ledger
- **No invented published national market data**: all market sizes are transparent fabricated E05 inputs.
- **Not modeled**: seasonality across the 2026 forecast, inventory movement, working capital, financing, taxes, depreciation, capital maintenance, expansion costs beyond disclosed capex, discounted valuation, price elasticities outside scenarios, contract notice periods and partial-year rollout. Must disclose any added assumption.
- No legal/food safety regulatory opinion is offered. Real changes need counsel, quality/recall procedure, retailer notice terms, and labor impact review.
- S1–S5 URL/section descriptions are editorial observations from public practice pages, not licensed source-artifact reproductions or proofs of client delivery. **No external embedded image was copied.**
