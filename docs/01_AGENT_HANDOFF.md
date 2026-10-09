# BUILD SELF / CHATGPT WORK — DEPLOYMENT HANDOFF

## MISSION

Advance the **existing** Rey Workspace, from the provided professional local candidate, into a stable, private, modern personal career operating system. Focus on genuine workflow, not additional dashboards or gimmicks.

**This ZIP contains `app/index.html` with working local Career features, not merely a new mockup.** Inspect it and the live Sites project; compare source versions before any merge.

## CREATIVE DIRECTION — LOCKED

**Grown-up, minimal, refined, useful.** ChatGPT × Linear × premium research desk. White/off-white, muted/electric blue gradients, navy type, generous whitespace, subtle shadows. Small elegant icons, no childish mascots, diorama backgrounds, stars, emoji decorations, or irrelevant dopamine-style animations. Keep motion purposeful. Don't revert to green CRM or childish scrapbook style. Keep existing data and functionality even if a visual treatment is hidden.

User quote: "I'm grown up". This is a product requirement.

## FIRST THING TO DO

1. Inspect actual **current Sites source/version and deployment**; do not assume the packaged version is byte-identical or newest.
2. Create a source copy/branch and **export the active user's IndexedDB** using the existing backup flow before touching schema or deployment. HTML ZIP is not a user-data backup.
3. Diff `source_snapshots/Rey_Workspace_original.html` versus `app/index.html`, examine `tools/patch_existing.py`, JS and CSS overrides.
4. Reconcile any newer concurrent changes **without overwriting them**.
5. Create a safe test preview/branch, not a public deployment.
6. Run `docs/04_TEST_REPORT.md` scenarios and additional full browser QA before presenting the change as finished.

## NON-NEGOTIABLE PRESERVATION

- Existing routes still work: #desk, #today, #worlds, #calendar, #planning, #journal, #learning, #library, #career, #people, #trails, #postcards, #backpack, #vault, #contacts, #templates, #spark, #inbox, #settings.
- Added route: #more.
- **No migration or deletion** of boards, ideas, links, notebooks, people, contacts, voice files, attachments, URLs, notes, memories, or activity history.
- Existing **Rey People and career contacts are interconnected via the existing contacts collection**; do not create a second disconnected CRM.
- Biu assets/code may be hidden but should not be deleted in a refactor without migration analysis.
- World art is hidden from primary UI by design; **World data and navigation are preserved**.

## WHAT THIS CANDIDATE ALREADY DOES

- Career: Today / Discover / Pursue / Connect / Documents.
- Company workspace with linked roles and contacts.
- Opportunity list/Kanban with editable stage.
- Networking with editable status, follow-up display, outreach drafts and clipboard.
- Documents via existing `resources` rows: `category='Career Document'`.
- Template-shaped CSV import with review and safe-ish matching (external ID then URL/name). On storage failure import attempts in-memory rollback.
- Five-item sidebar / More gallery / style modernization / World gallery simplification.

## NEXT PRIORITIES, NOT ALL BUILT

P0: Build Self runtime regression and verified IndexedDB persistence, import conflict testing, URL safety, and smartphone navigation.

P1: Improve CSV importer with actual column mapping, per-row diff/merge, rejected-row downloadable report, explicit duplicate resolution and undo/rollback.

P1: Add keyboard Command Bar for Add Company, Open Applications, Find Contacts, Import Research. Preserve existing global Ctrl/Cmd+K search; extend it rather than creating a conflicting hotkey.

P1: Unified record activity history (when applied, who contacted, what changed) with reliable in-app follow-up actions; do not send messages automatically.

P1: Improve Documents to support secure local attachment references and optional CV version assignment to applications, reusing existing Backpack file architecture.

P1: Make next-action list account for contacts' follow-up due dates, application next-action dates, and upcoming interview events, with explicit "Done" behavior; present grounded actions only.

P2: Full professional visual refinement of remaining Rey modules, including Desk note styles and empty states, People Garden, Journal, Backpack and nested World visuals. The style should remain calm, not a SaaS clone. Use reusable tokens and neutral icons.

## ACCEPTANCE

When demoing the result: start in Career, open a company, open source URL, change one application stage, draft a message, create a contact with follow-up date, import a two-row CSV with preview and dedupe, save a CV link, browse More, and then prove Desk/Journal/World content survives refresh. Test on mobile.

**Never fabricate internships or claim job openings are live based only on seed data.** Preserve source URL, verification date, and historical status.

## DELIVERY

Provide changed source, manifest, preview screenshots, test logs and data preservation evidence. Explain every remaining blocker. Do not publish/redeploy without permission.
