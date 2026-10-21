# SELF — Whiteboard Clutter Audit & Seven-Iteration Design Review
Date: 2026-10-21
Status: chosen layout **#07 Adaptive Quiet Canvas** implemented in production source; GitHub CI passed on first production-style iteration; actual Cloudflare/browser screenshot acceptance pending.
Original audit input: user screenshot uploaded on 2026-10-21 (Windows Chrome), shows board "ABC" with rectangle and circle connected at 38% zoom, with left navigation, centered horizontal toolbar, floating Smart Actions, fixed Properties pane, bottom zoom tool, and minimap.

## Root cause, NOT cosmetic
The existing Concept C interface renders all tiers of controls regardless of task:
- 10 object creation icons centered in the same horizontal strip as breadcrumb, Saved, Undo and View;
- full Smart Align/Tidy/Suggested Layout strip while no objects selected;
- 308px Inspector persisted despite "no selection";
- duplicate camera controls in header and bottom;
- navigation hint, minimap and zoom all crowd lower canvas;
- low zoom made existing objects look small against a crowded chrome frame.

Current code's UI affordance density does not follow the user's thinking flow. Blank canvas should center work, not give equal priority to every secondary action.

## Seven actual browser-rendered HTML/CSS layout prototypes
All 7 were built with the same fixture shapes and controls; screenshots captured in Chromium at 1536×900.

| # | Direction | Outcome | Reason |
|---|---|---|---|
| 1 | Compact Header | Reject | toolbar + fixed inspector + always-on smart strip still crowded |
| 2 | Focus Canvas | Strong | left tool dock, minimized persistent controls; text navigation kept |
| 3 | Bottom Workbench | Reject | bottom tools would conflict with minimap/zoom and viewport accessibility |
| 4 | Explorer Mode | Reserve | excellent space but collapses navigational text and hurts discoverability |
| 5 | Studio Split | Reserve | right inspector useful when selected, not valuable when board is idle |
| 6 | Single Ribbon | Reserve | orderly header but creates header coordination/collision at smaller widths |
| 7 | Adaptive Quiet Canvas | **Chosen** | clean idle state, discoverable vertical dock, on-demand inspector + smart tools |

These are design prototypes, NOT screenshots of the deployed authenticated SELF application. Preserve that distinction.

## Committed implementation (not just a plan)
- Idle inspector hidden: opens by explicit **Properties** button; **Notes** quick action opens directly to detailed note inspector.
- Smart actions hidden except when 2+ items selected.
- Tools move to a floating vertical left dock; six frequent tools shown + four advanced tools behind a click-to-expand More control.
- Header: back + board identity, concise Saved + undo/redo + Properties. Removed redundant permanent View/Zoom/Fit controls from header.
- Bottom-left becomes a single zoom/fit/view-back/help utility bar.
- Minimap collapsed by default to a small Map entry; expands only when requested.
- Instruction hint hidden by default; '?' reveals gestures/shortcuts.
- Inspector remains mounted but does not consume canvas grid width while closed; no data change.
- Keep existing connected cards, smart routing, notes, drag/resize, keyboard shortcuts and Supabase persistence.
- CSS remains within .c3-shell and body:has(.c3-shell) to avoid Phase 1 pages.
- Avoid flash: no full-screen backdrop/dimming or full app remount; toolbar DOM changes only when expanded state toggles.

## Spatial acceptance
At screenshot width, old Properties reserve was approximately 327px. Removing it restores ~327px to the canvas while idle, approximately 30% more working width at the same application screen. This is a geometric estimate from the supplied screenshot, not an on-device browser metric.

New interface must pass:
1. No overlap among breadcrumb, toolbar, Saved and Properties at 1536, 1366, 1100, 768 viewport widths.
2. No idle canvas intrusions beyond one 58px floating tool dock, one 46px zoom toolbar and a compact Map button.
3. No fixed Properties pane when 0 selections, user can open it for any selected object.
4. Smart strip does not render in the viewport when no multi-selection exists.
5. Creation tools visible without dialogs for common objects; advanced shapes within one click.
6. Minimap and hints remain opt-in; no focus stealing or full-screen visual blink.
7. All actions and keyboard shortcuts remain functional; theme, text scaling and other SELF pages remain unchanged.

## Known limitations / QA honesty
- Seven design prototypes were rendered using local HTML/CSS fixtures, not the production Supabase session.
- GitHub Actions smoke tests validate state/commands/build; they do NOT show pixel-perfect screenshots of logged-in SELF.
- Authenticated Cloudflare UI screenshot at 1536×900 and mobile touch usability remain the final QA gate.
- Global hard refresh after Cloudflare deploy may be necessary to load new CSS/JS.
- No database migration was required for this UI-only redesign.
- Whiteboard object positions and prior notes are preserved.

## Future non-blocking UX candidates
- One unified context menu for connector labeling and object styles.
- Customizable dock position, persistent user choice.
- Searchable quick-create palette via "/" shortcut.
- True grouping/frame parenting and larger touch handles.
These are not a license to add more permanent floating controls.
