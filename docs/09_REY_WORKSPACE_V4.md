# Rey Workspace V4 — Five Distinct Screens

## Status
New functional presentation layer for five core screens, built on the existing Rey source. **The existing browser-stored personal data are not included in Git.** The new layer does not change existing storage schemas or delete existing records. The independent SELF Cloud V1 Supabase local-save hook and runtime module are preserved by the merged build script. Deploying from a different origin does not automatically migrate local data.

## Design choices (approved references)
1. **Dashboard / Home:** workspace cards gallery, quick actions, recent activity and calendar snapshot. No huge mountain hero.
2. **Career Studio:** Focus Board (Now / Waiting / This Week / Done), shortcuts, actual saved company/opportunity/contact data, a real 25-minute focus timer; original company/application/networking/documents views remain available via Career tabs.
3. **Calendar:** week planner (day/week/month modes), native event/task controls, goals panel, journal links and a data-grounded progress area.
4. **Notes:** knowledge library based on existing journal records, quick-save, pinning, sorting, search and rich-text editor. Existing rich-text save handler remains intact.
5. **Whiteboard:** visual redesign around the **original** infinite canvas. The underlying drag, zoom, nested boards, connectors, undo and persistence engine is preserved.

**More hub:** preserved all legacy modules (Worlds, Backpack, Journal, People Garden, Learning, Reading, Vault, etc.). The global sidebar stays five items.

## Deploy / build
- Build command: `python3 tools/build_cloudflare.py`
- Deploy command: `npx wrangler deploy`
- Root directory: `/` (repo root)
- `wrangler.jsonc` publishes **only** `./dist`.

Build reconstructs source from lossless chunks with SHA-256 verification, layers Career V3 and V4 visual functions, checks JavaScript syntax, and deploys static HTML plus `career-landscape.svg`.

## Data safety
- Current data uses the existing local-first Rey persistence, with no destructive database migration.
- Notes quick-save writes into the existing `journals` collection; `notePinned` and `noteCollection` are optional additive metadata fields.
- Board engine is called through `desk.render()` and `desk.bind()` as before.
- Calendar drag/drop uses the original `[data-cal-drop]`, `[data-cal-task]` and `[data-cal-event]` handlers.
- Career Focus Board uses real saved records; no fabricated example stats.
- Back up locally before changing domains or imported data. Avoid opening your private app to the public without access controls.

## QA
- Run `python3 tools/build_cloudflare.py` and verify all PASS lines.
- Check all five routes (`#today`, `#career`, `#calendar`, `#journal`, `#desk`) and `#more` in Chromium/Chrome.
- Test create-edit-refresh of a note; drag, pan, zoom, undo on Whiteboard; event edit and drag/drop; Career tab/record navigation; CSV import; mobile breakpoint; browser storage after reload.
- A JS syntax test is not equivalent to an end-to-end browser test. Report any unverified runtime behavior.

## Limitations
- Focus timer is in-memory and pauses when the page is closed; it is not an OS notification or background job.
- Notes collections currently default to Personal; library view exposes filtering but no collection management UI beyond the existing editor/metadata. It must not claim full folder management.
- Home board-card progress is calculated from the completion of tasks linked to that board. It is omitted when there are no linked tasks.
- No invented activity feed data, job openings, or analytics.
- Design references are illustrative; image-gen screenshots are **not** used as actual working HTML.