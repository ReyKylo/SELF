# Guided masterclass | think like a consultant, not a framework collector
**Training material; read before your first guided drill, but do NOT consult it during the cold assessment.** No solutions for the six-slide independent assignment appear here.

## The method: first the analogy, then the real name

### 1 — Define the question (CO-01)
**Bayangin pemilik restoran bilang “jualan masih ramai, tapi saldo tinggal tipis.”** Sebelum menebak strategi, lu harus tanya saldo yang mana, dibanding kapan, dan uang yang tersedia berapa. **Yes, ini namanya Problem Definition / Decision Criterion.**

Exact professional term: **decision objective, baseline, constraint, time horizon, counterfactual**. The decision is not “increase growth”; it is “maximize defensible additional annualized case operating profit under IDR 1,800m upfront and seven execution slots, with verifiable 90-day quality and commercial gates.”

**Visual:**
```text
CEO question -> MEASURE: incremental case operating profit
             -> LIMIT: 1,800 IDR m upfront + 7 leadership slots
             -> HORIZON: 90-day evidence gates; 12-month run-rate
             -> MUST NOT: sacrifice quality or count same benefit twice
```
Guided example: “Sales are high” is a qualitative impression; “2025 case profit vs 2026 estimated run-rate profit” is a measurable comparison. **Try:** write a one-sentence mandate with the denominator, constraint and executive approver. **Decision impact:** a recommendation optimizing revenue alone can destroy contribution.

### 2 — Diagnose using an issue tree, not a memorized 3Cs (CO-02)
**Bayangin ember bocor: air lebih sedikit bisa karena keran melambat atau tiga lubang membesar.** **Yes, ini namanya Issue Tree**; branches should be **MECE-enough** (mutually exclusive, collectively exhaustive for the defined model), with **hypothesis-driven problem solving** to prioritize what to test.

```text
2025 -> 2026 estimated case operating profit
├─ Contribution by Core Retail, Core B2B, Premium Retail, Premium B2B
│  ├─ Volume: total pack count + product/channel mix
│  ├─ Realized price: discount and contracting
│  └─ Unit variable cost: material/yield/logistics/returns (causes UNPROVEN)
└─ Cash fixed operating costs
Next causal validation: supplier invoices, production batches, matched-store
service data, contract clauses, seasonality and cohort repeat purchases.
```
Not MECE: “sales, price, and volumes” as three equal top-level buckets (sales already contains price and volume). **Worked prompt:** ask whether Retail and Premium are separate leaves (they are not; they overlap). **Try:** explain why Core/Retail vs Core/B2B vs Premium/Retail vs Premium/B2B *are* non-overlapping transaction intersections. **Decision impact:** a clean tree prevents making one symptom into multiple “causes.”

### 3 — Unit economics and profit bridge (CO-04, CO-05)
**Toko jual 100 bungkus lebih banyak, tapi margin per bungkus tinggal setengah.** **Yes, ini namanya Contribution Margin, Price-Volume-Mix Analysis, dan Profit Bridge.**

- Exact terms: **realized average selling price (ASP)**, **unit variable cost**, **unit contribution margin**, **profit bridge**, **mix effect**, **driver attribution** versus **causal inference**.
- Formulas, units: `Revenue IDR m = volume_k_packs × ASP_k_IDR`; `Contribution IDR m = volume_k_packs × (ASP_k_IDR − VC_k_IDR)`; `Case operating profit = Σ contribution − cash fixed cost`.
- A **fully reconciled** profit bridge under one explicit order:
  `Quantity = Σ(q_2026−q_2025)×(p_2025−c_2025)`;
  `Price = Σq_2026×(p_2026−p_2025)`;
  `Unit-cost = −Σq_2026×(c_2026−c_2025)`;
  `Fixed = −(fixed_2026−fixed_2025)`;
  `2025 profit + all four effects = 2026 estimated profit`.
