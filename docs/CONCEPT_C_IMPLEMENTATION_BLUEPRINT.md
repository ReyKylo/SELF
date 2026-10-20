# SELF — Concept C Implementation Blueprint (LOCKED DESIGN CONTRACT)
Status: SPECIFICATION ONLY — no runtime code changed by this document.
Date: 2026-10-21
Target: Phase 2.5 whiteboard replacement; Phase 3 is held until acceptance.
Visual authority: the user-approved **Concept C — Creative + Smart Diagramming** image in the SELF project conversation, native resolution **1672 × 941**. This is NOT the older Phase 1 wireframe-v2.webp.
Project invariants: Existing SELF Home, Spaces, Work, Links, login, Supabase user data, Cloudflare Worker "self", dark/light mode and global font scaling must continue working.

## 0. Product principle
**Compose first. Think later. Organize when invited.**
The user must be able to draw six empty objects and connect them without filling in title, type, form, notes, URL, or category. Clicking the toolbar creates or draws an object immediately. Visual style is independent of content. Deep notes are optional and editable later.
No new tool, feature, or backend architecture is allowed to replace the reference with a generic dashboard/kanban UI.

## 1. Screen anatomy: match reference C
Reference coordinate frame: 1672 × 941 desktop. Boundaries below are **anchors**, not rigid dimensions for other viewports.
| Region | Reference geometry | Contract |
| --- | --- | --- |
| Global SELF sidebar | left x=0–185 | Preserve existing navigation with Boards selected; dark charcoal, clean icon+label alignment |
| Product header | y=0–78 | SELF identity, board context, compact account controls. Avoid extra banners |
| Canvas toolbar and breadcrumb | x=195–1350, y=82–142 | Bread crumbs left, floating central tool strip (Select, Rectangle, Circle, Diamond, Line, Text, Media, Sticky, connectors); undo/redo and zoom to the right |
| Main canvas | x=194–1340, y=143–917 | Maximum breathing room; subtle dotted grid, not a large boxed dashboard |
| Contextual inspector | x=1350–1660, y=145–917 | Persistent ~310px panel on large desktop, tabs Style / Arrange / Smart Layout / Notes |
| Smart actions | top of canvas near x=790–1215 | Smart align, Auto tidy, Suggested layout, appear with relevant selection |
| Canvas utilities | bottom left | Hand/select and zoom controls in compact elevated shell |
| Scene language | throughout central canvas | Mixed shapes, image references, sticky notes, labelled cards, flexible frames, a small moodboard, and tidy attached arrows |

At a 1440px viewport preserve these relationships proportionally. Inspector may collapse on smaller screens; never sacrifice usable canvas to maintain fixed widths. At <=768px inspector becomes a drawer. Contextual overlay should not cover the entire canvas when editing a simple property.

## 2. Visual tokens — initial implementation values, to be tuned by screenshot comparison
- Shell/sidebar #171E25; header #13191E; canvas #191F26; inspector #1D242E; strokes #354152; type #F1F4F9; muted #AAB4C3.
- Action blue #3B7DFD; selected violet #8B5CF6; cool blue card, soft green outcomes, cream/yellow note, dark graphite reference tiles.
- Avoid heavy neon, gratuitous gradients, excessive glow or generic admin-dashboard patterns.
- Canvas card corners 12–16px; inspector controls radius 9–11px; sidebar item height approximately 48px.
- Text default >=16px for editable content, labels >=14px, headings 22–30px. 100–150% app text scaling must apply to canvas card text and inspector too, without cropping.
- Normal pointer/touch target >=42px (44px for mobile/touch); resize/port visual indicator can be smaller but hit area >=24px desktop, >=40px touch.
- Motion 120–160ms button hover/press, 180–220ms inspector transition, zero artificial latency; reduced-motion mode disables decorative animation.
- Selected object: visible 2px highlight, 8 resize handles, contextual toolbar; rest of scene stays readable and unblurred.
- Keep dark/light genuinely designed, not simple CSS invert; selected object and connector contrast pass readable visual QA in both.

## 3. Tools and gestures: no form-first gates
| Intent | Pointer / keyboard action | Observable result |
| --- | --- | --- |
| Create blank shape | Choose Rectangle/Circle/Diamond then click or drag on canvas | Object immediately exists, no modal, text empty; inherits last-used style |
| Create sticky or note | Toolbar then click or drag; double-click card | Blank sticky appears; double-click edits inline, Enter commits, Escape cancels |
| Place and resize | Drag body or selection handles | 1:1 pointer following, no jumping; connected lines follow on every frame |
| Move many items | Shift+click or marquee, drag selection | Objects move together; no selection loss; handles and guide lines update |
| Pan and zoom | Hand tool / Space+drag / trackpad, pointer-centered Ctrl/Cmd+wheel | Canvas flows, zoom anchored beneath pointer, center/zoom restored on reload |
| Quick connect | Drag from an anchor toward another shape, or use connector tool | Near target, show magnetic highlight; line binds persistently to shapes |
| Modify connection | Select line, drag endpoint or change routing in inspector | Route changes without disconnecting or overlaying cards |
| Auto tidy | Select 2+ objects, click Auto tidy | Preview -> commit; objects align/spread while preserving existing order and contents |
| Link note to task | Open deep note inspector, choose existing task | Native SELF task detail still opens; data belongs to authenticated user |
| Attach reference | Drag/drop/paste screenshot or select local image | Actual image preview after secure upload, loading/error state, linked reference |
| Undo/redo | Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z, toolbar controls | Content, movement, connector and style operations reverse reliably |
| Rename board | click title or board settings | Update without leaving canvas; preserve camera |

