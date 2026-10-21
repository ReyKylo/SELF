# Tutor guide — PE underwriting, PT Aruna Supply (SIMULATED)

**Coached training only.** Read `README.md` and exhibits first. Every concept follows: **analogy → professional English term → exact definition → exhibit → worked example → independent practice → feedback rule → spaced recall**. All monetary amounts Rp **miliar**. Do not open this worked guide during the blind addendum in `assessment.md`.

## Lesson 1 — Earnings are not cash (PE-01, PE-03, PE-05)

**Analogy.** Bayangin warung kirim Rp100 barang dan pelanggan bilang akan bayar nanti. Omzet dan keuntungan bisa tercatat sekarang, tapi duit di rekening belum bertambah.

**Yes, ini namanya *working-capital cash conversion*.** **EBITDA** = earnings before interest, taxes, depreciation and amortization, *bukan* operating cash flow. **Operating net working capital (NWC)** pada case ini = trade accounts receivable (AR) + inventory − accounts payable (AP). **Cash conversion cycle (CCC)** dalam hari = days sales outstanding (DSO) + days inventory outstanding (DIO) − days payable outstanding (DPO); pakai angka penutupan tahunan / FY revenue atau COGS untuk ukuran simplifikasi (bukan saldo rata-rata).

**Exact mechanics:** EBITDA = revenue − COGS − cash operating expense; net income = EBITDA − depreciation − interest − tax; CFO = net income + depreciation − change in operating NWC, assuming no other noncash/working-capital accounts. Cash after capital expenditure = CFO − capex. No EBITDA add-back is accepted without a support schedule.

**Exhibit 01, worked FY2025:**

```text
Revenue                            345.00
COGS                              (252.00)
Cash Opex                          (54.00)
                                   ------
EBITDA                              39.00   <- not cash
Depreciation                        (8.00)
Interest                            (6.00)
Cash tax                            (5.50)
Net income                          19.50
+ Depreciation                       8.00
- Increase in NWC                  (37.00)
                                   ------
Cash from operations                -9.50
- Capex                            (13.00)
Cash after capex                   -22.50
```

**Worked CCC:** 2025 DSO = 75/345×365 = **79.35 days**; DIO = 80/252×365 = **115.87**; DPO = 45/252×365 = **65.18**; CCC ≈ **130.04 days**. This is an end-balance proxy, not a rigorously averaged collection-cycle study. A company can be profitable but face a liquidity crunch.

**Try alone:** Calculate 2024 CFO directly from Exhibit 01 without reading its CFO cell. Compute NWC as a percentage of sales for 2023–25 and identify the two most useful invoice-level diligence requests.

**Check / feedback:** CFO must equal net income + D&A − ΔNWC; working-capital balances and annual units must reconcile. Avoid claiming aging *proves* bad debt. NWC % = NWC/revenue, not NWC/EBITDA.

**Spaced recall:** Tomorrow explain why EBITDA +39 coexists with CFO −9.50, without this sheet. Recompute CCC seven days later.

## Lesson 2 — Who actually writes the check? (PE-02, PE-04, PE-09)

**Analogy.** Lu beli rumah yang masih KPR. Harga propertinya beda dari uang tunai yang dibawa pemilik lama, dan biaya notaris bukan nilai rumah.

**Yes, ini namanya *Enterprise Value (EV) to Equity Value Bridge* dan *Sources & Uses of Funds*.** **EV** values the operating business; seller **equity value** adjusts EV for net debt (in this simplified case: EV − debt + cash). **Uses** enumerate all closing outflows; **Sources** enumerate actual financing and distributable cash. **Sponsor equity** is the balancing plug, never negative or assumed unlimited.

**Worked at ask 7×39 = 273:**

```text
USES                         SOURCES
Seller share consideration     206.54     New term loan        130.00
Repay seller debt               80.00     Target usable cash     1.54
Transaction fees                 5.00     Sponsor equity       160.00
TOTAL                         291.54     TOTAL                291.54
```

**Cash detail:** Seller share consideration = 273 − 80 + 13.54 = 206.54. Cash used = 13.54 − minimum operational cash 12 = 1.54. Sponsor equity = EV + fees + minimum cash − new term debt = **EV − 113**. Do **not** count the full seller cash 13.54 as both seller consideration and money freely available to fund the deal.

**Try alone:** At proposed EV 260, all other terms unchanged, compute total uses, sources, sponsor equity and entry EV/EBITDA. Then explain why sponsor equity changes but projected company operating cash generation does not.

**Check / feedback:** Sources must equal uses to within 0.01; retained cash exactly 12; old debt fully refinanced; no postclosing old debt on new borrower model; debt-to-EBITDA is not the same ratio as sponsor equity/EV.

**Spaced recall:** In 48 hours, rebuild EV→equity and funding without notes.

