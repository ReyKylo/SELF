# SELF — Personal Thinking Workspace
A personal workspace for work, learning, notes, tasks and links. **Phase 2** of the three-phase rebuild (Hybrid Whiteboards).

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

## Phase 2 delivered
- Hybrid board library, boards inside Spaces, and Quick Capture for new boards
- Interactive infinite canvas: drag to move cards, resize corners, pan background and wheel, zoom controls and Ctrl/Cmd + wheel zoom
- Create Note, Task, Link, Group, Board cards, with editable summaries, key points and detailed notes
- Drag from a card's connection dot to another card to create directed relationships
- Reuse existing cards across multiple boards: **same content, separate placement**
- Linked boards and linked tasks; task opens the existing Notion-style task details
- URL extraction from knowledge card notes and automatic inclusion in My Links
- Persistent board geometry and camera in Supabase, user-scoped RLS and FK integrity
- Dedicated `boards.js` / `boards.css`; existing Phase 1 interaction and themes preserved

## Phases
- **Phase 1**: Daily workspace, Spaces, My Work, Tasks, Quick Capture, dark/light theme.
- **Phase 2**: Hybrid Whiteboards and connected cards (implemented, runtime smoke-tested).
- **Phase 3**: Richer block editor, consolidated link management, advanced global search and final polish.

## Checks
```sh
node tests/smoke_render.cjs
node tests/smoke_api.cjs
node tests/smoke_whiteboards.cjs
python3 tools/build_cloudflare.py
```
A passing smoke test isn't a browser screenshot or live deployment verification. Visual and real-device checks remain required before signing off the visual contract.

## Design contract
Read `docs/DESIGN_CONTRACT.md`. Wireframe V2 is the visual baseline, not disposable inspiration.

## Security
No service-role keys in the browser. Users can select/change only their own records via RLS. Task child rows have composite foreign keys enforcing same-user ownership. Keep security checks and test authorization between accounts before production launch.

## Deploy on Cloudflare Workers Builds (existing Worker: `self`)

SELF is a zero-dependency static application deployed as **Cloudflare Workers Static Assets**, not as a Cloudflare Pages project.

The repository includes:
- `tools/build_cloudflare.py`: creates `dist/` with the five static app assets (`index.html`, `styles.css`, `app.js`, `boards.css`, `boards.js`).
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

## Phase 2.5 — Concept C whiteboard rebuild (design locked)

The current Phase 2 whiteboard experience is **not yet accepted**. The user reported incorrectly attached connectors (particularly after resizing/rearranging) and forced form-first card creation. Do not proceed directly to Phase 3.

Required reading before writing whiteboard code:
1. [Concept C Implementation Blueprint](docs/CONCEPT_C_IMPLEMENTATION_BLUEPRINT.md): architecture, geometry, gestures, engineering and QA gates.
2. [Concept C Design Tokens](docs/concept-c-design-tokens.json): reference viewport, sizing, appearance and motion.
3. [Phase 1 Design Contract](docs/DESIGN_CONTRACT.md): maintain the existing working shell, text scaling and clicky interactions.
4. [Phase 2 Known Gaps](docs/PHASE2_RELEASE_GATE.md): tests still needing live browser verification.

**Approved visual reference:** "Concept C — Creative + Smart Diagramming" image, 1672 x 941, SHA256 5bab2bb9cc33be729efe00e31bccf82d2bd58978f64ff7d6d31a5f09254b25b7. Supplied in the chat as a reference pack. The older docs/wireframe-v2.webp is NOT the Concept C whiteboard reference. The builder must obtain the approved image before visual QA.

No destructive migrations, new Cloudflare Worker or whole-app replacement. Implement behind an isolated branch or feature flag, compare actual browser screenshots to the approved image and obtain acceptance before Phase 3.

