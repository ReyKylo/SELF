# ArusOps — VC underwriting flagship (SIMULATED)

**SIMULATED CASE — educational only.** ArusOps, its founders, 2025–26 customers, market sizing, competitor archetypes, bookings and term sheet do not describe a real company or recommendation. Benchmark investor memos are historically real and independently linked, never the source of this fictional dataset. All dollar amounts USD nominal.

**Role:** investment analyst for an early-stage B2B software fund. **Evidence freeze:** 30 September 2026. **Ask:** investment committee on 22 October 2026 must decide **INVEST / PASS / REQUEST FURTHER DILIGENCE** on a proposed US$6m Series A at US$24m pre-money. The fund could lead US$4m. Term sheet remains unsigned, round expected 31 October; survival is not guaranteed.

**The trap:** US$0.30m September MRR implies US$3.54m annualized live ARR and +US$47.5k monthly net-new MRR. However, NRR of prior-month accounts is below 100%, SMB month-6 cohorts lose about one-third of logos, and cash falls to US$981k while trailing-three-month burn climbs to US$358k/month. The deck also mixes contracted-but-not-live US$1.2m ARR with real installed ARR. Decide whether sales momentum can overcome churn before the next financing round.

## Read in this order

1. `case-brief.md` — business, mandate, due diligence, simulated founder claims and market assumptions.
2. `exhibits/` — original machine-readable case data: six independently useful schedules (cohorts; recurring ARR; acquisition; liquidity; cap table; market substitutes).
3. `tutor-guide.md` — analogy → exact finance term → formula → worked examples → transfer drills.
4. `learner-tasks.md` — worksheet build requests; no completed answer.
5. `assessment.md` — **blind**, no solved outputs; assess after learning without opening `tests/cases/vc/`.
6. `memo-spec.md` — 2-page IC memo, partner challenge and review rubric.
7. `source-ledger.md` — original memo links and which facts/claims are original versus simulated.

## Conventions and accounting hygiene

- Month 0 is **calendar acquisition month**; age 6 means six month-ends after acquisition. `ageN` cells outside available history are **blank**, never zero and never 100% retention.
- Cohort `age0_mrr` is active recurring subscription revenue; later values include lost customers and usage expansion. One-time setup fees, sales bookings and unpaid contractual backlog are excluded from live MRR/ARR.
- SaaS gross margins of SMB 78% and MID 74% are **assumed recurring accrual margins**, whereas `cash-runway.csv` shows **cash payments**, which must not be treated as accrual cost of revenue. All S&M allocations are fully-loaded and exclude the separate non-sales payroll line to avoid double count.
- Runway uses ending unrestricted cash divided by a stated **net cash burn** assumption; the shortcut is not a full forecast. No debt, taxes, asset sales, credit lines or round proceeds are included in historical cash.
- `exhibits/financing.json` separates pre-money option-pool top-up, new Series A shares, hypothetical Series B and extra future options. No implied protection from future rounds. Exit values are hypothetical **equity values** net of assumed zero exit debt; returns exclude fees, carry, follow-ons and distributions.
- The blind answer key lives **only under `tests/cases/vc/`**, outside browser-served `content/`. Do **not** publish tests into client static bundles or expose to the assessment UI. The Integrator must implement server-side scoring or restricted review. A private GitHub repository alone is not access control for browser users.

## Validation

`node tests/cases/vc/check-case.cjs` from SELF repository root. This reads fixtures, verifies cohort/ARR/gross retention, CAC payback, cash runway and full financing roll-forwards, and includes mutation guards. Numerical correctness ≠ evidence quality or endorsement. Instructor solutions are withheld during the blind test; a human must separately review the thesis and owner economics.

**Status:** worker-built educational case, pending independent Integrator QA, UI integration, rights/access review and actual blind-assessment delivery. **Not recruiter certified.**