# SELF Career Prep release record

Base: main 75e5e9e44b56b74ea577ebfdc0685e4cc00a5c80. User request: integrate the completed Expert Evidence & YouTube Learning Library inside SELF. No new visual direction, backend schema or automation.

## Delivered

Career → Career Prep inside the original shell: Sprint 3 hari / Expert Evidence / YouTube / Sumber. 41 distinct source URLs, 12 evidence entries, 9 videos and 3 fictional worked assignments. Explicit source-pointer states, screening-versus-deep-review distinction, timestamped chapters only from verified descriptions. Search/publisher/track/type filters, honest loading/error/retry/no-match states, light/dark and type-scale inheritance. Videos require explicit Play/chapter activation; external YouTube fallback is available.

Project creation is opt-in via original authenticated host API. Deterministic per-user/sprint UUIDv8 occupies existing tasks.id; preflight GET and conflict/lost-ack GET converge on that record. Confirmed rows are held locally before opening; stale owner responses ignored. Existing Task detail controls required removal of the inline click propagation blocker and an explicit backdrop-hit guard; native Close, Notes and nested controls were retested.

## Validation

- Existing 12 smoke suites plus new Career Prep smoke all pass locally (including deliberate network-failure fixtures that emit expected errors).
- Static Cloudflare build passes with the new JS/CSS/JSON/Markdown assets; nested output directories are created deliberately.
- Both independent Lookers reviewed actual running screens and primary actions; separate QA executed `tests/browser_career_learning.cjs` with synthetic API data.
- QA exercised native task Close, repeated clicks under delay, reload/reopen, lost POST acknowledgement, failed lookup/retry, counts/search/no-match/reset, evidence-video-back context/focus, honest source labels, unrelated Career 503, JSON 503/retry, four tabs at 390px/1366px and 150% type, keyboard search and theme switching.
- Unit fault/concurrency checks cover two independent clients sharing the same Task primary key, rejected preflight/write, stale owner response and content escaping.
- Browser actions use only an isolated local fixture. No production auth bypass or QA records were created.

## Bounds / accepted minor

Actual production login, two-live-account RLS exercise, browser playback restrictions on external YouTube and external screenshot permissions remain unverified by this release. Source figures are linked rather than hosted; visual screenshot parity is not claimed. No complete-video-viewing or measured FPS/performance-compliance claim. An optional minor remains: the horizontally scrollable evidence selector may require manual scrolling to reveal the selected item after filter reset; reader identity and selected state remain correct.

The remembered production domain returned HTTP 403 to the unauthenticated inspection request; that is not a production deployment confirmation. A main-branch commit should trigger the user's existing Workers Builds pipeline. Record GitHub CI and observed deployment evidence separately; never equate a successful commit with a verified live app.
