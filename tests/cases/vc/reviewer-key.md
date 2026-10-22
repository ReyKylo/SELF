# RESTRICTED — VC reviewer key / instructor only

**DO NOT SHIP TO BROWSER OR assessment UI.** This file is in `tests/cases/vc/` intentionally; it is NOT secret from GitHub repo collaborators and requires access control during production integration. All ArusOps figures SIMULATED. The sealed assessment under `content/` contains zero answer-key values.

## Reconciliation anchors

- September 2026 live: 864 active logos; MRR **US$295,170**, ARR **US$3,542,040**. September fresh logos SMB 142 / MID 23, new-logo MRR **US$50,860**; Sept net-new MRR **US$47,497**. Prior-base September MRR **US$247,673**, gross-retained MRR **US$236,191**, prior-base ending MRR **US$244,310**; gross losses/contractions US$11,482 and expansion US$8,119. **GRR 95.36% / NRR 98.64%** (monthly starting base), not contaminated by new customers. Booked-not-live ARR US$1,200,000 and September nonrecurring fees US$7,400 are NOT live ARR.
- Oct-2025 SMB age 6: 23/35 logos = **65.71%**; 4,447/6,300? **Always recalc exact cohort MRR from CSV rather than relying on a handwritten number**; target 70.59% revenue NRR if starting MRR US$6,300 (as generated); Oct MID age6 logo 3/3 = 100%; NRR roughly 137.88%. These are age-six **cumulative** rates, not monthly NRR. The assessor must use age6 only through March-2026 cohorts. 
- September SMB CAC 106,000/142 = **US$746.48**, monthly initial GP = 180×78% = **US$140.40**, payback **5.32 months**. September MID CAC 154,000/23 = **US$6,695.65**, monthly GP = 1,100×74% = **US$814**, payback **8.23 months**.
- September cash **US$981,000**; Jul/Aug/Sep net burns US$333k/355k/386k; trailing three-month avg US$358k ⇒ **2.74 months**. Forward US$420k burn implies **2.34 months**. No signed Series A proceeds in the cash file.
- Market assumptions: 100k×6k=US$600m TAM, 22k×6k=US$132m SAM, 3k×6k=US$18m five-year initial SOM. US$35m future ARR requires a market definition/geo/ARPA change.
- Ownership: pre 12m FD; pre-money new option shares **1,292,307.6923**, new total pre FD 13,292,307.6923; closing share price US$1.8055556; post FD **16,615,384.6154**. Close founders approx **50.56%**, seed approx **14.44%**, pool **15%**, lead **13.3333%**, other Series A **6.6667%**. Post hypothetical Series B 25% new-money ownership, additional post-B options 5% of final FD, and lead **9.5%** (no pro-rata).
- Five-year exit (equity, no modeled debt): US$20m distress yields senior B US$15m then Series A fund gets (4/6)×US$5m = **US$3.333m**, or **0.8333x**; US$75m ⇒ US$7.125m / US$4m = **1.78125x**; US$300m ⇒ US$28.5m = **7.125x**; US$800m ⇒ US$76m = **19x**. IRR must equal each MOIC^(1/5)−1. US$300m exit is **4.29x** modeled US$70m ARR (hypothetical, not market multiple comp).
- Exit equity value needed for 5x lead under conversion at 9.5% = **US$210.526m**, with no fees/carry/pro-rata. This threshold is *not* proof exit probability is adequate.

## Decision and analytical judgment

There is **no unique recommendation**. A defensible baseline is **REQUEST FURTHER DILIGENCE** (time-bound retention customer callbacks, independent receipts/books, 90-day cash/closing protection and verified pool/legal stack), not an automatic INVEST just because ARR grew. PASS can be justified if high churn is intrinsic to the product, the round cannot close pre-runway, and outcome-weighted return misses the fund's economics. INVEST requires hard evidence and a negotiated price/term; any recommended maximum valuation must clearly articulate the chosen return hurdle, scenario probabilities and exit distribution, not simply declare US$24m 'cheap'.

At US$300m exit, keeping Series A total raise US$6m and the same two subsequent dilution steps, purely mathematical ceiling for **5x under that specific exit** is approximately US$36.75m pre-money: at this ceiling 4/(pre+6)×0.75×0.95×300/4=5. This is *not* a diligence-adjusted fair value and ignores early failure probabilities.

## Reviewer-only fail triggers

New-logo MRR in NRR numerator; future cohorts filled with 0 instead of blank; CAC recovery on revenue instead of gross profit; counting US$1.2m backlog as live; runway using gross spend not net burn; founders assigned option pool top-up after investment rather than before; 13.333% assumed unchanged at exit; 1x liquidation preference interpreted as a cash coupon in a large exit; B senior priority omitted in distress; source claims silently transferred from BVP to ArusOps.

**Independence:** tests check arithmetic and schema, NOT data provenance, legal enforceability or a portfolio-ready spreadsheet. Separate human review required.

## Independent blind transfer key — restricted

Holdout isolated September paid live cohort MRR = May survivors 3,050+7,000, June 4,620+7,000, July 5,750+7,600, August 6,560+8,000, and September fresh 7,200+7,700 = **US$64,480**, ARR **US$773,760**. Live logos = 14+4+21+5+27+6+32+7+36+7 = **159**. Opening base from Aug = May 3,690+6,800; June 5,140+7,400; July 6,180+7,100; Aug 6,800+7,700 = **US$50,810**. Sept same-base ending = 64,480−14,900 = **US$49,580**; NRR = 49,580/50,810 = **97.58%**. Gross retained should weight Aug original-customer MRR by survivor-logo proportions; rederive, not the ending MRR numerator.

Cold SMB CAC=42,000/36=US$1,166.67, GP/month=200×75%=US$150, payback **7.78m**; MID CAC=32,000/7=US$4,571.43, GP/month=1100×72%=US$792, payback **5.77m**. Sept outflow=42+32+60+18+22=US$174k; net burn=174−38=US$136k; closing unrestricted cash=420−136=US$284k; at forward burn US$170k, runway **1.67 months**. Market inputs: TAM US$120m / SAM US$32m / SOM US$4m. Note year5 management US$20m ARR > SOM.

Proposed new A investment US$3m/US$15m post ⇒ all A collectively 20%, lead US$2m/US$15m ⇒ **13.3333%** after pre-money option top-up. Later US$5m/US$25m post ⇒ existing holders ×0.8; 4% post-money incremental option grant ⇒ fund stake 13.3333%×0.8×0.96=**10.24%**. Five-year US$110m converted lead proceeds US$11.264m / US$2m = **5.632x**. Distress US$6m: senior Series B gets US$5m; remaining US$1m to US$3m A preference, lead gets 2/3×1m = **US$0.6667m** / 2m = **0.3333x**. Recompute top-up share count from 9m existing FD and 1m unallocated at p=12%; do not infer it is zero.

Missing senior preference/legal documentation, actual retained accounts and short forward runway are defensible veto conditions.