A blank object must NOT have to be named "Untitled" visibly. It may have an internal ID; the placeholder UI is nonpersistent and optional.

## 4. Connector system — unacceptable failures
Problem in Phase 2: CSS ports are placed near bottom of card, but edge geometry uses left/right midpoints. It also routes every edge from right to left. This causes detached-looking connectors, especially after resizing and reordering.
Replacement:
1. Four normalized ports at exact top/right/bottom/left mids: N(0.5,0), E(1,0.5), S(0.5,1), W(0,0.5). Geometry comes from ONE shared transform/shape-rectangle system for visible handles AND rendered paths.
2. Attachment mode auto chooses sides based on relative centers, available clearance, user drag direction and route stability. Support manual pin of a side when wanted.
3. Straight, orthogonal/elbow, cubic-curved routes; default chooses smooth route with no intersections when possible. Consistent arrowheads and label position. Avoid routing through nodes unless user explicitly enables it.
4. On drag, rotate, resize, zoom or transform, recompute the routes on the same frame. Do not wait for a backend roundtrip or pointer release.
5. Connector endpoints must stay within **3 CSS px** of their visibly selected attachment port at all supported zoom levels, not just after the gesture ends.
6. Parallel and reverse connections must be individually selectable; deleting one connection must not delete the nodes.
7. Connection creation: 12px visual magnet range desktop; larger touch hit area; valid target glows and shows preview. Escape cancels with no backend write.
8. After resize/move with A -> B -> C, arrows preserve binding and line/label readability; auto-route recalculates when B moves above or behind A.
9. The source-of-truth stores endpoint shape/port identities, route type and optional user overrides. Do not persist only absolute SVG path strings.
10. Respect semantic color/contrast; selected connector has distinct hover and selection affordances and keyboard delete.

## 5. Object / knowledge separation (non-destructive)
Keep existing public.boards, public.knowledge_cards, public.board_items, public.board_edges, tasks, task_links, and RLS intact until compatibility adapter passes all tests.
- board scene object: visual kind (rectangle, ellipse, diamond, sticky, text, image, frame, knowledge-card), geometry x/y/w/h/rotation/z, style, lock state and optional parent frame.
- knowledge_cards remain canonical shared content (title/summary/body/key_points/task/target_board/url). Scene objects may optionally reference canonical content; shape-only decorations need NO knowledge record until promoted.
- board edges bind to scene object IDs, not screen coordinates. Anchor preferences and route settings are stored; cursor preview is derived client-side.
- linked knowledge card appears on multiple boards with ONE content ID but independent scene geometry/style where appropriate. Update contents once, reflect across boards.
- media: use private Supabase Storage bucket, authenticated upload, signed read URLs, file size/type limits, delete cleanup; no public unguarded upload. Avoid embedding arbitrary untrusted iframes by default.
- bookmarks: when a user pastes an http(s) reference into Notes or links a media source, it appears in Important Links without duplication. Do not turn every text token into a bookmark.
- persistence: debounced writes for geometry; batch changes at gesture end; optimistic UI with rollback on network failure; dirty/saving/saved/error indicators; preserve edits on page navigation.
- migration must be ADDITIVE, explicitly preserve all existing board/card IDs, and ship both forward and backout procedure. No table drops, no reset, no blind replacement of production data.
- RLS + user-scoped FK checks for all additions; no service-role key in client.

## 6. Candidate engine and mandatory prototype gate
Existing Phase 2 custom SVG engine demonstrably lacks a full scene graph, true port bindings, snap/alignment, multi-selection, and history.
A bounded engine spike must compare:
- tldraw SDK: strong creative canvas, bindings and arrows; **requires valid license in production** (commercial, eligible hobby, or time-limited trial). DO NOT ship an unlicensed SDK to production. Verify license cost/rights before choosing.
- @excalidraw/excalidraw: MIT-licensed React component with established drawing interactions, but custom premium SELF shapes, structured content, and inspector integration need validation.
- @xyflow/react: great graphs/nodes/handles, but a freeform mixed-media creative canvas will require substantial additional work.
- upgrading current custom engine: lowest framework migration cost but expensive for correct rotation, pointer capture, undo/redo, snap guides and routing.

