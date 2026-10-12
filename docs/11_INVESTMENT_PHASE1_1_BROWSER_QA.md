# SELF Investment Intelligence — Phase 1.1 Browser QA

**Date:** 2026-10-11 (Asia/Jakarta)
**Scope:** `feature/investment-intelligence-academy-v1`, Academy, Lesson 01, Active Case, Portfolio.
**Result:** **PASS** on real headless Chromium automated interactions and responsive overflow checks. **NOT YET** a Design Council visual-reference sign-off, accessibility certification, or production deployment.

## Reproducible evidence

- [Final passing Chromium workflow](https://github.com/ReyKylo/SELF/actions/runs/38131066807)
- [14 full-page screenshots and machine-readable test report](https://github.com/ReyKylo/SELF/actions/runs/38131066807/artifacts/11699230820) (GitHub Actions artifact; retained for 7 days)
- [Legacy source validation workflow](https://github.com/ReyKylo/SELF/actions/runs/38131066814)
- Browser QA source: `tools/qa_investment_browser_v1.cjs`
- Workflow source: `.github/workflows/investment-browser-qa.yml`

## Passed browser assertions

Chromium passed **16 assertion groups**, including:

1. Academy renders without horizontal overflow at desktop 1440px.
2. Real lesson progression through Brief, Watch, Explore, Recall, and Apply.
3. Hypothetical projection updates when slider values change.
4. Incorrect and correct reasoning feedback.
5. Quiz selection reachable and operable with a keyboard; explicit selected state.
6. Thesis draft can be saved and viewed from Active Case.
7. Browser reload preserves progress, thesis, and evidence via namespaced localStorage.
8. Portfolio Markdown export contains authored thesis and historical-as-of label.
9. Academy, Lesson, Case, Portfolio do not horizontally overflow at mobile width 390px.
10. Academy, Lesson, Case, Portfolio do not horizontally overflow at tablet width 768px.
11. Academy does not horizontally overflow at 1280px laptop width.
12. Dashboard/More entry points and route navigation remain accessible.
13. When namespaced localStorage writes are blocked, the UI shows a warning rather than claiming a save.
14. Browser execution had no uncaught page errors in these tested flows.

Automated source validation also passed on the final implementation.

## Bugs discovered and fixed in this phase

- Native radio selections did not remain checked in the assembled application when clicked in real Chromium. Converted quiz to stateful, focusable buttons with visible selection and `aria-pressed`, then tested click and keyboard activation.
- Lesson progress did not refresh immediately after saving a thesis. Saving now refreshes the view and milestone indicator.

## Screenshot set

The workflow captures these full-page images from a fresh browser context:

- Academy desktop (1440), brief lesson, growth simulation, active case, portfolio draft.
- Academy, lesson, case, portfolio at 390px mobile.
- Academy, lesson, case, portfolio at 768px tablet.
- Storage-denied warning behavior.

All screenshots are private GitHub Actions artifacts of the **test candidate**, not a live Cloudflare deployment.

## Boundaries — DO NOT claim

- No pixel-level Design Council audit against the original videos/four reference images has been completed.
- No manual review of the captured screenshot pixels by the Design Council has been recorded.
- No real-device Safari/iOS or Cloudflare deployment/browser-origin test.
- No audit of cross-device sync, localStorage durability across domains, or conflict resolution.
- No genuine AI Tutor, editable slide designer, investment memo engine, or investment modeling functionality has been implemented.
- Test data is synthetic; this branch must not be represented as having completed professional financial or source auditing.

## Next recommended checkpoint

1. Conduct actual reference-grounded human/Design Council visual comparison of these 14 screenshots and revise typography, density, hierarchy, and interactions.
2. Verify cloud preview behind private access control and perform browser-origin persistence check.
3. Advance Phase 1.2 only after visual approval: richer beginner-focused lessons, timestamped verified video segments, and a source-backed exercise catalog, followed by the first proper research notebook.

**Deployment decision:** Do not merge or expose private SELF production solely on the basis of this automated QA. 
