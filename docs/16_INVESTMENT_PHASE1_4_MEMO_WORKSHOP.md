# SELF Investment Intelligence / Phase 1.4 — Investment Memo Workshop

**Branch:** `feature/investment-intelligence-academy-v1`
**PR:** https://github.com/ReyKylo/SELF/pull/2
**Route:** `/#investment` → Investment Memo
**Release:** Draft, no production deployment or merge.

## Purpose

Convert independent historical Shopify 2010 research and financial exercises into a *learner-authored* investment memo, complete with evidence attribution, source-aware quality checks and a seed for a later editable investment deck.

## Functional scope implemented

1. **Memo manuscript:** six editable sections—Executive Recommendation, Business & Market, Traction & Unit Economics, Financial Scenario & Valuation, Risks & Counterarguments, and Decision/Conditions/Diligence.
2. **Recommendation & pricing:** invest (conditional) / pass / more diligence, with free-text terms, unknowns and price sensitivities.
3. **Evidence per section:** attach and detach notes from Phase 1.2 Research Notebook. Notes carry titles, dated source links and labels (`historical`, `assumption`, `discrepancy`, `retrospective`). Historical-as-of misuse is flagged; an unverified note is not silently certified.
4. **Frozen model context:** if Phase 1.3 Financial Lab has a saved snapshot, show the scenario, timestamp, projected MRR and ARR run-rate. Warn when base inputs have changed since that snapshot. Show a missing-data state when no snapshot exists.
5. **Deterministic review:** independently checks each section for an adequate *minimum draft length*, attached evidence and source provenance. Flags missing historical reconciliation disclosures and model snapshot. It **does not grade model quality, factual truth or investment judgment**.
6. **Historical discrepancies:** requires the learner to acknowledge the original memo's conflicting pre-money references ($20M versus $25M), the displayed MRR arithmetic discrepancy ($164K→$438K vs memo +151% YoY) and the exclusion of retrospective data from the October 2010 investment decision.
7. **Deck storyboard:** four initial claim-driven slides derived from sections. The user can edit slide claims; the slide workbench is a guide, not a PPTX generator or final approved investment deck.
8. **Exports:** original source-linked memo as Markdown, a standalone *printable HTML* document, and storyboard as Markdown. The printable HTML can be printed to PDF by the user; the app itself does **not generate a downloadable PDF or editable PPTX**.
9. **Persistence:** dedicated namespaced localStorage key `self.investment.memo.v14`. This data is not part of SELF Supabase sync or old workspace backups. Data can be lost if browser storage is cleared or origin changes.

## Data lineage

- Source: original Bessemer Shopify memo dated 12 Oct 2010, https://www.bvp.com/memos/shopify .
- The model in Phase 1.3 uses approximate historical *starting* figures and hypothetical learner-assigned assumptions; there was no 2011 Shopify forecast in the memo.
- Any model snapshot displayed here remains an analyst scenario, not actual historical earnings, EBITDA, cash flow, or investment return.
- User-authored notes and recommendations are separate from Bessemer's actual decision.
- Future commentary and realized outcomes are *not* part of as-of 2010 diligence.

## Formula and source-review quality boundary

Review issues include:
- A section has under 35 words in its working draft.
- No evidence is attached, invalid source URL, or post-2010/retrospective note attached.
- Historical-terms or MRR figures have not been explicitly flagged for reconciliation.
- A financial snapshot is missing or stale, or an invest recommendation is missing price/term conditions.
- Analyst assumptions must be identified as assumptions, not reported historical facts.

**No review score means “golden ticket”.** When all deterministic checks clear, the UI says the draft passed *completeness* checks only, and still needs substantive investor/model/design review.

## Testing

- Build: `python3 tools/build_cloudflare.py`
- Unit: `node tools/qa_investment_memo_v14.cjs`
- Chromium E2E: `node tools/qa_investment_browser_v1.cjs` with `@playwright/test` and built `dist`
- CI: `.github/workflows/investment-browser-qa.yml`

Expected browser checks cover six-section navigation/edit, evidence selection, source warning and reconciliation, missing/updated model, printed memo exports, storyboard download, refresh persistence, laptop/tablet/mobile overflow and the legacy SELF route entry points.

## Not built in Phase 1.4

- Professional source fact-checking by a real analyst.
- Live LLM-powered Investment Committee reviewer or independent AI mentor.
- Formula-editable XLSX, live charts inside slides or PPTX editor.
- Supabase-backed cross-device encrypted synchronization.
- Public or private deployment of this draft PR.
- Reference-Grounded Design Council final audit against the original user-supplied videos and four still images (assets were not inspected as part of this phase).

**Next:** browser QA, visual audit, private release approval, then Phase 1.5 IC defense & editable deck mechanics.
