# Guided analyst lessons — ArusOps (all company numbers SIMULATED)

**Learning protocol:** do the guided example first; close this file; solve `assessment.md` blind using only `case-brief.md` and raw exhibits. In every chapter use: **INI APA? / INI KENAPA? / CARA ACHIEVE / ANALISIS PROFESIONAL**, then new practice, self-check logic, next-day recall. Published historical Bessemer examples live in `source-ledger.md`; their original deal figures never mix into ArusOps.

## 1. Live revenue ≠ signed bookings (VC-03)

**Analogi:** Restoran menerima 100 reservasi, tetapi yang benar-benar datang dan makan baru 70. Jangan bilang sudah melayani 100 orang. **Yes, ini namanya Live Monthly Recurring Revenue (MRR) versus Booked / Contracted ARR (CARR).**

**INI APA?** MRR ialah normalized recurring subscription revenue dari pelanggan **aktif dan live** di suatu akhir bulan. ARR run-rate = live MRR × 12; bukan recognized annual revenue. CARR memuat komitmen tertandatangani tetapi belum beroperasi; setup fees bukan recurring. **INI KENAPA?** Bookings bisa gagal go-live dan kas diterima lebih lambat.

**CARA ACHIEVE:** filter paid_live=true; sum subscription run rate for each account; exclude setup fees; inspect go-live dates and canceled contracts. **Worked, SIMULATED September:** live MRR US$295,170 ⇒ ARR US$3,542,040; booked-not-live US$1,200,000 means commercial pipeline view US$4,742,040, **not live ARR**.

**ANALISIS PROFESIONAL:** Cash receipts are not MRR; collection lags and annual prepayments are possible. **Practice:** If September setup US$7,400 also arrived as cash, what changes in live ARR? **Correctness check:** formula only includes recurring live subscription; setup cash changes none of its components. Tomorrow: define recognized revenue, bookings, CARR and ARR aloud without synonyms.

## 2. Cohort age, logo retention & churn (VC-04)

**Analogi:** Jangan membandingkan nilai ujian murid yang sudah belajar enam bulan dengan murid baru seminggu. **Yes, ini namanya Same-Age Cohort Retention Analysis.**

**INI APA?** Group customers by month of initial paid subscription. Age 0 = acquisition month; age 6 = six calendar months later. Logo retention age 6 = paid survivors age6 / logos acquired age0; churn to that age = 1 − retention. **INI KENAPA?** Recent cohorts have not experienced enough opportunity to churn.

**CARA ACHIEVE:** In `cohorts.csv`, pick **only nonblank age6**. For Oct-2025 SMB: 35 initial logos; 23 at age6 ⇒ 23/35 = **65.71%** and cumulative 34.29% lost. March-2026 age6 is observable at cutoff; April-2026 age6 is NOT, so blank not zero. **ANALISIS PROFESIONAL:** This is paid customer survival by cohort, not monthly churn hazard, customer satisfaction, nor predictive causal evidence. New logos can lift totals while older cohorts leak.

**Practice:** compute age6 retention for Nov-2025 MID, and explain why April-2026 cannot be included. **Correctness check:** denominator must be Nov MID age0, not entire current customer count; age6 exactly six month-ends later. Tomorrow: recreate oldest cohort's age6 retention without notes.

## 3. GRR vs NRR (VC-05)

**Analogi:** Punya 100 sewa kios; beberapa penyewa keluar, tapi yang bertahan menyewa ruangan lebih besar. Uang naik tidak otomatis berarti penyewanya semua betah. **Yes, ini namanya Gross Revenue Retention (GRR) dan Net Revenue Retention (NRR).**

**INI APA?** For the SAME starting customer base only, beginning MRR=B; **GRR = (B − churned MRR − contraction MRR)/B**; **NRR = (B − churned − contraction + expansion)/B**. New customer MRR is excluded from both. In this case `gross_retained` holds prior-month price on survivors, so expansion = prior-customer ending MRR minus gross retained. **INI KENAPA?** NRR can hide logo attrition through upselling higher-spending MID accounts.

**CARA ACHIEVE:** for each live cohort before Sept, divide retained age+1 logos by prior age logos; weight that ratio by prior MRR; sum to get gross retained; compare surviving customers' current MRR for NRR. **Worked September, SIMULATED:** beginning same-base MRR US$247,673, gross retained US$236,191, expanded ending same-base MRR US$244,310; GRR **95.36%**, NRR **98.64%** (percentages rounded to two decimals); new-logo MRR US$50,860. Total September MRR is 244,310 + 50,860 = **295,170**. **ANALISIS PROFESIONAL:** This gross retained approximation assumes same segment price for each survivor; missing customer-level contracts prevents accurate price/mix decomposition. A month NRR below 100% does not itself establish lifetime cohort-level NRR.

