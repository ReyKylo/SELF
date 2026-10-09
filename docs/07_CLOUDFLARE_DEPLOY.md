# Cloudflare Workers deployment — Rey Workspace

## Why the original deployment failed

The source is stored in `app/segments/*.txt`. The generated `app/index.html` was intentionally ignored by Git because it is 4.5 MB. Cloudflare initially ran `npx wrangler deploy` without a build step or a Wrangler static-assets configuration, causing:

```
Could not detect a directory containing static files
```

## Fixed repo configuration

- `tools/build_cloudflare.py` reconstructs `app/index.html` from the segments, checks the SHA-256 and JS syntax, then copies **only** the website into `dist/index.html`.
- `wrangler.jsonc` uses `assets.directory = "./dist"`.
- `dist/` and generated `app/index.html` are ignored by Git.
- No source segments, internal `tools/`, or research CSVs are exposed as hosted assets.

## One required Cloudflare dashboard change

Open **Cloudflare → Workers & Pages → your linked Worker → Settings → Build**.

Use:
- **Root directory:** repository root (blank, `/`, or `.` according to the UI)
- **Build command:** `python3 tools/build_cloudflare.py`
- **Deploy command:** `npx wrangler deploy`
- **Production branch:** `main`

**Check the Worker name before deploying:** `wrangler.jsonc` currently uses `"name": "self"`. If your existing Worker has another name, update this value to the actual Worker name first. Deploying to a mismatched name can create a different Worker.

Save settings and trigger a new build. The logs should include:
```
OK: ... app/index.html (...) SHA256=...
PASS JS syntax check
Cloudflare static build ready: .../dist/index.html (...)
```
Then Wrangler should upload static assets.

## Privacy

Hosting under a workers.dev domain or custom domain is not intrinsically private. Before publishing personal data, configure access restrictions (e.g., Cloudflare Access). Browser-local IndexedDB is not committed here or transferred to the deployment.

## Troubleshooting

- **No build command ran:** Update Cloudflare Settings → Build as above.
- **SHA/checksum mismatch:** Source segments were modified or missing. Restore them; do not bypass verification.
- **Wrong Worker:** Match `wrangler.jsonc` name to the existing Cloudflare Worker.
- **404 / blank page:** Confirm `dist/index.html` exists during the Cloudflare build and the `assets.directory` points to `./dist`.
- **Old data missing:** Browser local storage is per origin. Export from the old origin and import into the new one, after backup. Deployment alone does not migrate browser data.

## Local build

```bash
python3 tools/build_cloudflare.py
python3 -m http.server 8000 --directory dist
```
Then open http://localhost:8000/#career
