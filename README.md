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
