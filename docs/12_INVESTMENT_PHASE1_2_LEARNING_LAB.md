# Investment Intelligence / Phase 1.2 — Learning Lab & Source-Aware Research Notebook

**Branch candidate:** `feature/investment-intelligence-academy-v1`
**Route:** `/#investment` → `Lesson 02` or `Research Notebook`
**Production state:** Not merged / not deployed by this change.

## Shipped

- **Lesson 02: Growth vs. Quality:** concise Indonesian primer, optional simpler explanation, official YC external video/transcript guide, a reasoning question with clear deterministic feedback, and a written teach-back reflection.
- **Parallel Research Notebook:** import source-grounded historical memo facts into separate personal research records; add custom claim/observation/interpretation/source/date/classification; remove items; choose one evidence item for a preliminary slide storyboard.
- **Evidence as-of and provenance:** original source URL, memo section, evidence date, and classification `historical`, `retrospective`, `assumption`, or `discrepancy`.
- **Important historical discrepancies:** memo's conflicting US$20m and US$25m pre-money references; memo reports MRR of US$164K → US$438K alongside +151% growth, while the displayed rounded values arithmetically imply approximately +167%. They **must not be silently reconciled**.
- **Case Pack export:** combined thesis, risk, learning reflection, evidence notes, slide claim, and investment implication to one Markdown file. No editable deck/PPTX claim.
- **Academy navigation and case integration:** Lesson 01 intact, Lesson 02 launchable from Home and nav, Notebook reachable from Home/Case/Portfolio.

## Professionally grounded references

1. **Primary historical memo:** [Bessemer Venture Partners — Shopify](https://www.bvp.com/memos/shopify), dated **2010-10-12**, authored by Alex Ferrara and Trevor Oelschig.
   - Opening: customer growth 5,500 → nearly 10,000, MRR US$164K → US$438K, memo-reported +81% customers / +151% MRR.
   - Customer Acquisition & Retention: reported CAC US$175–225, 7–9 months churn-adjusted payback, 75% cohort retention at month 3, 50–60% at month 12, stabilized monthly churn 3–5%.
   - Overview and Deal section: discrepant pre-money values US$20m versus US$25m.
   - **Historical-reasoning warning:** public memo page includes later retrospective comments interleaved with the original narrative; do not mistake retrospective commentary for 2010 knowledge.
2. **Official education source:** [Y Combinator — Startup Investor School Preview with Geoff Ralston](https://www.ycombinator.com/blog/startup-investor-school-preview-with-geoff-ralston), published **2018-02-07**. Official transcript references [00:34] for introduction and [01:51] for investment mistakes; these are transcript cues, *not guaranteed deep-linked video seek times*.
3. **Additional external video collection:** [Y Combinator — Startup Investor School Day 1 Videos](https://www.ycombinator.com/blog/startup-investor-school-day-1-videos/), published **2018-03-06**. These 2018 teaching resources are not historical-as-of evidence for the 2010 Shopify case.

## Teaching and evidence standards

- Learner starts with brief/simple explanation → official professional media → deterministic practice → explain back → independently interpret historical evidence.
- Video read/watched milestones depend on voluntary learner confirmation, not automatic tracking.
- Correct choice is a practice completion signal, not professional analysis mastery.
- Starter observations are **source-backed statements**, but a learner's added interpretation is not automatically verified.
- Custom observations must include a URL, dated source, and adequate text. HTTP/HTTPS only; entries should be manually reviewed for historical relevance.
- An entry dated after 2010-10-12 cannot be labeled as historical as-of evidence. Retrospective data cannot be used to save an as-of-2010 slide seed and is visibly flagged in preview.
- The slide storyboard requires a user-written claim, a selected saved evidence note, and an implication. It **does not** create an editable PPTX, or certify investment recommendation quality.

## Storage, backups, and privacy

- Existing V1 state remains in localStorage `self.investment.academy.v1`.
- Phase 1.2 notes use isolated localStorage key `self.investment.lab.v12`.
- New notebook notes are **NOT included** in SELF's legacy IndexedDB/Supabase sync or Workspace JSON backup. Export the Research Pack regularly.
- No database migration, auth change, public deployment, or sharing behavior was introduced.
- Do not merge until provenance of the Design Council's original reference assets has been checked, screenshots reviewed, and live-origin persistence audited.

## Reproduction

```sh
python3 tools/build_cloudflare.py
node tools/qa_investment_intelligence_v1.cjs
node tools/qa_investment_lab_v12.cjs
node tools/qa_investment_browser_v1.cjs  # requires Playwright/Chromium and built dist
```

See GitHub Actions workflow `Investment Intelligence — Browser QA` for screenshots and end-to-end results.

## Next phase — separate scope

- Source timestamp/video segment verification and lesson authoring pipeline from the original Phase 0 registry.
- Better feedback coaching (real AI tutor, safely sourced and permissioned), modeling exercises, and evidence review.
- Editable, exportable hybrid Deck Studio and investment committee defense.