- For PVM, **total pack-count effect** = `(total q_new − total q_old) × (total old contribution / total old q)`; **mix** = total quantity effect − pack-count effect. This two-part split is relative to one chosen base-period weighted margin, not a universal unique causal truth.

**Worked numerical example — only Core Retail (do not extrapolate to company):**

```text
                 2025              2026 annualized run-rate
Volume           1,200k            1,300k packs
ASP              Rp24k             Rp23k / pack
Unit variable    Rp15k             Rp17k / pack
Contribution     1,200×9=10,800    1,300×6=7,800 (IDR m)

Contribution walk:
old 10,800
  + (1,300−1,200)×(24−15)   =   +900   quantity
  + 1,300×(23−24)           = −1,300   realized price
  − 1,300×(17−15)           = −2,600   unit variable cost
  = new 7,800 (IDR m)
```

This proves an **arithmetic allocation**, not that the supplier caused inflation or that discounts caused order growth. Correlation is not causation. **Try independently:** build the *other three* intersections and the full-company bridge in a blank model before opening any QA script. **Decision impact:** allocate diligence to largest economically material drivers, while investigating *why* they moved.

### 4 — Bottom-up market sizing (CO-03)
**Buka 100 alamat toko di peta belum berarti 100 toko bakal beli.** **Yes, ini namanya Market Sizing / Serviceable Obtainable Market (SOM) Funnel.**

`Reachable annual packs = targeted accounts × cold-chain serviceable share × category-qualified share × contractable share × annual packs per converted account.`

```text
Total accounts
  -> physically reachable
      -> fit the offer
          -> contractable
              -> annual expected packs
                  -> MIN(with incremental capacity)
```
The exhibit assumptions are invented and multiplication can yield **expected fractional accounts**, so round in a disclosed manner if reporting whole contracts. **Worked illustration unrelated to SajiRasa:** 200 accounts × 50% serviced × 20% qualified × 25% contracted × 10k packs = 50k annual packs. **Try:** use E05, express share of its addressable funnel implied by B's incremental premium volume, and explain why this is **not a demand forecast**. **Decision impact:** avoid using theoretical market scale to “prove” promotion ROI.

### 5 — Incremental economics and explicit overlap (CO-06, CO-07)
**Kalau buka jalur baru, hitung tambahan omzet saja bisa menipu karena promo dan order lama yang pindah ikut berubah.** **Yes, ini namanya Incremental Contribution / Cannibalization / Interaction Effect.**

For each initiative: **base incremental revenue − true incremental variable costs + removed costs − recurring execution costs**. Initial cash = capex + one-time spend. Separate `steady-state annual benefit`, `first-full-year accounting impact net one-off` and `simple cash payback`. This is neither IRR nor NPV.

```text
A: Core packs (existing) × eligible share × saving/pack − recurring QA
B: New Premium contribution − displaced Core contribution
   − discount × ALL affected post-launch Premium Retail packs
   − recurring activation
C: Price uplift × surviving Core B2B packs − contribution of exited
   Core B2B packs + removed route overhead − recurring support
PAIR A+C: A + C − A savings on C's exited Core B2B packs
PAIR A+B: A + B − A savings on B's displaced Core Retail packs
PAIR B+C: no overlap specified; do not invent or hide one.
```
**Mini numerical illustration outside the case:** saving Rp2k on 40k eligible packs produces Rp80m; if another initiative removes 10k of those same packs, combined saving is only Rp60m. **Try:** derive all three standalone run-rates, all three pair interaction adjustments, simple payback and year-one expense treatment from E04. **Decision impact:** adding standalone business cases without interaction can overstate benefit.

### 6 — Constraint-aware decision and downside (CO-08, CO-11)
**Strategi yang return-nya paling besar di kertas belum tentu bisa dieksekusi.** **Yes, ini namanya Constrained Portfolio Optimization and Scenario / Sensitivity Analysis.**

