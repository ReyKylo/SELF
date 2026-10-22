# SELF Career Prep Phase 5 — Production & UX Release Gate
**22 October 2026 · Review basis: main commit `dd48055ce6f4a1a1011589a06594b55424733962`.**

## Evidence categories (do not conflate)
| Category | Confirmed evidence | Status |
| --- | --- | --- |
| Source integration | Phase 5 content PR #28 and UI PR #29 merged into `main` | VERIFIED |
| CI build/regression | Post-merge SELF quality gate run 39772715260 passed; Phase 5 isolated Chromium and static checks passed on PR head | VERIFIED |
| Cloudflare actual deployment | Repo documents a Worker named `self` with `dist` static assets; no accessible Cloudflare deployment build ID/production domain in the repository | **NOT VERIFIED** |
| Full authenticated application | No owner-authenticated live browser session or screenshot checked | **NOT VERIFIED** |
| Two-account isolation | Not evaluated in production; Director Review uses in-memory local session only; no DB writes | **NOT VERIFIED** |
| Real-device visual QA | No real iPhone/Android screenshot or accessibility audit | **NOT VERIFIED** |

**Important:** a GitHub Actions success is NOT evidence that Cloudflare Workers Builds published it. Do not mark Phase 5 live until production assets and interactive login flow are checked at the correct verified origin.

## Verify deployed release (read-only)
1. Open Cloudflare **Workers & Pages → self → Deployments** on the authorized Cloudflare account. Record release date, deployment ID, outcome, and connected `ReyKylo/SELF` main commit SHA. Do not run a manual deploy just for inspection.
2. Identify the production URL **from the authenticated Worker dashboard**, not by guessing `.workers.dev` or domains. Check that both the existing SELF application and the new Career Prep are served on that exact origin.
3. From an unauthenticated browser, request `<verified-origin>/career-director-review.js` and `<verified-origin>/content/career-director-review/review-panels.json`. Each should return HTTP 200, correct MIME type, current code/data; challenge data must not contain a `trap` or private answer key. The module and panel JSON are intentionally public educational assets; the app's personalized records must remain private.
4. Verify that `<verified-origin>/content/career-cases/`, `<verified-origin>/tests/`, and `<verified-origin>/AGENTS.md` are **not directly downloadable files**. Because SPA fallback may return HTML for unknown routes, check response body/content type, not just HTTP status.
5. Log in with an approved SELF test user; navigate **Career → Career Prep → Director Review**. Verify all three scenarios load without console errors. Don't paste actual CVs, financial secrets, or credentials into the training answers.
6. Run a happy path in PE, VC, Consulting: lock initial decision, five gated defenses, new simulated information, red-team argument, final decision, download final dossier and inspect the file locally. Confirm it is always labeled **SIMULATED**, not certified or automatically graded.
7. Run a recovery path: download unfinished draft; use Previous from the new-information stage; verify the initial answer is still locked; cancel Reset (work remains); confirm Reset (work clears); confirm session clears on logout/account switch. Refresh warning is clear; no silent autosave implied.
8. On mobile narrow width (e.g., iPhone-class viewport), confirm no horizontal clipping, keyboard focus stays visible, minimum 44px touch target, readable labels, and loading/errors readable with screen reader. Test at 150% SELF text size.
9. Use a second approved test account for isolation. Avoid creating production test data unless separately authorized. It should not see the first user's Director Review in-memory responses or private records.
10. Capture evidence: Worker deployment ID, commit SHA, timestamp WIB, browser/device, console/network results, screenshots **without personal information**, any reproducible defects and remediation commits.

## User-experience contract, Phase 5
- Editing/free-text is **not** auto-graded. Review score requires model evidence and a qualified human reviewer.
- Local session only; users must be offered a clearly labeled **Download draft** before refresh/reset. A final dossier is different from an unfinished draft.
- A destructive Reset must ask for confirmation; a decline must leave answers unchanged.
- Changing case before locking the decision must not silently discard previously typed text.
- Completing five questions should not strand the learner: the user can revisit question 5 and return to the new-information stage without lost work.
- On step changes, keyboard/screen-reader focus moves to the challenge heading.
- No introduction of new Supabase tables, authentication changes, service-role secrets, tracking or background AI grading.

## Release decision
**CURRENT: MERGED CODE / QA PASSED / LIVE RELEASE NOT VERIFIED.**
Do not call this production complete until all read-only live checks above are evidenced. Cloudflare connection and known production origin are external dependencies and cannot be inferred from a private GitHub repository alone.

## How to file evidence
Add a future `docs/career-prep/PHASE5_PRODUCTION_VERIFICATION.md` only after real observations; record exact origin + verified build identifier but redact account IDs, credentials, private links and screenshots containing user data. Separately document whether Cloudflare automatically deployed the latest `main` commit.
