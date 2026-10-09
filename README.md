# Rey Workspace — Professional Career OS V2

**Status:** Working local build + safe handoff package. **Not deployed to Sites.**

Rey now uses a cleaner, adult visual direction: **premium blue gradients, readable interface, less ornament, no default Biu companion/diorama scenery**. More importantly, Career is a functional action-oriented workspace built on **the existing local-first Rey data model**.

> **Start here:** `app/index.html` is the locally built version. `source_snapshots/Rey_Workspace_original.html` is the unmodified baseline. The production Sites project is **not** changed by this ZIP.

## Run it locally

Extract this ZIP. From the extracted folder:

**Windows** (with Python):
```powershell
py -m http.server 8000 --directory app
```

**Mac/Linux**:
```bash
python3 -m http.server 8000 --directory app
```

Open **http://localhost:8000/#career**. Navigate to **Desk**, **Career**, **Calendar**, **Capture inbox**, and **More** using the sidebar.

Why localhost? Browser storage and voice/attachment permissions are more reliable in a secure local origin than opening the HTML directly with `file://`. Most core pages work offline once loaded, but externally hosted fonts and some browser APIs may require connectivity.

## What's already implemented in this local build

- Clean global **5-item** sidebar: Desk, Career, Calendar, Capture inbox, More.
- **More** — responsive tile gallery linking back to existing Overview, Whiteboard, Worlds, Planning, Journal, Learning, Reading, Spark, People, Trails, Postcards, Vault, idea inbox, legacy contact and templates pages. Existing route IDs remain reachable.
- **Career** with 5 internal tabs: Today, Discover, Pursue, Connect, Documents.
- **Today** — metrics derived from local records, overdue contact follow-ups and upcoming application deadlines, shortcuts.
- **Discover** — searchable company directory, company contextual page, related opportunities/people, website and career links.
- **Pursue** — opportunity list, **Kanban**, editable application stages, source/apply links and details.
- **Connect** — professional contact records, editable LinkedIn connection status, read-only contextual view, outreach draft editor with manual copy (never auto-sends).
- **Documents** — locally saved document links/notes in existing `resources` records, plus existing outreach templates. This is **link management**, not uploading CV binaries directly in the Career tab.
- **CSV import** — handles provided five file types via known headers, shows preview and requires confirmation. Companies, opportunities and contacts can be added/updated; applications and follow-ups update matched existing records. Import is template-driven, **not** a fully arbitrary column-mapping interface. Backup-first recommended.
- **Adult visual pass** — blue gradient, white/navy, subtle shadows, reduced mascot visibility, stripped visual clutter. Worlds overview changed to a professional directory. Whiteboard world/board data and engine remain intact.

## Start your career hunt tomorrow

1. Open `#career` and visit **Today**. Treat the imported historical research as **unverified** until you check a company's current openings.
2. Open **Documents** and save the URL to your latest CV; or keep the actual file in the existing Capture Inbox/Backpack workflow.
3. Open **Discover** and review the firms most relevant to VC, PE, M&A and Consulting. Add missing firms manually.
4. Open **Pursue**, check the **original apply link** for each opportunity, and update its status only after acting.
5. Open **Connect**, save the relevant person's profile and your specific reason for reaching out. Use **Draft** for personalized outreach, then manually send it on LinkedIn/email.
6. Add follow-up dates to contacts; dated items surface in **Today**.
7. Export a backup from Settings after you've added meaningful data.

**No live vacancies are automatically fetched or verified by this local build.** Historical seeded rows are research leads, not guaranteed open jobs.

## Hand off to the Build Self / Work agent

- Upload the entire ZIP.
- Tell the agent to inspect `app/index.html`, then **read `docs/01_AGENT_HANDOFF.md`** and `docs/02_COMPATIBILITY_AND_DATA_SAFETY.md`.
- Source patcher: `tools/patch_existing.py` deterministically recreates `app/index.html` from the preserved baseline and additive JS/CSS. It is **not** a safe replacement for project-wide migration or production QA; inspect the actual Sites project before changing it.
- Do not overwrite live Sites without confirming source version, taking a backup, and getting authorization.

## Folder map

| Path | What it is |
|---|---|
| `app/index.html` | **Runnable local candidate**, not a Sites deployment |
| `source_snapshots/Rey_Workspace_original.html` | Unmodified source baseline from Library |
| `tools/career_additions.js` | Additive Career, More, and professional Worlds functions |
| `tools/professional.css` | Design override layer, no user-data change |
| `tools/patch_existing.py` | Rebuilds the candidate from the baseline |
| `csv_templates/` | Five import header templates with no fabricated leads |
| `design_references/` | Original references + local browser render screenshots |
| `docs/01_AGENT_HANDOFF.md` | Implementation/deployment instructions |
| `docs/02_COMPATIBILITY_AND_DATA_SAFETY.md` | Data and route protection contract |
| `docs/03_CAREER_UX_SPEC.md` | UX spec, enhancements and known gaps |
| `docs/04_TEST_REPORT.md` | Tests done, environment limits and remaining QA |
| `docs/05_TOMORROW_LAUNCH_CHECKLIST.md` | Ready-to-follow career actions and outreach copy |
| `docs/06_RESEARCH_TO_CSV.md` | Research handoff prompt and CSV rules |
| `RELEASE_NOTES.md` | New features and limitations |
| `MANIFEST.json` | SHA-256 inventory for the handoff |

## Critical safety facts

- **ZIP does not contain your existing browser's IndexedDB user data.** HTML and JavaScript aren't an export of local notes or attachments. To move your active data, use the existing app's backup/export and carefully test restore.
- No Supabase keys or Telegram bot tokens were added. Do not publish private HTML/seed content without review.
- Local test environment used a mocked `localStorage` fallback because browser navigation to localhost/file URLs was blocked in the runner. This is **not proof of actual IndexedDB durability on the active site**.
- Existing Desk, Journal, People Garden, Backpack and Worlds had navigational smoke tests, but not exhaustive regression testing. Run the full QA checklist on the target deployment.
- The patch is designed to preserve existing record formats, collections and routes, but full end-to-end compatibility must be confirmed against the authoritative live build before deployment.

**Product principle:** Stop organizing for its own sake. Discover → Pursue → Connect → Follow up. Fewer visible choices; none of your existing work discarded.