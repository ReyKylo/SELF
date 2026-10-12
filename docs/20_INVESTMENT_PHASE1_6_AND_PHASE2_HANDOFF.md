# SELF Investment Intelligence — Phase 1.6 Hardening & Phase 2 Academy

**Working branch:** `feature/investment-intelligence-academy-v1`  
**Draft PR:** https://github.com/ReyKylo/SELF/pull/2  
**Date:** October 11, 2026 (Asia/Jakarta)  
**State:** Functional source/Chromium verification passed. PR is **not merged**, SELF production **not deployed**.

## Phase 1.6 — Investment Vault & safety

The five existing Investment Intelligence drafts were browser-local. The new Vault adds a sixth document type (Phase 2 learning progress) and user-directed backup / restore without altering any old workspace storage.

### Local backup
- `tools/investment_vault_v16.js` exposes Investment Vault from the Academy.
- Export all six namespaced Investment keys as structured `SELF-Investment-Backup-v1` JSON. The export does NOT contain SELF Cloud sessions, tokens, API keys, browser cookies, original Career/Calendar records or files.
- Backup imports validate exact document keys, top-level JSON objects and per-document size before writing.
- Restore first downloads existing local drafts and requires a separate confirmation before applying imported drafts.
- Import attempts rollback on localStorage write failure. This is best-effort rollback; browser storage quota failures can also prevent rollback, hence external backup is mandatory.

### Per-user cloud backup
- Live, dedicated SELF Supabase project: `btiwxqjiptbwaunjibjh`. This is **not** Bintang Trader's Supabase.
- Migration committed: `supabase/migrations/20261011_self_investment_vault_v1.sql` and applied to SELF using the connected Supabase client.
- Created isolated `public.self_investment_documents` with 6 allowed document types, per-user RLS, 500 KB JSONB maximum payload per document, revision tracking and no anonymous table grants.
- Verified RLS active, `anon` privileges disabled for SELECT/INSERT/UPDATE, `authenticated` privileges present, and zero findings from Supabase security advisors.
- `tools/self_cloud_runtime.js` exposes a restricted authenticated bridge reusing existing SELF Cloud email sign-in / refreshed session. It never exposes service-role or database secrets in the browser.
- `tools/investment_vault_cloud_v16.js` performs manual upload, manual cloud JSON download and backup-before-restore. Automatic upload is intentionally OFF.
- Each update is conditional on the last observed remote revision; unknown/stale remote revisions are blocked rather than overwritten. JSONB comparison ignores key-order differences.
- Conflict handling is per-document, NOT globally transactional across six documents: if document four conflicts, earlier successful writes remain. The UI reports a partial upload. This is a release caveat.
- Cross-device restore and actual email-OTP authentication have not been tested with a live signed-in user; do not claim cloud sign-in/restore is production-validated.

### Privacy and operational boundaries
- localStorage content remains visible on shared browser profiles to other local users. Cloud RLS protects remote rows but does NOT isolate local browser storage per account.
- Cloudflare Access must gate the static production deployment if the user requires private site access. A Supabase email session alone protects cloud rows, not public viewing of the static HTML.
- No changes to old Career, Calendar, Notes, Whiteboard, Bintang Trader or existing SELF cloud tables.
- No public production merge/deploy without explicit release review.

## Phase 2 — Nine source-grounded VC lessons

Built in `tools/investment_curriculum_v2.js` with new editorial classroom presentation in `tools/investment_learning_v2.css`.

