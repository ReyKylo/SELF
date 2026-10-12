# SELF Investment Intelligence — Phase 1.5 QA Handoff

**Date:** 2026-10-11 (Asia/Jakarta)
**Branch:** `feature/investment-intelligence-academy-v1`
**Pull request:** https://github.com/ReyKylo/SELF/pull/2
**Release decision:** Draft / not deployed / no production changes.

## Automated verification: PASS

- [Full SELF source/build and unit regression: 38136742961](https://github.com/ReyKylo/SELF/actions/runs/38136742961)
- [Final real Chromium QA: 38136743096](https://github.com/ReyKylo/SELF/actions/runs/38136743096)
- [36 full-page screenshots + machine-readable report](https://github.com/ReyKylo/SELF/actions/runs/38136743096/artifacts/11701835287) (GitHub artifact; seven-day retention at time of creation)

**31 real-browser check groups passed**, including:

- Original Academy lessons, quizzes, read-to-case flows and browser-local state retention.
- Shopify historical Research Notebook, user-created source notes, historical classifications and research exports.
- Financial Lab 12-month model, downside/upside scenarios, snapshots, sensitivity, CSV and Markdown export.
- Source-linked six-section Investment Memo, 2010 data reconciliation flags, deterministic completeness review, printable HTML and Markdown export, storyboard.
- Phase 1.5 **IC Defense** question navigation, sourced original answer and counterargument, draft persistence and exported defense notes.
- Phase 1.5 **Deck Studio** memo-to-slides import, editable title/body/metric, source link, 16:9 rendered preview, palette switch, layout switch, slide add/delete, local reload persistence and JSON source export.
- **Actual downloaded PowerPoint** validated on the CI runner by Python `zipfile` and `xml.etree.ElementTree`: valid ZIP, well-formed XML package parts, six generated slide XMLs, proper presentation relations, and native PowerPoint text containers containing edited text. No screenshot/image-only substitution.
- No horizontal overflow at 390px mobile, 768px tablet, 1280px laptop and 1440px desktop for the tested routes; existing SELF sections and nav still present.
- Learning data write-denied case displays a warning rather than claiming persistence.

The additional deterministic Node test covers the six IC challenges, pre-cutoff source guard, deck reorder/add/delete, palettes, native ZIP serialization, correct editable slide component files and download names.

## QA findings addressed

1. The historical evidence eligibility function returned a source URL string. It now returns a strict Boolean and no longer relies on truthiness.
2. Browser test needed to explicitly select the edited seed slide after creating/deleting a temporary slide; the application's intended selection model correctly pointed to a different active slide, so the assertion was updated.
3. Existing V1–V1.4 isolated smoke harnesses load the Phase 1.5 module before rendering the expanded Academy/Portfolio navigation.
4. CI file filters now include Phase 1.5 source/CSS/unit tests.

## Material limitations and outstanding review

- The downloaded PowerPoint has **editable vector text and shapes**, but automated ZIP/XML validity does **not** prove optimal text fitting or pixel fidelity inside Microsoft PowerPoint, Keynote or LibreOffice. Manual interoperability and slide clipping review have not been recorded.
- Theme and slide layouts are structured controls, not an unrestricted Figma/Canva-style freeform object editor. Metrics are editable text, not formula-linked finance charts.
- IC Defense questions and checklist are deterministic. No live AI IC member; “prepared” does not mean a correct investment decision or a verified financial model.
- The Bessemer original Shopify memo is an as-of-October-2010 case source; future outcome knowledge must not be used as 2010 historical evidence. Model forecasts are independently authored and hypothetical.
- No source-by-source external auditor verified user-authored evidence. Discrepancies (pre-money $20m vs $25m and published MRR growth figures) are flagged, not definitively resolved.
- Browser data persists in `self.investment.icdeck.v15`, separately from earlier local learning keys. No cloud synchronization, Supabase migration, cross-device backup, or encryption audit.
- **No reference-grounded Design Council final visual audit.** The original videos and four still images were not reviewed against these 36 actual browser screenshots by an independent QA council.
- Not publicly deployed; not merged; no Cloudflare access/security origin review or real iOS Safari/iPad test.

## Follow-up release gate

1. Manually inspect the exported PPTX in Microsoft PowerPoint and visually compare slide text wrapping/spacing against the in-app previews.
2. Run full independent visual-reference council review on captured screenshots, avoiding generic checklist sign-off.
3. Decide safe per-user cloud drafts and secure backup/migration.
4. Deploy to a private preview only after access control review and user approval.

**Outcome:** Phase 1.5 functional implementation and automated browser + PPTX package checks: PASS. Production release / visual approval: NOT COMPLETE.
