# SELF Phase 2 — Hybrid Whiteboards Release Gate

**Visual source of truth:** \`docs/wireframe-v2.webp\` and \`docs/DESIGN_CONTRACT.md\`.
This is an additive phase; the Phase 1 shell, navigation, colour system, themes and type-scaling must not regress.

## Implementation
- [x] Boards can be created globally or inside any Space.
- [x] Infinite pan/zoom canvas with movement, card resize and connection gestures.
- [x] Knowledge cards with key points, detailed notes, URL, linked task/board and accent colour.
- [x] Notes include simple Markdown toolbar and preview (not a complete Notion block editor).
- [x] One canonical card content record with many independent board placements.
- [x] User data persisted to Supabase with four RLS-enabled tables and cross-user FK ownership.
- [x] External URLs within card notes are surfaced in My Links; cards and edges are private.
- [x] Cloudflare Workers static assets build includes both new files.

## Tested automatically with representative fixture data
- [x] Existing 9 views render in an isolated JS DOM harness.
- [x] Canvas rendering, card detail and linked-board backlink.
- [x] Creating boards and notes updates mocked persistence.
- [x] Moving a card calls placement persistence.
- [x] Dragging card-port to port creates an edge.
- [x] Editing shared card content updates the other board.
- [x] Note URL extraction and HTML-escaping of card text.
- [x] \`tests/smoke_whiteboards.cjs\` included for \`node\` regression runs.

## Mandatory remaining checks before final visual sign-off
- [ ] Verify latest production deployment in Cloudflare Workers > self > Deployments.
- [ ] Screenshot actual running UI and compare to wireframe V2 at a desktop viewport.
- [ ] Verify dark and light, text scale 100% and 150%, keyboard interactions and mobile gestures on real devices.
- [ ] Create/edit/delete a board and card in an authenticated session, reload and verify backend persistence.
- [ ] Open the same card on two boards and verify both content and separate placement persist after hard refresh.
- [ ] Run authenticated RLS isolation tests with two different real accounts.
- [ ] Validate layout/card editing with longer notes, 50+ items and network interruptions.

## Known limitations
- Board note editor uses Markdown + preview, not a full WYSIWYG block editor.
- Group moves geometrically contained cards; this is not yet a nested persistent membership system.
- No multiplayer collaboration, per-board sharing or undo/redo stack.
- My Links derives whiteboard URLs from stored cards; cross-source deduplication and pinning are Phase 3.
- A working build does **not** mean pixel-perfect UI parity has been established.
- Database security advisor still reports leaked-password protection disabled in Supabase Auth; enable before considering security review complete: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
