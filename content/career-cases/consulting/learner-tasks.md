# Candidate workbook assignments | evidence before intuition
**Do not open `tests/cases/consulting/check-case.cjs` while solving.** Required inputs are in E01–E06; you may add explicit scenario assumptions but never silently invent data. All numeric outputs label period and units.

## Guided exercises (complete before independent cold solve)

| Drill | Prompt | Required check | Skills |
|---|---|---|---|
| 01 | State CEO objective, primary metric, capital limit, decision timing and what is excluded from case operating profit | One sentence + accounting perimeter | CO-01 |
| 02 | Draw issue tree separating volume, mix, price, per-unit variable cost and fixed cash costs | No “sales” duplicated with price/volume; 4 SKU×channel leaves partition business | CO-02 |
| 03 | Build E02 into a 4-row 2025/2026 segment schedule; calculate total volume, revenue, variable cost and profit; reconcile E01 | Both years reconcile exactly, with units | CO-04 |
| 04 | Show two bridges: revenue and operating profit. Disaggregate volume into total packs versus mix. State ordering convention | Bridge zero-residual; signs make economic sense | CO-04/05 |
| 05 | Test whether service / returns caused the rising costs. List invoices, QA lots, cohorts and needed controlled comparisons | Causal hypotheses not called proven facts | CO-05 |
| 06 | Build bottom-up reachable Premium Retail market and cross-check B's 150k incremental pack plan and incremental factory capacity | Whole units, denominators and capacity constraints correct | CO-03 |
| 07 | Model A/B/C: incremental contribution, ongoing execution cost, one-offs, capex, cash payback, operating profit impact | No capex expensed into operating profit; no discount on only incremental Premium packs | CO-06 |
| 08 | Build A+B, A+C, B+C. Identify A's eligible volume reduced by B/C; reject infeasible portfolios | Interaction explicit, budget & slots both tested | CO-07/08 |
| 09 | Stress A+C using E06 downside and upside; state what operational assumption matters most and if regret changes choice | Not just a nominal single-case result | CO-08/11 |
| 10 | Build evidence-gated 90-day plan and defend six-slide deck with an issue tree, not canned 3Cs | Owners, KPI denominator, dates, gates, one action title per slide | CO-09/10/12 |

### Deliverables
- **Spreadsheet** with tabs `Inputs`, `Segment P&L`, `Profit Bridge`, `Option Economics`, `Constraints and Overlap`, `Scenarios`, `Market Funnel`, `Evidence Log`. Use cell formulas where possible, not pasted answers. Annotate sourced vs simulated assumptions and visible check cells.
- **Six-slide executive deck** per `deck-storyline.md`, plus a 60-second oral recommendation. One chart/table/exhibit per slide, all action titles and caveats matched to evidence.
- **One-page decision memo**: conclusion, why alternatives lose, upfront cash, steady-state upside and downside, biggest unknown, 90-day stop/scale.
- **Hypothesis register**: observation → plausible cause → disconfirming evidence → requested data → owner → deadline.
- **Risk sign-off**: quality/food safety, relationship churn, supplier switching and forecast timing.

**Self-check, not numeric answer sheet:** if subtotal contribution fails the historical line, the model is wrong; if a discount affects a cohort of existing units, discount the existing ones too; if two initiatives both “save” a pack that disappears, subtract the duplicate saving. Pass/fail numbers are only in the separate deterministic test script used by reviewers.

## Mini oral practice

Give your answer in 45 seconds: “I would conditionally approve / delay / reject __ because __. We expect __ steady-state, spend __ upfront, with major uncertainty __. Over the next 90 days __; if __ fails, stop.” Tell the executive what cannot be concluded from the available data.
