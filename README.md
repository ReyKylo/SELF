# SELF — Personal Thinking Workspace
A personal workspace for work, learning, notes, tasks and links. **Phase 1** of the three-phase rebuild.

## Run
No build tooling or dependency installation needed. Serve the directory over HTTP:
```sh
python3 -m http.server 8080
```
Open http://localhost:8080. A Supabase email/password account is required. The client connects to the existing SELF Supabase project. The key in `app.js` is **publishable** (not a service-role secret). Access is enforced by per-user row-level security policies.

## Phase 1 delivered
- Home with Quick Capture and priorities aggregated from every Space
- CRUD Spaces and Tasks, task status, priority and due dates
- Task detail side-sheet, checklist, notes and subpages
- URLs in task notes/description auto-captured into task links; link library
- Task List / Board / Calendar views, inbox and search
- Dark/Light themes, persistent scalable text 100–150%, responsive navigation
- RLS-protected tables with real PostgREST persistence and Auth

## Phases
- **Phase 2**: Infinite Hybrid Whiteboards, movable/resizable cards, connectors, board links.
- **Phase 3**: Knowledge relationships, deeper global link library, advanced search and final refinement.

## Design contract
Read `docs/DESIGN_CONTRACT.md`. Wireframe V2 is the visual baseline, not disposable inspiration.

## Security
No service-role keys in the browser. Users can select/change only their own records via RLS. Task child rows have composite foreign keys enforcing same-user ownership. Keep security checks and test authorization between accounts before production launch.

## Deploy on Cloudflare Workers Builds (existing Worker: `self`)

SELF is a zero-dependency static application deployed as **Cloudflare Workers Static Assets**, not as a Cloudflare Pages project.

The repository includes:
- `tools/build_cloudflare.py`: creates `dist/` with only `index.html`, `styles.css` and `app.js`.
- `wrangler.jsonc`: preserves the existing Worker name `self` and points Wrangler to `dist/` as static assets.

In **Cloudflare dashboard > Workers & Pages > self > Settings > Builds**, set:

| Setting | Value |
| --- | --- |
| Connected repository | `ReyKylo/SELF` |
| Production branch | `main` |
| Root directory | `/` (repository root) |
| Build command | `python3 tools/build_cloudflare.py` |
| Deploy command | `npx wrangler deploy` |

Do not look for a Pages-specific build output directory in Workers Builds. Wrangler reads `assets.directory` from `wrangler.jsonc`. Do not change the deploy command to `wrangler pages deploy`, as this is an existing Worker.

Local verification:

```sh
python3 tools/build_cloudflare.py
python3 -c "import json; c=json.load(open('wrangler.jsonc')); assert c['name']=='self' and c['assets']['directory']=='./dist'"
ls dist/
```

A new commit to `main` should trigger a new Workers Build. Use **Deployments** to check the build and deployment status; a successful GitHub commit alone does not mean Cloudflare is live.
