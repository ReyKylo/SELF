# Rey Workspace — Professional Career OS V2

A private, local-first personal workspace with an adult blue-gradient UI, Career Studio CRM, Whiteboard, Journal, Worlds, People and more.

> **Important:** This repository contains the local candidate from October 2026. It has **not** been deployed to the existing ChatGPT Sites project. Test and back up your browser data before deploying or changing origins.

## Start the app

This source uses **lossless text segments** only because the GitHub connector could not upload the original 4.5 MB HTML as a single request. The segments reconstruct the byte-identical app. They are not individual UI modules.

```bash
python3 tools/assemble.py
python3 -m http.server 8000 --directory app
```

Then open `http://localhost:8000/#career`.

The assembler verifies the `SHA-256` and byte count of `app/index.html` before writing anything. Do not modify or manually reformat individual segments. To change source, rebuild the candidate locally and re-segment deliberately.

## What this version offers

- Five-item global navigation: Desk, Career, Calendar, Capture inbox, More.
- Career tabs: Today, Discover, Pursue, Connect, Documents.
- Local-first career records, company profiles, application pipeline, outreach drafts, document links, and template-driven CSV import.
- More gallery opens existing modules without deleting their routes or data.
- Existing Whiteboard, Nested Worlds, Journal, People, Backpack and other features are preserved in the candidate source.
- Professional white/navy/blue-gradient styling, with childish mascot effects removed from primary views.

## Safety and limitations

- Browser IndexedDB/localStorage data is **not included** in this repository. Use the app's backup/export before migration.
- Existing Sites deployment remains unchanged.
- No real-time vacancies or LinkedIn messages are fetched/sent automatically.
- CSV import is template-driven, not arbitrary schema-mapping.
- Documents manages saved document links rather than storing CV binary files in the Career tab.
- Verify runtime behavior in your deployment browser before replacing production.
- Only commit sources you are comfortable keeping in this **private** repository; do not publish without checking seeded data.

See `docs/` for detailed handoff, UX spec, test limits, and career launch instructions.

## Project layout

- `app/segments/` — lossless chunks + checksum manifest for the runnable single-file app.
- `tools/assemble.py` — reconstructs `app/index.html` and checks integrity.
- `tools/career_additions.js` — additive Career, More, and Worlds updates.
- `tools/professional.css` — premium minimal visual override.
- `tools/patch_existing.py` — patching tool for the archived original baseline (not included here; available in local handoff ZIP).
- `tools/verify_static.py` — static checks after assembly.
- `docs/` — specifications, implementation handoff, limitations, test report.
- `csv_templates/` — clean import templates.

**Rey principle:** less decoration, more action; preserve the data you already have.

## Cloudflare deployment

The repo stores the 4.5 MB HTML as lossless source segments, so Cloudflare **must** run a build step before `npx wrangler deploy`.

In **Cloudflare → Workers & Pages → Worker → Settings → Build**:

- Build command: `python3 tools/build_cloudflare.py`
- Deploy command: `npx wrangler deploy`
- Root directory: repo root

The repo's `wrangler.jsonc` points Wrangler to `dist/`. **Confirm that `wrangler.jsonc`'s `name` matches the Worker linked to this Git repository before deployment.**

The build verifies source integrity and deploys only `dist/index.html` (not `app/segments`). See [docs/07_CLOUDFLARE_DEPLOY.md](docs/07_CLOUDFLARE_DEPLOY.md) for checks, privacy caveats, and troubleshooting.