**Practice:** use Aug prior-base and Sept surviving revenue to calculate Sept NRR without including Sept new-logo MRR. **Correctness check:** NRR can exceed GRR; GRR cannot exceed 100% under definition; calculate numerator from previous-month *existing* logos only. Tomorrow: describe why fast total ARR growth may coexist with shrinking NRR.

## 4. CAC, payback and margin (VC-06)

**Analogi:** Jual kopi dapat Rp50 ribu, tetapi biaya bahan, cup dan transaksi Rp20 ribu; modal iklan kembali dari sisa Rp30 ribu, bukan dari omzet Rp50 ribu. **Yes, ini namanya Gross-Profit-Adjusted CAC Payback.**

**INI APA?** CAC = fully loaded acquisition sales+marketing cost / *new paid customers* in same segment and period. Gross-profit payback months = CAC / (new MRR per customer × segment recurring gross margin). **INI KENAPA?** Subscription dollar does not all become contribution to acquiring-cost recovery.

**CARA ACHIEVE:** `acquisition.csv` Sept MID spend US$154k, 23 new MID, MID ARPA US$1,100, GM 74%. CAC=154,000/23 = **US$6,695.65**; gross-profit monthly/customer = 1,100×0.74=US$814; payback = **8.23 months**. SMB uses assumed 78% GM separately. **ANALISIS PROFESIONAL:** Monthly blended payback is NOT proven lifetime LTV/CAC; cohort churn, upsell, cost channel mix, non-sales implementation costs, lag between expenditure and converted contracts, and cash collection can radically alter economics. Use margin *as of acquisition*, not all current cohort upsells to overstate payback.

**Practice:** calculate Sept SMB CAC and GP payback; then stress GM to 65%. **Correctness check:** lower GM lengthens payback; if lower GM makes payback shorter, the denominator was inverted. Tomorrow: recalculate MID payback with different acquisition counts.

## 5. Burn and runway (VC-07)

**Analogi:** Dompet isinya US$981, tiap bulan rata-rata keluar bersih US$358; tanpa pemasukan/biaya berubah, dompet bertahan sekitar 2.7 bulan. **Yes, ini namanya Cash Runway using Net Burn Rate.**

**INI APA?** Net cash burn = cash operating outflows − customer cash receipts, in same month (no financing). Cash roll-forward = opening cash − net burn. Runway shortcut = unrestricted ending cash / recent average positive burn. **INI KENAPA?** A company can grow revenue and still run out of cash before its promised financing completes.

**CARA ACHIEVE:** compute July–Sept burns (333k,355k,386k): three-month avg US$358k; Sep cash US$981k ⇒ **2.74 months** at that pace. At **US$420k planned forward burn**, runway is **2.34 months**. **ANALISIS PROFESIONAL:** Neither estimate is a precise exhaustion date. Need contractual receipts, obligations, banking balances, covenants and closing risk; cash COGS is not accrual cost for calculating gross margin.

**Practice:** if one-month round delay burns US$420k, calculate remaining cash before financing proceeds. **Correctness check:** cash declines by cash burn, not by total expenses before customer receipts. Tomorrow: explain why EBITDA, revenue and net burn are different.

## 6. Pre/post-money, option pool, dilution (VC-08)

**Analogi:** Kue sebelum investor masuk bernilai US$24m; investor menambah US$6m sehingga nilai nominal sesudahnya US$30m. Kalau sebelum investor dapat potongan dibuatkan tambahan porsi untuk karyawan, porsi pendiri mengecil terlebih dahulu. **Yes, ini namanya Pre-Money/Post-Money Valuation, Fully Diluted Ownership and Pre-Money Option Pool Shuffle.**

**INI APA?** Post-money=pre-money+cash new money (assuming no round fees / secondary). New-round investors collectively own 6/30=**20%** immediately after close; lead owns 4/30=**13.3333%**, even with pre-money option pool top-up; existing holders share other 80%. Target post-closing unallocated options 15% forces a pre-money increase in option shares and lowers founders' post-close share. **INI KENAPA?** A valuation headline is not an investor's net return, and option-pool timing changes burden.

**CARA ACHIEVE:** Let old FD shares S=12m, existing options O=1.2m, r=new/pre=6/24, p=0.15. Solve `(O+x)/((S+x)*(1+r))=p` ⇒ x = (p*(1+r)*S−O)/(1−p*(1+r)) = **1,292,307.69** additional pre-money option shares. Price per share=24m/(12m+x); new investor shares=6m/price. Sum all buckets to 100%. Later hypothetical Series B 15m at 45m pre ⇒ 25% round ownership; subsequent 5% extra options dilute lead by additional 5%, taking 13.333% ×0.75×0.95 = **9.5%**.