Feasible if `Σ upfront cash ≤ 1,800` AND `Σ leadership slots ≤ 7`. State any relationship between affected volume and variable costs explicitly. No probability of downside is supplied; do **not** compute expected value as if probabilities were measured. Distinguish **base** from **downside**, and separate model sensitivity from a tested contract.

**Worked illustration unrelated to SajiRasa:** project X profit +200 / cash 300 / 5 slots; Y profit +170 / cash 100 / 3 slots; capacity 7 => X+Y is infeasible despite attractive paper sum. **Try:** calculate A+C with E06 downside; recommend an evidence-gated allocation rather than irreversible rollout on day 1. **Decision impact:** CEO approves milestones and stop triggers, not just spreadsheet upside.

### 7 — Executive storyline, action titles, and decision gates (CO-09/10/12)
**Judul 'Analisis Biaya' bikin CEO bertanya: jadi harus ngapain?** **Yes, ini namanya Answer-First Executive Storyline / Action Title**, often communicated as **pyramid-principle-style** argument with supporting evidence.

```text
DECISION ASK (slide 1)
    ├─ Situation and quantified problem (slide 2)
    ├─ Observed drivers vs hypotheses (slide 3)
    ├─ Alternatives, benefits, interactions, limits (slide 4)
    ├─ 90-day test plan, PIC, leading indicators (slide 5)
    └─ Downside, tradeoffs, approval / kill gates (slide 6)
```
A credible action title is a testable conclusion, e.g. **“Cost per Core pack merits first diligence because it materially drives the profit bridge”**—use only if your actual model shows it. Avoid “Market Analysis,” “Our Solution,” generic icons, or unsupported percentages. Each slide needs **a numerical exhibit**, source/assumption footnote and one executive implication.

**Try:** explain one slide in 30 seconds with conclusion → evidence → caveat → requested next action. **Decision impact:** the CEO can decide within minutes without mistaking a plan for proven results.

## 90-day operational test design (fictional proposal; thresholds are design judgments, not published norms)

| Days | Owner | Experiment / output | Leading KPI | Proposed decision gate |
|---|---|---|---|---|
| 0–15 | CFO + RevOps | Reconcile purchase invoices, COGS by pack, discounts, on-time/return denominator, SKU/channel revenues | Base-to-ledger reconciliation error | **Stop** if baseline cannot be reconciled before full commitment |
| 16–45 | COO + Quality Head | A limited supplier pilot on traceable Core lots; dual-source QA | Realized saved cost per eligible pack; defect rate vs matched controls; OTIF | **Proceed** only if observed saving ≥Rp1.1k/eligible pack and returns worsen ≤0.5pp versus control |
| 16–45 | Sales Director | C pilot with 10 preselected B2B accounts, matched controls, contract notice and route cost proof | Net price realization; lost packs vs proposal; contract attrition | **Proceed** only if uplift ≥Rp1.5k/surviving pack and observed exited-volume projection ≤150k/year |
| 46–70 | CFO + PMO | Recalculate A+C exposure including C's churn in A eligible volume; stress working capital and spend commitments | Verified avoided route overhead; incremental profit forecast; committed cash | **Pause** if pilot coverage does not represent exposed volume or route savings cannot be demonstrated |
| 71–90 | CEO + Finance Committee | Approve / phase / reject scale based on pilot evidence; publish risk register | Reforecast with downside; service-level/quality safeguards; pilot exit | **Scale** only if cash ≤1,800, slots ≤7, downside annual recurring uplift remains positive and QA gates passed |

Management-specified thresholds are assumptions for training; candidates may propose stricter alternatives if justified. There is **no automatic promise** that a 90-day pilot achieves the full-year gains.

## Recall after 24–48 hours

Close this guide and, from memory: write one correct profit bridge; identify one double-counting interaction; derive an independent payback; explain a causal-identification weakness; deliver a 40-second CEO answer. Score by reconstructing the calculations and reasoning, not by memorizing slide decoration.