## Lesson 3 — Attractive MOIC can still default (PE-06, PE-07, PE-08, PE-10)

**Analogy.** Lu punya usaha yang laba total 5 tahun besar, tapi cicilan bulan pertama bisa menunggak. Untung di akhir tidak otomatis membayar tagihan hari ini.

**Yes, ini namanya *debt service coverage ratio (DSCR)*, *cash waterfall*, *liquidity stress test* dan *covenant headroom*.** Here **CFADS** (cash flow available for debt service) = EBITDA − simplified cash taxes − capex − ΔNWC; **DSCR** = CFADS ÷ (cash interest + scheduled mandatory term amortization). The contractual proxy in Exhibit 05 is explicitly *case-specific*, not a universal bank DSCR definition. **MOIC** = total sponsor proceeds ÷ total capital invested; annual **IRR** respects cash-flow timing (capital calls reduce IRR).

**Exact modeled payment waterfall, each year end:**

1. Compute cash tax = max(0,(EBITDA − depreciation − interest on **opening** debt and revolver)×22%). No loss carry-forwards are modeled.
2. Cash available = opening cash + CFADS − interest − mandatory principal (min(7, outstanding term)).
3. If below cash floor 12, **draw revolver up to 25 total outstanding**. Any remaining deficit is explicitly **sponsor rescue equity**, not a negative-cash footnote.
4. If above floor, repay existing revolver before anything else. Only then sweep **50% of remaining cash above 12** to term debt; the other 50% stays in cash.
5. End term = beginning term − mandatory − sweep; end revolver = opening + draw − repayment. **Net leverage** = (end term + end revolver − end cash)/EBITDA. Compare DSCR, leverage and minimum cash with each covenant year.
6. At exit: EV = EBITDA2030 × exit multiple; gross sponsor equity proceeds = EV − exit debt + exit cash; no exit fees or distributions in this simplified model. With additional rescue injections, solve IRR from *dated* sponsor cash flows rather than annualizing MOIC.

**Exhibit 04/05 worked FY2026 BASE:** Revenue 345×1.12 = **386.40**. EBITDA = 386.40×11.5% = **44.436**. NWC = 386.40×29.5% = **113.988**, ΔNWC = **3.988**. Interest = 130×11% = **14.30**. Tax = (44.436−9−14.30)×22% = **4.64992**. CFADS = 44.436−4.64992−14−3.988 = **21.79808**. Mandatory principal 7, excess cash before sweep **0.49808**, sweep 0.24904; end term debt **122.75096**, end cash **12.24904**. DSCR **1.023x**, only slightly above assumed **1.00x** FY2026 covenant; thin initial headroom is a decision risk.

**Try alone:** For 2027 BASE, calculate interest using *beginning* 2027 debt, not post-payment debt; use the revolver-first waterfall. Then under 2026 DOWNSIDE, quantify revolver draw and decide whether DSCR passes. Do not infer availability of any real borrowing base.

**Check / feedback:** Cash, debt and annual sponsor contribution must reconcile. Revolver ≤25, cash≥12 **only if emergency sponsor funding is explicitly shown**. If a lender would not waive a covenant, mark the proposed financing **not executable** even if end-of-period return looks attractive.

**Spaced recall:** Explain the difference between MOIC, IRR and DSCR unaided tomorrow and next week.

## Twelve-competency teaching/verification coverage

| Skill | Practiced on | Proof required / review |
|---|---|---|
| PE-01 | 3 historical statements | Balance sheet equation; EBITDA-to-CFO bridge |
| PE-02 | Seller EV-to-equity bridge | Closing seller consideration correct |
| PE-03 | EBITDA normalization | Explicitly reject unsupported nonrecurring add-back; document any proposed adjustments as unproven |
| PE-04 | Sources and uses | Zero funding imbalance |
| PE-05 | Base/downside driver model | NWC and capex link to cash |
| PE-06 | Term + revolver schedule | Opening/ending balances and interest tie |
| PE-07 | MOIC and dated IRR | Independent IRR check including rescue equity |
| PE-08 | 3×3 price/multiple and operating downside | Return compression quantified |
| PE-09 | Maximum bid | 20% hurdle at calculated boundary (conditional on case financing) |
| PE-10 | Yearly lender and cash tests | Identify covenant failure and equity rescue |
| PE-11 | Two-page IC memo | Recommendation, alternative, pricing and kill gates |
| PE-12 | Five-minute partner defense | Three material assumptions challenged with a revised model |

**Analogy limitation:** Rumah dan warung membantu intuisi, bukan akuntansi lengkap; model omits purchase-price accounting, transaction taxes, seasonal covenants, provisions and borrowing-base haircuts. Rujuk `source-ledger.md` untuk mana metodologi dari penerbit dan mana asumsi case.
