# SELF Investment Intelligence — Phase 1 Academy

**Status:** feature branch candidate, **not deployed to SELF production**. Builds through existing Cloudflare build pipeline.

## What was implemented

- New `#investment` route with a Learning-Centered Academy Home; entry points from Dashboard and More.
- Lesson 01, *How Investors Think*, uses Indonesian explanations with English finance vocabulary and five stages:
  1. Brief Shopify 2010 historical case in friendly language.
  2. Official Y Combinator Startup Investor School Day 1 video collection (external).
  3. Hypothetical customer-growth scenario, explicitly differentiated from historical evidence.
  4. Lightweight three-choice recall question with deterministic feedback (not an AI tutor).
  5. One original investment thesis and risk note.
- Active Case working draft for independent historical re-underwriting (not real deal participation).
- Portfolio Work-in-Progress, plus one-click Markdown research-draft download.
- Lesson progress counts explicit recorded milestones (a video is marked reviewed only when the learner manually says so).
- Fully isolated responsive, editorial learning visual system; existing routes and legacy storage unchanged.

## Readable, grounded sources

- **Bessemer Venture Partners**, Shopify historical Series A investment memo, dated October 12, 2010: https://www.bvp.com/memos/shopify
  - The source page includes later retrospective commentary. That commentary is NOT 2010 as-of evidence.
  - Reported historical values used in this introduction: nearly 10,000 customers, up from 5,500; MRR $438K, up from $164K; reported +81% customer growth and +151% MRR growth. Readers must refer to the full original memo for deal-price and capitalization nuances.
- **Y Combinator**, Startup Investor School Day 1 (published March 2018): https://www.ycombinator.com/blog/startup-investor-school-day-1-videos/
  - General startup investment teaching, not a Shopify deal video.
- Historical as-of date: October 12, 2010.

## Storage and data safety

- Learner flags and the case's current thesis/risk/evidence text are stored under browser `localStorage` key `self.investment.academy.v1`.
- **This storage is browser-local, not part of SELF's existing IndexedDB, Workspace backup, or Supabase sync.**
- Browser data can be erased when browsing data is cleared, in private browsing, or when origin changes. The user can download a Markdown research-draft backup on the Portfolio tab.
- No migrations. No existing data schema changes. No automatic cloud writes, no external provider API keys, and no privileged operations.
- Before deployment, review private access policies and test persistence on the actual target origin.

## What is NOT done

- No real AI Mentor or adaptive learning model; currently there are guided prompts and deterministic recall feedback.
- No automatic video completion tracking, video embed guarantee, or verified timestamped segments.
- No valuation workbook, investment memo generator, PPTX slide editor, IC defense, or graded analyst-mastery system yet.
- The Portfolio tab shows **Case Draft, NOT portfolio-ready**.
- This phase is not a claim of full Design Council reference-audit compliance; independent visual and interactive QA is still pending.
- Nothing automatically deployed or merged to production.

## Build and test

```sh
python3 tools/build_cloudflare.py
node tools/qa_investment_intelligence_v1.cjs
```

The build includes the isolated QA suite, syntax checks, existing workspace tests, and produces `dist/index.html`. Check the actual built site at `/#investment` or click **Investment Intelligence** from Dashboard / More.

### Browser acceptance checklist

- Desktop at 1440px, laptop at 1280px, tablet at 768px, mobile 390px: no overflow, readable typography, clickable controls.
- Navigate Academy → Lesson → Active Case → Portfolio → Academy.
- Mark Brief / Watch reviewed / Explore; submit wrong and correct recall answers; progress reflects exactly what was done.
- Adjust slider and see hypothetical projection change without modifying actual 2010 figures.
- Write thesis and risk, refresh on same origin, confirm browser-local drafts survive.
- Export research Markdown and inspect content.
- Test localStorage denied/quota exceeded; it must show warning, never claim data was saved.
- Check baseline Dashboard, Career, Calendar, Notes, Whiteboard, and More remain functional; check existing Supabase user data is untouched.
- Verify public access mode before deployment: hosting static assets does not enforce privacy.

## Next phase (not promised by this branch)

1. Learning content QA and five-layer lesson framework driven by source registry (not generic filler lessons).
2. Independent finance sandbox and data-backed evidence registry.
3. Source-aware memo drafts and model linkage with case revisions.
4. Guided + freeform slide storyboard / editable PPTX output, Design Council review, and IC simulation.
5. Migrate browser-local learning data to dedicated isolated user-scoped database only after explicit privacy/security review.