| Module | Key skill | Main reference |
|---|---|---|
| Think Like an Investor | Company quality vs investment quality | Bessemer original Shopify investment memo (2010) |
| Market Size Without Fantasy | Bottom-up TAM and assumptions | Bessemer — Market Opportunity |
| Revenue Growth vs Retention | MRR, logo growth, discrepancy, cohort retention | Bessemer — Customer Acquisition & Retention |
| Unit Economics | CAC, gross profit, simple vs churn-adjusted payback | Bessemer customer acquisition section |
| Moats and Falsification | Competition, defensibility, risks | Bessemer Product / Competition |
| Pre/Post Money | Pricing, ownership, dilution and valuation term discrepancies | Bessemer Opening / Deal |
| Valuation | Price vs value, comparables, model uncertainty | NYU Stern / Aswath Damodaran valuation class |
| Investment Memo | Original thesis, evidence and decision rules | Original Bessemer Shopify memo |
| Modern SAFE | 2013 instrument, 2018 post-money SAFE; law and cap table | Official Y Combinator SAFE documents |

Each module provides:
1. Original, concise Indonesian-first explanation written for beginners.
2. Specific external primary/professional source pointer and guided official video/resource link, without embedding copyrighted material or inventing video-seek timestamps.
3. Independent 3-choice reasoning exercise and deterministic explanation.
4. Teach-back reflection and optional promotion into the Shopify Research Notebook as separately labeled analyst-authored judgment.

The Foundation–Analyze–Deal–Apply–Modern sections can be navigated freely. Progress counts 4 learning activities per module, **not certified financial mastery**. No live AI mentor in Phase 2. The already implemented Financial Lab, Memo Workshop and Deck Studio provide integrated practice.

### Historical as-of rule
- Original Shopify memo dated **2010-10-12** is the primary case reference: https://www.bvp.com/memos/shopify
- YC Investor School (2018): https://www.ycombinator.com/blog/startup-investor-school-day-1-videos/
- Damodaran valuation course: https://pages.stern.nyu.edu/adamodar/New_Home_Page/equity.html
- YC SAFE: https://www.ycombinator.com/documents
- YC SAFE first introduced **late 2013**, post-money version **2018**. Modern SAFE or valuation-class-derived observations are classified **retrospective** and cannot support as-of-2010 investment evidence. This historical source cutoff is regression-tested.
- The memo's conflicting US$20M vs US$25M pre-money and MRR growth percentage mismatch remain unresolved and are flagged for diligence.

## Automated QA
- `python3 tools/build_cloudflare.py` validates existing SELF app and new Vault/Academy modules.
- `tools/qa_investment_vault_v16.cjs`: backup key allowlist, guarded restore, cloud comparison, optimistic version conflict with mocked per-user cloud API.
- `tools/qa_investment_curriculum_v2.cjs`: source validation for 9 lessons, correct/incorrect quiz feedback, reflection, Notebook promotion and SAFE hindsight isolation.
- `tools/qa_investment_browser_v1.cjs`: real Chromium workflows, Academy, Research, Model, Memo, IC, Deck, new VC curriculum and complete JSON backup download; desktop/laptop/tablet/mobile overflow and screenshot capture.
- Passing browser run for implementation SHA `1864f887`: https://github.com/ReyKylo/SELF/actions/runs/38138775993
- 42 screenshot and report artifact: https://github.com/ReyKylo/SELF/actions/runs/38138775993/artifacts/11702073336
- Browser reports **37 passing assertion groups**.
- Source/build verification: https://github.com/ReyKylo/SELF/actions/runs/38138776044

## Remaining release gates

1. Manual real account Supabase magic link, upload, conflict and cross-device restore; no such test can be completed using only an unauthenticated CI browser.
2. Review whether dedicated per-user drafts need encryption-at-rest above Supabase defaults or browser profile isolation.
3. Reference-Grounded Design Council video/still visual audit, including pixel-level review of generated screenshots. The original reference files were NOT inspected in this phase.
4. Private Cloudflare deployment protected by appropriate access control, exact redirect allowlist and manual browser-origin persistence verification.
5. Manual PowerPoint slide opening and clipping/cross-app compatibility checks.
6. More source-specific timestamped videos, deeper private VC fund modeling and feedback-based teaching as later expansion. Nine lessons are the **Phase 2 foundational release**, not an entire VC/PE/M&A professional certification program.

**Decision:** Build and tests complete for a gated feature-branch implementation. Production release remains blocked by the above manual security/design/runtime checks.