**ANALISIS PROFESIONAL:** Does '15% pool' mean unallocated vs total granted? Is pre-money top-up legal? Preemptive rights exercised? We assume NO lead follow-on and no other convertible securities. **Practice:** calculate lead exit stake if it does not participate in B but there are no future option grants. **Correctness check:** 13.333%×0.75, NOT 13.333%−25 percentage points. Tomorrow: explain how lower pre-money price affects lead shares vs founders, holding new checks fixed.

## 7. Valuation ≠ investor return; preference waterfall (VC-09, VC-12)

**Analogi:** Rumah naik harganya empat kali, tapi lu cuma punya potongan kecil dan masih harus membayar kreditur dulu. Kenaikan harga rumah ≠ kelipatan keuntungan modal lu. **Yes, ini namanya Equity Proceeds, Multiple on Invested Capital (MOIC), IRR and Liquidation Preference Waterfall.**

**INI APA?** Straight conversion proceeds=exit equity value × fully diluted stake; MOIC=total fund proceeds/fund invested; five-year annualized IRR=MOIC^(1/5)−1, assuming a single initial outflow and one exit inflow. Preferred securities may instead elect a liquidation preference if economically superior; senior Series B takes 1x ahead of Series A in distress in **this simulated legal stack**. **INI KENAPA?** A 5x company exit valuation increase may not clear a 5x fund hurdle after dilution.

**CARA ACHIEVE:** US$300m hypothetical equity exit ×9.5%=**US$28.5m** proceeds; /US$4m=**7.125x gross MOIC**, five-year IRR approx **48.1%**. At US$20m distressed equity exit, **Series B first takes US$15m senior 1x**, leaves US$5m against Series A's US$6m pari passu preference; fund A gets 4/6×5m = **US$3.333m**, or **0.833x** (not US$20m×9.5%). **ANALISIS PROFESIONAL:** Future Series B is hypothetical; preference priority and option grants are legal assumptions. Pro-rata, new financing with pay-to-play, distributions and transaction expenses change outcomes. Exit EV vs equity value requires net debt bridge; assumed zero exit debt here.

**Practice:** compute fund proceeds/MOIC on US$75m and US$800m equity exits, then explain why the distress case uses preference instead of percentage × exit. **Correctness check:** compare converted proceeds to preference proceeds; never claim the same waterfall at all exit prices. Tomorrow: articulate the difference between a great product, rich valuation and a 5x investment.

## 8. Market logic, evidence discipline and skeptical underwriting (VC-01, VC-02, VC-10–12)

**Analogi:** Semua orang di kota bisa makan sate; bukan berarti warung lu akan punya semua orang itu sebagai pelanggan. **Yes, ini namanya TAM, SAM, SOM and Market Penetration Underwriting.**

**INI APA?** TAM = theoretical category addressable spending; SAM = presently served reachable customers×likely spend; SOM = realistically capturable share over a timeframe. **Worked, SIMULATED:** 100k×US$6k=US$600m TAM; 22k×US$6k=US$132m SAM; 3k×US$6k=US$18m five-year initial SOM. **INI KENAPA?** The US$35m 'low' ARR scenario exceeds initial SOM; needs a validated market expansion, not a prettier spreadsheet. **CARA ACHIEVE:** count buyers bottom-up, validate price willingness and source each assumption; enumerate alternatives and missing win/loss data.

**ANALISIS PROFESIONAL:** Founder-market fit is a hypothesis pending backgrounds and reference checks. Real Shopify/Toast/Twilio/PagerDuty memo claims are historical judgments with dates, not evidence that ArusOps has a moat. **Practice:** name three hard-to-fake signals you'd require before investing; set numeric yes/no gates with owners and dates. **Correctness check:** each proposed gate has a numerator, denominator, independent evidence source and a 'what would make us PASS?' result. Tomorrow: make a 60-second thesis with one supporting and one disconfirming metric.

**Historical memo transfer:** Shopify (2010) weighs organic adoption and SMB risk; Toast (2015) distinguishes booked/live ARR and accounting versus cash payback; Twilio (2009) proposes small financing before validating big prospective customers; PagerDuty (2014) explicitly considers land-and-expand, cost of acquisition and emerging competitors. THESE ARE THEIR MEMO-DATE OBSERVATIONS/OPINIONS, NOT ARUSOPS DATA, NOT hindsight-confirmed correctness.