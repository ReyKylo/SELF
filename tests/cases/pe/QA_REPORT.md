# Worker A / PE — Phase 2 QA evidence and integration request

**As of:** 2026-10-22 · **Branch:** `feat/self-career-case-pe-20261022` · **Base main commit:** `0a9ba528ac362775335b9c65427a8500af700ac2` · **Track:** PE only · **Status:** case content ready for Integrator review; **not portfolio-certified, not in Career UI, not merged, not deployed**.

## What was actually checked

1. Loaded actual committed historical / aging / term / forecast / covenant / exit-matrix CSVs through GitHub, then executed the **exact committed** `tests/cases/pe/check-case.cjs` program in a JS in-memory fixture harness, with file reads redirected to those fetched contents. Result: **PASS, 738 assertions**, including deliberately corrupted AR balance and altered model MOIC, both correctly rejected. This is **not the same as executing Node CLI in a checked-out repository**; Integrator must also run the command below in Node before merge.
2. The checker reconciles the three years of income, operating cash, PP&E, debt, ending cash and balance sheet; AR/inventory aging totals; EV-to-equity and funded cash floor; base/downside annual tax, CFADS, term/revolver/cash waterfall; fixed debt caps; year-end debt service covenants; dated rescue-equity IRR; nine entry/exit sensitivities; and 20% IRR price boundary.
3. **Six exhibit Git blob SHA-1 identifiers** stored in `manifest.json` were independently matched to fresh GitHub blob SHAs on the worker branch (**6/6 match**). The Node checker also verifies these SHA-1 object hashes at runtime.
4. Manually reviewed **three teaching lessons** for analogy → immediately named professional term → precise formula → worked example → independent try → check → spaced recall. Separate blind **Sagara** assessment includes no solution key and is not tested against a published hidden answer.
5. Checked only assigned `content/career-cases/pe/**` and `tests/cases/pe/**` scope via main...branch diff. No shared app, Supabase, deployment, other-track or CI files changed.

## Reproducible instruction for Integrator

From repository root:

```bash
node tests/cases/pe/check-case.cjs
```

**Expected from original inputs** (all financial figures simulated, IDR bn):
- At EV 273, seller consideration **206.54**, uses/sources **291.54**, usable target cash **1.54**, sponsor equity **160**; postclose minimum cash **12**.
- 2025 EBITDA **39**, CFO **−9.50**, operating NWC **110**; FY2030 base EBITDA **69.599671**, term debt **50.755250**, cash **30.207589**.
- FY2030 base 7× exit sponsor proceeds **466.650035**, equity IRR **23.8723%**; FY2026 DSCR **1.023384×** (base contractual minimum 1.00×).
- DOWNSIDE 2027 revolver fully drawn **25** with additional sponsor cash rescue; total FY2026–30 rescue **12.178757**; 7× hypothetical exit proceeds **223.272596**; sponsor cashflow-timed IRR **5.5654%**, despite **DSCR breaches**. Rescue does not cure default automatically.
- Mechanical max seller EV for **20% IRR**: 7× exit **300.536183**, 6× exit **272.565636**, assuming fixed debt, fee and cash floor. These are **return-hurdle ceilings**, not credit-approved values.
- One AR corruption and one sensitivity MOIC corruption cause checker failures, as required.

## Phase 1 quality gate disposition

| Gate | Status | Evidence / gap |
|---|---|---|
| G1 content / provenance | **PASS for simulated training fixture** | Financial equations, classifications and 6 original exhibits |
| G2 teaching | **Self-reviewed; pending independent pedagogy review** | Three complete short lessons + new practice questions |
| G3 source / copyright | **PASS for linked method references; case is explicitly invented** | Source ledger S1–S4 and A1–A4; no external source claimed to validate Aruna |
| G4 numerical | **PASS in in-memory execution; native Node run pending** | 738 assertions incl mutation tests, Git blob SHAs match |
| G5 blind assessment | **Prompt exists; grading & manual defense NOT yet conducted** | Distinct simulated Sagara case, no sealed solution shipped |
| G6 recruiter artifact | **Example IC memo only; reviewer/learner portfolio NOT verified** | No actual submitted spreadsheet or human assessment |
| G7 production | **NOT TESTED / NOT AUTHORIZED** | Integration and authenticated production checks reserved for Integrator |

## Critical unresolved risks, not reasons to silently fail open

- **Credit document authenticity:** new term 130, revolver 25 and all covenants are simulated. No debt facility, borrower collateral base or lender waiver is actually contracted. A 2026 downside DSCR failure means the proposed case debt stack is **not financeable without change or waiver**.
- **Underlying earnings quality:** no actual audited financials, customer collections, impairment provision, tax structuring or seasonality. The company and its aging are fake by design.
- **Operational limitations:** simplified cash taxes, no leases/PIK, debt fees capitalization, purchase accounting, distributions, covenant quarterly timing, working capital seasonality or revolver borrowing-base restrictions.
- **Process limitation:** no actual learner XLSX file was opened/validated, no source-rights legal opinion, no human PE expert approval, no real recruiter work-sample check. QA counts are deterministic input fixture checks, not learning outcomes.

## Needs Integrator D (shared scope not touched)

1. Execute Node checker against checked-out PR head; inspect paths and source labels, challenge financing logic, and manually review two-page example memo.
2. After all specialist PRs are independently reviewed and **merged sequentially**, register the accepted PE manifest into the shared Career Prep schema in a **separate** Integrator PR; do not display assessment solutions client-side.
3. If a grader/download/upload workflow is eventually built, validate actual learner workbooks cell-by-cell and user isolation separately; do not advertise it from this content PR.
4. Verify live authenticated UX, downloads and deployed version only after an explicitly authorized integration/release.

**No Supabase writes, migrations, deployments, main branch changes, or merge performed by Worker A.**
