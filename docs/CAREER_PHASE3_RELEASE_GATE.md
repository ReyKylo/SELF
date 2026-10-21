# SELF Career Phase 3 — Opportunity Radar & Assist Release Gate
Date: 2026-10-21
Base: Phase 2 commit f8687a0
Repository: ReyKylo/SELF
Scope: incremental, source-backed Career extension; **no recurring automation was activated**.

## Delivered
- Same SELF Career route and approved nine subpages. The Opportunity Radar placeholder becomes functional.
- **Manual public-feed scan** from Remotive Remote Jobs Public API: https://remotive.com/remote-jobs/api .
- Original HTTPS job posting URLs, employer, role, location, source name and optional publication date are displayed. Only actual API results render; never invented results.
- Eligibility rules require explicit Jakarta/Indonesia or supported worldwide/regional remote wording; ambiguous remote or foreign-only positions excluded. These are heuristic screens, not employer guarantees.
- Explainable estimated relevance score: role keywords (up to 45), location/eligibility (up to 30), cluster (15), posting recency (10). Four sectors: Investment, Strategy, Venture, Fintech. Minimum 75, max 15 results per on-demand scan.
- Respect source rate limits: max 4 on-demand calls per device/account/day, at least 15 min between. Request limiter uses localStorage (not a server-wide guarantee). Provider API terms and source availability may change.
- Save, Dismiss, Restore and History persisted privately in Supabase career_opportunities, unique source URL per user. Saved/converted sources are also reflected in *general* My Links with existing display-level deduplication.
- Manually capture an **HTTPS source link** + role/company/location. Label it "user-entered"; do not claim remote verification.
- "Add to Applications" requires human confirmation, then creates/reuses the real Career Company/Application with stage Wishlist. URL-based duplicate guard protects against repeated imports. Does **not** send any application to employers.
- "Assist" creates an editable, copyable context-grounded AI research prompt; **not a connected LLM**. It never fabricates a CV/background assessment and never contacts people.
- No scheduled requests/cron, 06:00 WIB feed, application auto-send, email outreach, or AI provider credential was added. The 06:00 / Jakarta / 75% / 15 design specification remains visibly inactive as requested in prior design approval.

## Data/security
- One additive migration: supabase/migrations/20261021170000_self_career_phase3_opportunities.sql
- career_opportunities owner-scoped auth.uid() SELECT/INSERT/UPDATE/DELETE RLS, unique (user_id,job_url), nullable owner-composite FK application_id to original career_applications.
- No changes to Tasks, My Links, Boards, Spaces or previous Career tables.
- User-specific session/cache reset prevents saved opportunities surfacing under another signed-in user.
- Provider API is fetched with credentials omitted; no user resume/contact data is sent as part of Radar scans.

## Asset/code
- career-phase3.js: provider normalization, eligibility filter, scoring, Save/Dismiss/Restore, URL-to-Application conversion, Assist copy prompt.
- career-phase3.css: responsive cards and no full-screen dim.
- career.js, app.js: optional delegate into original SELF shell with existing My Links and App records.
- tools/build_cloudflare.py, index.html, CI workflow and regression tests expanded additively.

## Important limitations
- **Remote jobs only from Remotive** at this stage. This is not a comprehensive Jakarta onsite/hybrid market search. If the source API has no eligible posts, the feed will be genuinely empty.
- Relevance percent is a rule-based **job match estimate**, NOT personalized suitability or AI validation of user qualifications.
- Public-source claims, role availability and remote country eligibility require the user to verify the posting before applying.
- Assist is a researched-prompt generator, not an actual connected model. Integration with a secure AI provider would require separately approved backend architecture and secrets.
- No automatic 06:00 job discovery task is running. This was explicitly reserved for separate user permission.
- Job feed CORS/network restrictions can prevent scans in a static browser; the UI reports this rather than fabricating results.
- The 4/day counter is device-local; not strict server-side rate control.
- Browser production authenticated E2E/visual tests remain open, distinct from GitHub CI.

## Production acceptance tests
1. On deployed Cloudflare build, confirm the Career sidebar and all older SELF routes are unchanged.
2. Scan Now returns a real source-linked candidate or an honest empty/error message; no duplicate/false results, threshold >=75 and cap <=15.
3. Verify results link to Remotive, and each item clearly says Remote/eligibility context; older/stale posts must be verified externally.
4. Save a source, hard-refresh and find it in Saved and general My Links. Dismiss and Restore behave consistently.
5. Add to Applications with confirmation, refresh; stage Wishlist and source URL persist; trying same source twice never duplicates Application.
6. Test invalid/missing manual capture URL and offline Save; typed information stays put.
7. Copy Assist prompt, confirm no claim about user's work history and no message is sent.
8. Switch between two real authenticated users; saved radar records, My Links and account caches must not leak.
9. Check dark/light, mobile 390 px, desktops ~1366/1536 px, 100–150% text scaling, keyboard focus and no flashes.
10. No cron/automation was enabled by this release.