Prototype in ISOLATED branch/route with throwaway fixtures. Do NOT replace production /boards before passing. Score each on:
- 30% binding correctness, resize, auto routing and gesture fidelity;
- 25% ability to reproduce image C's visual experience and contextual inspector;
- 20% blank-first UX, media+sticky+diagram in one scene;
- 15% integration with current Supabase, secure storage and Cloudflare Worker static build;
- 10% licensing, upkeep, bundle/performance.
Preferred approach only after measured comparison. No assumption that adopting a third-party editor automatically equals Concept C.
Production may use React inside the canvas module while leaving Phase 1 shell untouched; avoid rewriting the entire product.

## 7. Delivery slices; each slice has a hard QA gate
### 2.5A — Canvas + immediate blank creation
- Blank rectangle/circle/diamond, sticky, plain text and flexible frame; click-to-place, drag-to-draw, inline edit, move, multi-select, resize, snap guides, undo/redo.
- Full fidelity chrome shell and inspector skeleton already styled to reference C.
- Gate A: six empty objects created in under 15 seconds without one required form; no broken selection at 50–150% zoom.

### 2.5B — Binding-grade connectors
- 4 ports, auto/manual sides, straight/curved/elbow, magnetic target, labels, resize+move recompute, arrowheads.
- Gate B: A -> B -> C rotated/reordered/resized and reloaded; no floating arrow ends (>3px error), no line-through-card on tested arrangements.

### 2.5C — Inspector and smart organization
- Style, Arrange, Smart Layout, Notes tabs; contextual properties and autosave.
- align/distribute, layer/reorder, group/frame parenting, straightening, auto tidy, suggest layout; optional previews, user retains control.
- Gate C: marquee-select five shapes, align/space, undo, reload; visual quality doesn't regress.

### 2.5D — Creative references + connected knowledge
- Image, paste/drop media, reference card, moodboard frame, rich notes, linked board/task, Important Links integration, shared canonical cards.
- Gate D: replicate composition of Concept C with REAL editor objects (no screenshot pasted behind controls); save/reopen; check dark/light, 100–150% text size, keyboard and touch.

## 8. Quality and visual anti-drift
Reference design is an acceptance oracle, not generic inspiration. Review measured at 1672×941 plus 1440×900 desktop, 390×844 mobile.
- Test empty, selected, hover, editing, dragging, resizing, connecting, grouped, populated, saving, offline, error, theme variants.
- Capture **real running browser screenshots** (not generated mockups) side by side with Concept C. Compare geometry (sidebar/topbar/inspector), typography, component density, object variety, strokes and color. Annotate deviations with severity and owner.
- Before each merge, review every available control: click must cause observable state change, open real interface, or be visibly disabled with rationale. No decorative fake buttons.
- Independent QA must test 50+ objects, long notes, zoom extremes, undo history, keyboard, 2-user RLS isolation, reload persistence and stale network responses.
- Ship screenshots / test reports and corrective diff as PR artifacts; user acceptance is required before Phase 3.
- Deployment: existing GitHub ReyKylo/SELF -> Cloudflare Worker "self" via wrangler, Supabase project btiwxqjiptbwaunjibjh. No new Worker or Supabase project; no destructive rewrites.
- Rollback: feature flag allows returning to previous board editor without dropping new or old data.
- "Looks like Concept C" cannot be declared based on source-code review or automated smoke tests alone.

## 9. Definition of done — end-to-end user journey
1. Open empty board. Add 6 blank items without any forced title.
2. Color and resize them, drag one over the moodboard, then type directly into two.
3. Connect A -> B -> C. Move B above A; resize all. All endpoints remain centered or bound to chosen ports.
4. Select multiple cards, use Auto tidy, undo, redo. Layout stays consistent.
5. Add images + notes + references and arrange them into a frame, without replacing freeform parts with a rigid flowchart.
6. Open a note in a generous inspector; edit long text, key points, task and source link.
7. Add same canonical note into another board; edit content in one, see changed content in other with independent position.
8. Save and hard refresh; geometry, connections, notes and camera all persist in Supabase.
9. Switch dark/light, scale 100% to 150%, and repeat key operations without clipping or tiny touch targets.
10. Compare actual screenshots to the Concept C reference; correct visible deviations before Phase 3.

## 10. Source references and constraints
- Approved Concept C image is retained in the chat and should be supplied to every future implementation session. An accompanying ZIP with the original image and this blueprint can be distributed when needed.
- Phase 1 design rules remain at docs/DESIGN_CONTRACT.md; Phase 2 gaps at docs/PHASE2_RELEASE_GATE.md.
- Tldraw bindings: https://tldraw.dev/sdk-features/bindings
- Tldraw licensing: https://tldraw.dev/community/license
- Excalidraw embeddable MIT package: https://github.com/excalidraw/excalidraw/tree/master/packages/excalidraw
- React Flow edge/handle architecture: https://reactflow.dev/learn/concepts/terms-and-definitions
