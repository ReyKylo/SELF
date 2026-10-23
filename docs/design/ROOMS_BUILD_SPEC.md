# SELF Rooms: complete build spec (for Sonnet / Haiku)

**What this is:** the full, prescriptive build plan for the Rooms redesign with its motion, tactile feel and drag-and-drop layer. It extends [`ROOMS_REDESIGN_BLUEPRINT.md`](./ROOMS_REDESIGN_BLUEPRINT.md), which holds the route map and the reasoning. If the two disagree, **this file wins.**
**Visual reference:** `design/concepts/rooms.html` (structure). Phase P0 below builds a hi-fi prototype first, so the motion can be signed off before production code.
**Base:** `main` at `c8b3f1a` or later. Re-check every line reference against the latest `main` before editing; line numbers drift.
**Author's intent:** calm by default and lively on touch. Every interaction answers within 100 ms, motion explains where things went, and decoration never slows work.

---

## Build status (updated as phases land)

| Phase | State | Notes |
|---|---|---|
| R0 contract | **Done** | `docs/DESIGN_CONTRACT.md` has a Rooms shell section; the user approved the direction and said to build |
| R1 shell and routing | **Done** | `rooms.js`, `rooms.css`; `chrome()`, `go()` in `app.js`. Rollback: `?shell=classic`. Deviations: the phone breakpoint is 600px (the app's existing one, not 700px); Hunt and Study both use Career's own rail until R3 splits it, so the Career pages are unchanged |
| M1 motion and feel | **Done, minus three items** | press, ripple, room entrance (once per navigation), aurora, tint glide, indicator slide, toast spring, burst on Done and Offer, count-up on Home, circular theme reveal, reduced motion. Not yet: Undo progress line on toasts, the save-tick drawing, click sounds |
| D1 drag and drop | **Done for the board and Applications** | `self-dnd.js` (pointer, touch grip or long-press, keyboard). Not yet: calendar week view and Three for today (their adapters, `due` and `three`, belong to the phases that add those screens) |
| R2 Today | **Done** | `today.js`: Three for today (pins per device and day, drag or keyboard reorder, swap), agenda merge (tasks, interviews, follow-ups; Career data is opt-in via a button), one-at-a-time inbox triage (Make task, File to Space, Keep, Delete with a 5 s Undo window, swipe). Quick Capture keeps its mode chips until R4; the Focus button waits for R5, so rows open the task sheet. "My Priorities" is replaced by Three for today in Rooms and is unchanged in the classic shell |
| R3 Hunt and Study | Not started | |
| R4 palette and capture grammar | Not started | `Ctrl K` still opens Search |
| R5 Focus mode | Not started | |
| R6 polish and QA | Partly | browser tests cover shell, drag, 390px; screenshots under `docs/rooms-review/` are still to do |

**Where the code differs from the sketches below:** `self-dnd.js` is the source of truth. It sets the landed marker *before* the save starts, because the save re-renders the page (the sketch set it after), and it only celebrates a landing when the card is back in the target column after the render (a failed save re-renders the card home). Task order is now deterministic: `taskOrder` in `app.js` breaks due-date ties on `created_at` then `id`, because the API returns rows unordered.

## 0. How to use this document

### Rules for the building model (put these at the top of every session)
1. Read `AGENTS.md`, `.agents/skills/gpt-chat-maximize/SKILL.md`, `docs/DESIGN_CONTRACT.md`, the blueprint and this spec **before** writing anything.
2. Do **one phase per branch and PR**, in the order of §9. Start each phase from the latest `main`.
3. **Never** touch `supabase/**`, add a table or column, or write to the production database. Tests use the Playwright fixture pattern in `tests/browser_career_learning.cjs`, which intercepts Supabase.
4. Shared files (`app.js`, `index.html`, `career*.js`, `styles.css`, CI and build) are locked by `AGENTS.md`. The user must say in the PR thread or chat that the phase is authorized. Phase P0 touches only `design/`, so it is always safe.
5. Run **every** command in the README "Checks" section before pushing, plus the phase's own tests. Paste the real output into the PR.
6. If this spec is ambiguous, pick the option that changes less existing behaviour and write the decision in the PR body. Don't invent data, counts or features.
7. Use only `transform`, `opacity`, `clip-path` and `filter` for motion. Never animate `width`, `height`, `top` or `left` in a loop.

### Which model for which phase
| Phase | Best fit | Why |
|---|---|---|
| P0 hi-fi prototype | Sonnet | Lots of interaction logic in one file |
| R0 contract | Haiku | Docs only |
| R1 shell and routing | Sonnet | Touches `chrome()`, `go()` and the event delegation |
| M1 motion and feel kit | Haiku | Mostly CSS and small pure functions, all specified here |
| D1 drag-and-drop engine | Sonnet | Pointer, keyboard and async commit; the reference code is in §6 |
| R2 Today | Sonnet | Data merging and triage |
| R3 Hunt and Study | Sonnet | Changes to the Career module |
| R4 palette and capture grammar | Sonnet (parser), Haiku (fixtures) | |
| R5 Focus mode | Haiku | Reuses existing save paths |
| R6 polish and QA | Haiku | Checklist-driven |

---

## 1. Facts the build depends on (verified in the repo)

| Fact | Where | Consequence |
|---|---|---|
| The My Work Kanban uses native HTML5 drag events | `app.js` `workDragStart/Over/Drop/End` (about lines 118–139); listeners about lines 320–323 | Doesn't work on touch, and the dragged card can't be styled. D1 replaces these listeners. |
| A task status change persists through `moveTaskStatus(id,target,{undo})` | `app.js` about line 104; Undo via `state.lastTaskMove` and `data-action="undo-stage"` (about line 266) | D1 **reuses** it. Don't write a second save path. |
| The Applications Kanban also uses HTML5 drag | `career-phase2.js` `init()` (about line 440) and the `data-career2-drag` markup (about line 56) | Same replacement |
| An application stage change persists through `setStage(id,value,{undo})` | `career-phase2.js` about line 287; Undo via `C.lastMove` | D1 reuses it, through a small export added to `window.SELFCareerPhase2` |
| **`tasks` and `career_applications` have no sort-order column** | migrations `20261020172006…`, `20261021135000…` | Drag-and-drop can change **status, stage or due date**, never the position inside a column. The card must land where the sort will put it (§6.4). |
| `task_checklist.position` exists | Phase 1 migration, line 33 | Checklist reordering *could* persist later; out of scope here |
| My Work sorts by `due_date` ascending | `app.js` `filteredTasks()` about line 98 | The landing index uses the same comparator. Extract it as `taskOrder(a,b)`. |
| The phase 1 tables (inbox, tasks…) allow owner `update` under RLS | Phase 1 migration, lines 91–95 | Inbox triage and calendar rescheduling need no migration |
| A global reduced-motion rule already exists | `styles.css` (end of file) | Keep it. New motion must also check `matchMedia` in JS before WAAPI calls. |
| Tests assert on markup strings `sidebar`, `career-workspace`, `CAREER STUDIO` | `tests/smoke_render.cjs` | Keep those strings truthful (§4.1, R3) |

---

## 2. Design tokens

Put these in a new **`rooms.css`** (loaded after `styles.css`). Dark is the default, as in today's SELF; light values sit under `body[data-theme='light']`, the app's existing theme switch.

```css
/* ---------- Room colours (reuse SELF's COLORS palette) ---------- */
@property --tint { syntax: '<color>'; inherits: true; initial-value: #428cff; }
:root{
  --today:#428cff; --work:#3fc5d2; --hunt:#3dce9e; --study:#ad92fa; --studio:#f0b862; --alert:#f68e94;
  --tint:var(--today);                 /* set per room on .shell via data-room */
  --tint-soft:color-mix(in srgb,var(--tint) 16%,transparent);
  --tint-line:color-mix(in srgb,var(--tint) 45%,transparent);

  /* ---------- Type ---------- */
  --font-display:'Bricolage Grotesque','DM Sans',system-ui,sans-serif; /* room titles, Focus title, big numbers ONLY */
  --t-room:clamp(2.4em,5.2vw,4.2em);  /* room title */
  --t-h2:1.3em; --t-body:1em; --t-small:.82em; --t-micro:.7em;

  /* ---------- Shape ---------- */
  --r-room:22px; --r-card:16px; --r-item:12px; --r-pill:999px;

  /* ---------- Elevation ---------- */
  --e-1:0 1px 2px #0003, 0 4px 14px #0002;
  --e-2:0 6px 18px #0004, 0 18px 48px #0003;          /* hover */
  --e-lift:0 18px 40px #0006, 0 2px 0 #fff1 inset;     /* dragged card */

  /* ---------- Motion ---------- */
  --d-instant:90ms; --d-quick:140ms; --d-base:220ms; --d-slow:360ms; --d-room:420ms;
  --ease-out:cubic-bezier(.2,.8,.2,1);       /* default for anything entering */
  --ease-in:cubic-bezier(.4,0,1,1);          /* leaving */
  --ease-spring:cubic-bezier(.34,1.56,.64,1);/* release, landing, pop */
  --press-scale:.96; --hover-lift:-2px;
  transition:--tint var(--d-room) var(--ease-out);
}
body[data-theme='light']{
  --today:#2369e0; --work:#0f8e9b; --hunt:#16855f; --study:#7552c8; --studio:#a8650c; --alert:#c3484f;
  --e-1:0 1px 2px #1a2b4514, 0 4px 14px #1a2b4510;
  --e-2:0 6px 18px #1a2b451c, 0 18px 48px #1a2b4514;
  --e-lift:0 18px 40px #1a2b4530;
}
.shell[data-room="today"]{--tint:var(--today)} .shell[data-room="work"]{--tint:var(--work)}
.shell[data-room="hunt"]{--tint:var(--hunt)}   .shell[data-room="study"]{--tint:var(--study)}
.shell[data-room="studio"]{--tint:var(--studio)}
```

**Font loading.** Add `Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800` to the existing Google Fonts link in `index.html`. Body text stays Inter / DM Sans.

**Colour rules**
- The tint appears in exactly four places: the active door, the room-title period (`Today.`), the aurora wash at the top of `.main`, and primary buttons inside the room. Nowhere else.
- Status and priority badges keep their existing semantic colours (`.badge.blue/green/...`); they are **not** tinted.
- Contrast: body text ≥ 4.5:1 and controls ≥ 3:1 in both themes. Record the measured ratios in the R6 PR.

---

## 3. Motion and feel system ("clicky")

Everything here lives in **`motion.css`** and **`motion.js`** (`window.SELFMotion`), built in Phase M1. Other phases only *call* these helpers.

### 3.1 Press feedback (every button, door, pill, card)
```css
.btn,.primary-btn,.ghost-btn,.soft-btn,.icon-btn,.door,.pill,.chip-btn,.kanban-task,.room-card[role=button]{
  transition:transform var(--d-quick) var(--ease-spring), box-shadow var(--d-base) var(--ease-out),
             background-color var(--d-quick) linear, border-color var(--d-quick) linear;
  -webkit-tap-highlight-color:transparent;
}
@media (hover:hover){
  .room-card[role=button]:hover,.kanban-task:hover{transform:translateY(var(--hover-lift));box-shadow:var(--e-2)}
}
.btn:active,.primary-btn:active,.ghost-btn:active,.soft-btn:active,.icon-btn:active,
.door:active,.pill:active,.chip-btn:active{transform:scale(var(--press-scale));transition-duration:var(--d-instant)}
```
The press shrinks in 90 ms and springs back on release with `--ease-spring`. That asymmetry is what makes it feel "clicky".

### 3.2 Ripple (primary buttons and doors only)
```js
// motion.js
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function ripple(e){
  const host=e.target.closest('.primary-btn,.door');if(!host||reduced())return;
  const r=host.getBoundingClientRect(),d=Math.max(r.width,r.height)*2;
  const s=document.createElement('span');s.className='ripple';
  s.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;
  host.appendChild(s);
  s.animate([{transform:'scale(0)',opacity:.35},{transform:'scale(1)',opacity:0}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>s.remove();
}
document.addEventListener('pointerdown',ripple,{passive:true});
```
```css
.primary-btn,.door{position:relative;overflow:hidden;isolation:isolate}
.ripple{position:absolute;border-radius:50%;background:currentColor;pointer-events:none;z-index:-1}
```

### 3.3 Staggered entrance (room switch and first paint)
- Every direct child block of a room that should animate gets `class="rise" style="--i:N"`, with N = 0,1,2… in reading order. Cap N at 8 and give later items 8.
```css
.rise{animation:rise var(--d-slow) var(--ease-out) both;animation-delay:calc(var(--i,0)*45ms)}
@keyframes rise{from{opacity:.001;transform:translateY(14px) scale(.99)}to{opacity:1;transform:none}}
```
- **Only** on a room change or a sub-tab change. Data refreshes (save, poll, re-render after a mutation) must **not** replay it. Implement this with a `state.animateNext=true` flag that `go()` and the room or tab actions set. `render()` adds `data-enter="1"` on `.room-body` only when the flag is set, then clears it. The CSS selector is `.room-body[data-enter="1"] .rise`.

### 3.4 Room transition
1. The door rail indicator slides to the new door (§4.1) over `--d-room` with `--ease-spring`.
2. `--tint` transitions to the new room colour (registered `@property`, so it animates smoothly).
3. The content uses the staggered entrance (3.3). The direction follows the door order: moving down the rail enters from `translateY(14px)`, moving up from `translateY(-14px)`. Set `--dir:1` or `--dir:-1` on `.room-body` and use `translateY(calc(14px*var(--dir)))`.
4. No exit animation. Swapping instantly and then animating in feels faster.

### 3.5 Aurora (ambient beauty, cheap)
```css
.main{position:relative}
.main::before{content:"";position:absolute;inset:0 0 auto 0;height:420px;pointer-events:none;z-index:0;
  background:radial-gradient(60% 100% at 75% -10%,var(--tint-soft),transparent 70%),
             radial-gradient(40% 80% at 15% -20%,color-mix(in srgb,var(--tint) 9%,transparent),transparent 70%);
  animation:aurora 24s ease-in-out infinite alternate}
@keyframes aurora{to{transform:translate3d(-3%,2%,0) scale(1.05)}}
.main>*{position:relative;z-index:1}
```
In light theme, halve the colour-mix percentages. Reduced motion: `animation:none`.

### 3.6 Save-state pill (the "✓ Saved" in the top bar)
States: `idle` (✓ Saved), `saving` (spinner and "Saving…"), `error` (red dot and "Not saved · Retry"). The existing `paintSave()` decides the state; this phase only changes the look.
- On `saving` → `idle`, the check mark draws itself: an SVG path with `stroke-dasharray:24; stroke-dashoffset:24`, animated to 0 over 300 ms with `--ease-out`, while the pill scales 1 → 1.06 → 1.
- Never show "Saved" when the request failed (contract rule: no false Saved signals).

### 3.7 Toasts with Undo
- They stack bottom-right on desktop and bottom-centre above the door bar on phone, at most 3 visible.
- Enter: `translateY(16px) scale(.96)` → `none` over `--d-base` with `--ease-spring`. Leave: opacity to 0 and `translateY(8px)` over `--d-quick`.
- A move toast shows an **Undo** button and a 5 s progress line along its bottom edge (`scaleX(1→0)`, linear). Undo calls the existing undo action (`undo-stage` for tasks, Career's `C.lastMove` path for applications).
- Error toasts don't auto-dismiss.
- `role="status"` for success, `role="alert"` for errors.

### 3.8 Celebration burst (restrained)
```js
function burst(x,y,{count=14,color='var(--tint)'}={}){
  if(reduced())return;
  for(let i=0;i<count;i++){
    const p=document.createElement('i');p.className='spark';
    p.style.cssText=`left:${x}px;top:${y}px;background:${color}`;
    document.body.appendChild(p);
    const a=(Math.PI*2*i)/count+Math.random()*.4,dist=36+Math.random()*34;
    p.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},
               {transform:`translate(calc(-50% + ${Math.cos(a)*dist}px),calc(-50% + ${Math.sin(a)*dist}px)) scale(.2)`,opacity:0}],
              {duration:560+Math.random()*200,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>p.remove();
  }
}
```
```css
.spark{position:fixed;width:7px;height:7px;border-radius:2px;pointer-events:none;z-index:60}
```
**Use it only for:** a task moved to Done or ticked complete; an application moved to **Offer** (use `count:22`); the last inbox item triaged ("Inbox zero"); the last checklist item of a sprint day. At most one burst per user action. It starts from the centre of the element that changed.

### 3.9 Count-up and bump
- KPI numbers on room entry count from 0 to the value over 600 ms with ease-out, using `requestAnimationFrame` and `font-variant-numeric:tabular-nums`. They only run when the value is known; never animate a placeholder.
- When a column count changes after a drop, the badge "bumps": `scale(1)→1.25→1` over 260 ms with `--ease-spring`.

### 3.10 FLIP helper (things that move after a re-render)
```js
function flip(selector,mutate){
  const before=new Map();document.querySelectorAll(selector).forEach(el=>before.set(el.dataset.flipKey,el.getBoundingClientRect()));
  mutate();
  if(reduced())return;
  document.querySelectorAll(selector).forEach(el=>{
    const b=before.get(el.dataset.flipKey);if(!b)return;const a=el.getBoundingClientRect();
    const dx=b.left-a.left,dy=b.top-a.top;if(!dx&&!dy)return;
    el.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:300,easing:'cubic-bezier(.2,.8,.2,1)'});
  });
}
```
Elements that should glide carry `data-flip-key="<stable id>"`.

### 3.11 Theme switch with circular reveal
```js
function switchTheme(next,origin){ // origin = the click event
  const apply=()=>{setTheme(next);render()};
  if(!document.startViewTransition||reduced()){apply();return}
  const x=origin?.clientX??innerWidth-40,y=origin?.clientY??40,r=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
  document.startViewTransition(apply).ready.then(()=>document.documentElement.animate(
    {clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${r}px at ${x}px ${y}px)`]},
    {duration:520,easing:'cubic-bezier(.4,0,.2,1)',pseudoElement:'::view-transition-new(root)'}));
}
```
```css
::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}
```
Wire it into the existing `action==='theme'` branch in `handleAction`. Keep the `savePref()` call.

### 3.12 Optional click sound (off by default)
- Add a toggle in Settings › Appearance: "Click sounds". Store it in `localStorage['self.sound']` as `'on'` or `'off'`, defaulting to off.
- When on, play a 22 ms tick through WebAudio on door press, drop and checkbox tick: a sine wave at 1700 Hz, gain 0.025, with an exponential decay. Create the `AudioContext` lazily on the first user gesture, never at load.

### 3.13 Reduced motion contract
When `prefers-reduced-motion: reduce` is set:
- no ripple, burst, aurora drift, stagger, tilt or circular reveal;
- drag still works, with the ghost following the pointer but no rotation or scale;
- the room tint changes instantly.
Test this explicitly (R6).

---

## 4. Shell

### 4.1 Door rail (desktop ≥ 701px)
```
┌──────────┬──────────────────────────────────────────────────────────┐
│   ✳      │  [⌕ Jump, find or create…      Ctrl K]   ✓ Saved  [+ New]│
│          │                                                          │
│ ▌☀ Today │  Today.                                                  │
│   4 due  │  Choose three. Clear the inbox. See what's coming.       │
│          │                                                          │
│  ▤ Work  │  …room body…                                             │
│ 11 open  │                                                          │
│  ◎ Hunt  │                                                          │
│ 2 intvw  │                                                          │
│  🎓 Study │                                                          │
│  ◫ Studio│                                                          │
│          │                                                          │
│   ◐  ⚙   │                                                          │
└──────────┴──────────────────────────────────────────────────────────┘
```
- Rail width 104px (78px at ≤ 960px with labels hidden). It keeps `class="sidebar"` and `aria-label="SELF navigation"`.
- **Door:** a button at least 72px tall and 84px wide with a 24px icon, a 0.8em/700 label and a 0.66em mono badge. Markup: `<button class="door" data-action="room" data-room="hunt" aria-current="page|false" style="--c:var(--hunt)">`.
- **Sliding indicator:** a single `<span class="rail-ind">` absolutely positioned inside the rail: a 4px × 40px bar on the left edge plus a 16px-radius tinted background the size of a door. After each render, read the active door's `offsetTop` and set `transform:translateY(...)`; `transition:transform var(--d-room) var(--ease-spring)`. On the first paint, set it without a transition (add a `no-anim` class for one frame).
- **Hover** (pointer devices only): the icon lifts 2px and the label turns `--text`.
- **Badges** come only from loaded data (blueprint R1). Unknown means no badge. A badge that changes value uses the bump animation (3.9).
- **Footer:** theme toggle (3.11) and Settings (routes to `settings`). The profile avatar opens Settings.
- **Keyboard:** `Alt+1…5` switches rooms. Doors form a roving-tabindex group: arrow keys move focus between doors, Enter or Space activates.
- **Collapsed rail:** keep the existing `state.sidebarCollapsed` toggle, which hides labels and badges.

### 4.2 Door bar (phone ≤ 700px)
- It is fixed to the bottom with five equal doors (icon and label, no badge text, but a 6px dot when the badge is non-zero). Height is 58px plus `env(safe-area-inset-bottom)`.
- The indicator is a 3px bar along the top edge that slides on X.
- The top bar shows the ⌕ search button, the save pill and `+`. Settings moves into the ⌕ palette ("Settings") and the avatar.
- The body gets `padding-bottom: calc(80px + env(safe-area-inset-bottom))`.

### 4.3 Top bar
- Sticky at the top with a `backdrop-filter: blur(16px)` background at 88% `--bg`.
- Left: the palette trigger (§5.7). It looks like a search field 520px wide (100% on phone), with `Ctrl K` shown on desktop and hidden on phone.
- Right: the save pill (3.6), then **+ New**, a primary button tinted with the room colour. It opens the palette pre-filled for creating.
- Remove the breadcrumb ("SELF › Home"); the room title replaces it.

### 4.4 Room header (every room)
```html
<header class="room-head rise" style="--i:0">
  <h1 class="room-title">Hunt<span class="dot">.</span></h1>
  <p class="room-lede">Your pipeline, people and companies.</p>
</header>
<nav class="subnav rise" style="--i:1" aria-label="Hunt sections">…pills…</nav>
```
- `.room-title`: `--font-display`, weight 800, `--t-room`, `letter-spacing:-.035em`, `line-height:.92`. `.dot` takes `color:var(--tint)`.
- **Sub-nav pills** get a sliding background thumb, using the same technique as the rail indicator: one `<span class="subnav-thumb">` sized and positioned to the active pill with `transition: transform, width var(--d-base) var(--ease-spring)`. Use `aria-current="page"` on the active pill.

---

## 5. Screens

Each screen lists its layout, data sources, components, interactions, motion and empty state. "Existing" means an existing function or action to reuse, not rewrite.

### 5.1 Today (`view:'home'`)

**Desktop (≥ 1100px)**
```
Today.                         Choose three. Clear the inbox. See what's coming.
┌─ capture ───────────────────────────────────────────────────────────────────┐
│ ✎  Kirim CV ke Dimas besok #Career !high                              [ ↵ ] │
│    [Task] [Space: Career] [Priority: high] [Due: Sab 24 Okt]                 │
└──────────────────────────────────────────────────────────────────────────────┘
┌─ Three for today ─────────────────────────┐ ┌─ Agenda ──────────────────────┐
│ ◔ 1/3 done                                │ │ 09:00 ● Aruna debt schedule    │
│ ┌──────────────────────────────────────┐  │ │ ──── now 14:02 ─────────────── │
│ │ 1  Aruna Supply · debt schedule  ⋮⋮  │  │ │ 15:30 ● Case interview (Hunt)  │
│ │    Career Prep · 1/3 ▓▓░░  [Focus]   │  │ │   —   ● Follow up Sari · 19d   │
│ └──────────────────────────────────────┘  │ └────────────────────────────────┘
│ 2 …                                       │ ┌─ Inbox · 3 to sort ────────────┐
│ 3 …                                       │ │ ╭ card ╮  ← Delete · Task →    │
│ + 8 more open today → Work                │ │ [Make task][File][Keep][Delete]│
└───────────────────────────────────────────┘ └────────────────────────────────┘
```
Phone: capture, then Three, then Agenda, then Inbox, in one column.

**Components**
1. **Capture bar.** One input with live chips from `parseCapture` (R4; until then use the existing mode chips). Chips enter one by one with `scale(.8)→1` and `--ease-spring`, 30 ms apart. Enter saves through the existing `insert` paths (same as `quickCapture()`). On success the input clears and a small "Filed to Inbox" or "Task created" toast appears. Typing `/` anywhere (outside an input) focuses it.
2. **Three for today.**
   - Candidates: open tasks sorted by the existing `priorityRank()`.
   - Pins: `localStorage['self.today.'+userId+'.'+YYYY-MM-DD']` = an array of up to three task ids, read and written in try/catch.
   - Each row: a big number (display font, tinted), the title, Space and status, a checklist mini bar (`state.checklist` for the task), a **Focus** button and a grip `⋮⋮`.
   - **Drag to reorder** within the three, using the D1 engine with zone type `three`. This order *is* persisted (localStorage), so the placeholder follows the pointer index.
   - **Swap:** a `⇄` icon opens a popover with the next 5 candidates; choosing one replaces the row with a FLIP animation.
   - Ticking the checkbox completes the task through the existing toggle action, fires a burst, then the row collapses (height animation is allowed here once: use `grid-template-rows:1fr→0fr` over 260 ms) and the next candidate rises in.
   - Progress ring at top-left: an SVG circle of r=14 whose `stroke-dashoffset` animates over 400 ms when the count changes.
3. **Agenda.** Built from the merge rules in blueprint R2: due and overdue tasks, interviews in the next 7 days, follow-ups.
   - Each row: mono time, a coloured dot (overdue `--alert`, tasks `--today`, interviews and people `--hunt`) and a title plus subtitle. The row opens its source (task sheet, or the Hunt interview or person).
   - A **now line** is a 1px tinted rule with a 6px dot. It sits between the items before and after the current WIB time, and a slow pulse (2.4 s) runs on the dot.
   - If Career data isn't loaded, show a row with a "Load Career agenda" button.
4. **Inbox triage.**
   - A stack of up to 3 cards (top card at full size; behind it `translateY(8px) scale(.97)` at 60% opacity and `translateY(16px) scale(.94)` at 30% opacity).
   - **Swipe** (pointer drag on the top card, horizontal only, with `touch-action:pan-y`): the card follows with `rotate(dx/18 deg)`. Once dx passes 40px, a label fades in: "TASK →" on the right in green, "← DELETE" on the left in red. Releasing beyond 110px flies the card off (`translateX(±120vw) rotate(±18deg)`, 280 ms, `--ease-in`) and runs the action; anything less springs back.
   - **Buttons** do the same as swiping, for keyboard and accessibility: Make task / File to Space / Keep / Delete. Actions and failure handling follow blueprint R2.
   - **Undo:** the Delete toast gets Undo. Delete is only sent after the toast expires (5 s), or undo re-inserts? **Decision: delay the delete request until the toast expires**, and cancel it on Undo. This is the safest choice; document it.
   - Inbox zero: a burst plus the empty state "Inbox clear. Ctrl K captures from anywhere."

**Empty state for the whole day:** "Nothing scheduled. Pick three from Work." with a button to Work. Never invent rows.

### 5.2 Work (`view:'work'|'spaces'|'space'|'links'`)
Sub-nav: **Tasks · Spaces · Links · Inbox**.

**Tasks.** Keep the existing filters (search, Space, status) as a single toolbar row. The view switch List / Board / Calendar is a segmented control with a sliding thumb.

- **Board (the hero of this room)**
```
┌ To Do  3 ┐┌ Planning 2┐┌ In Progress 2┐┌ Review 1 ┐┌ Done 4  ┐
│┌────────┐││┌─────────┐││┌────────────┐││┌────────┐││┌───────┐│
││Title ⋮⋮│││          │││            │││         │││        ││
││Space·Due│││          │││            │││         │││        ││
││▓▓░ 1/3 ││└─────────┘│└────────────┘│└────────┘│└───────┘│
│└────────┘│                                                  │
└──────────┘  columns: 5 × minmax(240px,1fr), horizontal scroll with snap on phone
```
  - Card: title (2 lines max with clamp), Space chip, due badge (`dueBadge()`, existing), priority dot, checklist mini bar, a `⋮⋮` grip in the top-right, and the **native status `<select>` kept** but visually reduced to a small chip-select (keyboard and screen-reader fallback, as today).
  - Columns: header with label and a count badge that bumps; while a drag hovers, the column gets `background:var(--tint-soft)`, `outline:2px dashed var(--tint-line)` and a soft glow.
  - Drag-and-drop through D1 with zone type `status`. **The landing slot is computed with `taskOrder`** (§6.4), so the gap opens exactly where the card will live after saving.
  - Dropping into **Done** fires a burst and strikes through the title with an animation (`background-size` 0→100% of a 2px line, 240 ms).
  - Undo toast: "Moved to Review · Undo" (existing `undo-stage`).
  - Phone: columns are `scroll-snap-type:x mandatory` at 86vw each; drag starts only from the grip (touch). When dragging near the left or right edge (48px), the board auto-scrolls.
- **List.** The existing table. Ticking a row's checkbox plays the check pop: the box scales to 1.2 and back with `--ease-spring`, and the title strike draws in.
- **Calendar (upgrade).** A **week view**: 7 day columns (Mon–Sun) plus an "Unscheduled" tray on the left, with week navigation `‹ This week ›`.
  - Drag a task chip between days with D1 zone type `due`. Saving calls `patch('tasks',id,{due_date})` through `mutate`, with Undo. Dropping on the tray clears `due_date` (sets null).
  - Today's column is tinted; overdue chips show a red left edge.

**Spaces.** The existing tiles get a pointer tilt on hover (desktop only): `rotateX/rotateY` of ±4° from the pointer position, a 160 ms transition, `perspective:800px`. Opening a Space keeps the existing `renderSpace()`.

**Links.** The existing link grid. The filter chips (All, plus one per Space) use the sliding-thumb control. Cards lift on hover.

**Inbox.** The existing `renderInbox()` list (history), plus per-row triage buttons that reuse 5.1's actions.

### 5.3 Hunt (`view:'career'`, pages other than `learning`)
Sub-nav: **Pipeline · People · Companies · Radar · Interviews · Kit**.

- **Pipeline** (`overview` and `applications` merged)
  - A KPI strip of 5 tiles (Wishlist, Applied, Interviewing, Offer, Closed) with count-up numbers. Under each tile from Applied to Offer, show the conversion "57% of wishlist", but only when the previous count is above 0. These are computed live from `ui.applications`.
  - Kanban with 5 lanes and D1 zone type `stage`, committing through `setStage()` (existing). Moving to **Offer** fires `burst({count:22})`. The KPIs update and bump after the save.
  - Card: role title, company name, applied date or age, "CV v3" chip if linked, and the grip.
  - Side panel "Needs a touch": the follow-up rule from blueprint R2. Each row: avatar initials, name, next step, and a days pill coloured green (≤14), amber (15–30) or red (>30). The **Log touch** button opens the existing touchpoint form.
- **People.** Cards in a responsive grid (`minmax(260px,1fr)`): avatar, name, role @ company, stage chip, days-since ring (an SVG arc whose fill is days/60, capped), and a quick action. Clicking opens the existing record drawer.
- **Companies.** The existing list, styled as rows with counts of applications and people.
- **Radar.** The existing on-demand scan. Each result card shows a **relevance ring** (an SVG arc animating to `relevance_score` over 600 ms) and the `score_reason` text. Save and Dismiss buttons: Dismiss collapses the card with an animation. Keep the "estimated relevance" wording and the source link; never call it a recommendation.
- **Interviews.** Upcoming cards with a live countdown ("in 1 h 28 m", updated every 30 s while visible) and a prep progress bar. Past interviews show a "Write reflection" call to action.
- **Kit.** Three tabs (CVs · Templates · Reminders) rendering the existing views. Template **Copy** button: copies via `navigator.clipboard`, and the icon morphs to ✓ for 1.2 s.
- Keep `class="career-workspace"` and a visually hidden `<h2>CAREER STUDIO</h2>` (test contract).

### 5.4 Study (`view:'career'`, page `learning`)
Sub-nav: **Build · Learn · Get challenged**, mapping onto the existing `TABS` ids (blueprint §3).

- **Sprint path** (top of Build)
  - Three stops in a row (stacked on phone), joined by an SVG path that draws itself on room entry (`stroke-dashoffset` from its length to 0, 900 ms).
  - Stop content comes from `content/career-learning.json` `sprints[]`: `day`, `title`, `summary`, `output`.
  - Progress comes from the canonical sprint Task's checklist where that Task exists; otherwise show "Not started" with no bar.
  - The current stop (the first one that isn't complete) gets a pulsing tinted ring (2.4 s).
- **Build:** Sprint detail (existing sprint renderer) and lab cards (PE projection, PE sensitivity, VC waterfall, Consulting bridge), each with a tiny static preview drawn from the lab's existing default inputs. They open the existing labs.
- **Learn:** Masterclass, Evidence (12 panels, e.g. "VC01 · Bessemer Venture Partners · Shopify: nilai kualitas pertumbuhan"), YouTube (9 videos; still load only on Play) and Sources (41). Track filter chips (Semua / PE / VC / Consulting) use a sliding thumb, and the cards reflow with FLIP.
- **Get challenged:** Work Sample (existing, blind briefs) and Director Review (existing), with a 5-step progress rail across the top. "Next challenge" slides the prompt in from the right (`translateX(24px)→0`). The **"Session only · not saved"** badge stays visible at all times.

### 5.5 Studio (`view:'boards'|'board-editor'`)
- The board library uses the existing `SELFBoards.renderLibrary()`, wrapped in the room header. Each tile gets a hover state where its connector lines animate (`stroke-dasharray` marching, 1.2 s). This is only possible if the library renders an SVG thumbnail; otherwise skip it and **don't fake thumbnails**.
- Opening a board keeps the Concept D editor unchanged. While in `board-editor`, the rail collapses to 64px icons-only so the canvas gets the space, and the top bar hides. Esc or the back button returns to the library.

### 5.6 Focus mode (any task)
```
┌──────────────────────────────────────────────┬──────────────────────┐
│ FOCUS · Career Prep · Esc to leave           │  TIMER · this device  │
│                                              │        ╭───╮          │
│ Aruna Supply · debt schedule tab             │       │25:00│         │
│ [Planning] [High] [Today]                    │        ╰───╯          │
│ ☑ Senior term loan                           │  [Start] [Reset]      │
│ ☐ Revolver draw                              │  NEXT UP              │
│ ☐ Covenant test                              │  ▸ Case interview prep│
│ ┌ notes ─────────────────────────────────┐   │  ▸ Analisa DSSA       │
│ └────────────────────────────────────────┘   │  [Open full details]  │
└──────────────────────────────────────────────┴──────────────────────┘
```
- **Enter animation:** the overlay grows from the Focus button using `clip-path: circle(0 at x y)` → `circle(150% at x y)` over 420 ms with `--ease-out`. The content uses the staggered entrance.
- **Title:** display font at `clamp(2em,5vw,3.4em)`.
- **Inputs** reuse `data-task-field` and the checklist actions, so saving goes through the existing handlers (blueprint R5). A checklist tick fires a small burst (`count:8`).
- **Timer:** an SVG ring of r=88 with stroke 6 and a tinted progress arc, digits in the display font with tabular numbers. Start, Pause and Reset; it isn't persisted. At 00:00 the ring pulses 3 times (sound plays if enabled).
- **Leaving:** Esc or "Leave focus" reverses the clip-path (300 ms) and returns focus to the trigger.
- **Accessibility:** `role="dialog"`, `aria-modal="true"`, focus trap.

### 5.7 Command palette (Ctrl/⌘ K, or `/` outside inputs, or the top-bar field)
- **Open:** the backdrop fades in at 60% `--bg` with `blur(4px)`; the box goes `scale(.96) translateY(-8px)` → `none` over `--d-base` with `--ease-spring`.
- **Groups** (in this order, each with a mono header):
  1. **Create**: the parsed preview chips from `parseCapture`.
  2. **Go to**: the 5 rooms and their sub-sections.
  3. **Tasks**, **People**, **Boards**, **Links**: fuzzy matches from loaded state.
  4. **Actions**: switch theme, text size, sign out (with confirmation).
- **Fuzzy matching:** a lowercase subsequence match, scored by contiguous runs; show at most 6 per group and 30 in total. Highlight the matched characters with `<mark>`.
- **Keyboard:** ↑/↓ moves (the active row gets a tinted left bar that slides with a FLIP thumb), Enter runs, Esc closes and restores focus. ARIA: `role="combobox"` input, `role="listbox"` results, `aria-activedescendant`.

### 5.8 Task detail sheet (existing `renderPanel`)
Its content and behaviour stay the same. Only the animation changes:
- Slide in with `translateX(32px)` and opacity 0 → `none` over 260 ms with `--ease-spring`; the backdrop fades.
- Adding a checklist item: the new row grows in (`grid-template-rows 0fr→1fr`, 200 ms) and the progress bar width transitions.
- Add a **Focus** button next to Close.

---

## 6. Drag-and-drop engine: `self-dnd.js` (Phase D1)

### 6.1 Requirements
- **Mouse:** press anywhere on a card; dragging starts after 6px of movement. A simple click still opens the card.
- **Touch and pen:** start only from the `[data-dnd-grip]` handle (so lists keep scrolling), or long-press the card for 350 ms (with a light `navigator.vibrate?.(8)`).
- **Keyboard:** focus a card and press **Space** to pick it up. ←/→ moves between zones, ↑/↓ moves within a zone (only for `three`), Space or Enter drops, Esc cancels. Every step is announced in an `aria-live="assertive"` region.
- **Visuals:**
  - The ghost is a clone of the card at `scale(1.04) rotate(-1.5deg)` with `box-shadow:var(--e-lift)`, following the pointer through `translate`.
  - The original card stays in the DOM as the **placeholder** (`opacity:.35`, dashed `--tint-line` outline, contents `visibility:hidden`) and moves to the landing slot. Siblings glide out of the way with FLIP.
  - The zone under the pointer is highlighted.
  - On drop, the ghost flies to the placeholder's position (220 ms, `--ease-spring`), then is removed. The card gets a `landed` pulse (scale 1→1.03→1 plus a tint glow for 400 ms).
- **Auto-scroll:** while the pointer is within 56px of the edge of the nearest `[data-dnd-scroll]` ancestor or the window, scroll at up to 18px per frame (proportional to depth).
- **Failure:** if the commit returns false or throws, the card FLIPs back to its origin zone and an error toast explains what happened. No optimistic success toast before the commit resolves.

### 6.2 Markup contract
```html
<section class="kanban-col" data-dnd-zone="status:review" aria-label="Review tasks">
  <header>Review <span class="count" data-count-for="status:review">1</span></header>
  <div class="kanban-items" data-dnd-list>
    <article class="kanban-task" tabindex="0" data-dnd-item="TASK_ID" data-dnd-type="task" data-flip-key="TASK_ID"
             aria-roledescription="Draggable task" aria-describedby="dnd-help">
      <button class="grip" data-dnd-grip aria-label="Drag handle">⋮⋮</button> …
    </article>
  </div>
</section>
<p id="dnd-help" class="sr-only">Press Space to pick up. Use arrow keys to move. Space to drop. Escape to cancel.</p>
<div id="dnd-live" class="sr-only" aria-live="assertive"></div>
```

### 6.3 Adapter API
```js
SELFDnd.register(zoneType,{
  accepts(itemEl,zoneEl){ return true },            // e.g. only data-dnd-type="task"
  landingIndex(itemEl,zoneEl){ return null },       // number = sorted slot; null = follow the pointer index
  async commit(id,fromValue,toValue,{index}){ return true }, // must return true on success
  label(value){ return value },                     // human name used in announcements
});
```
Adapters to build in D1 (and in R2/R3 for the later ones):

| zoneType | Where | `landingIndex` | `commit` |
|---|---|---|---|
| `status` | My Work board | by `taskOrder` (§6.4) | `moveTaskStatus(id,to)` (existing), then `return true/false` |
| `due` | My Work calendar week | by `taskOrder` | `mutate(()=>patch('tasks',id,{due_date:to==='none'?null:to}), 'Rescheduled')`, with Undo storing the old date |
| `stage` | Hunt pipeline | by `applicationOrder` (`updated_at` desc, as rendered today; verify in `renderApplications`) | `SELFCareerPhase2.setStage(id,to)`. Add `setStage` to the exported object; no other change to that file. |
| `three` | Today | `null` (pointer index, because this order is persisted) | write the reordered ids to the localStorage pin key |

### 6.4 The honest landing slot
Because tasks and applications have no stored order, the placeholder must go **where the card will appear after saving**:
```js
function sortedSlot(list, movingRecord, compare){ // list = records already in the target zone (excluding the mover)
  let i=0; while(i<list.length && compare(list[i],movingRecord)<=0) i++; return i;
}
```
- `taskOrder(a,b)` is extracted from `filteredTasks()`: `(a.due_date||'9999-99-99').localeCompare(b.due_date||'9999-99-99')`. Use it in **both** places so they can never drift.
- **Unit test:** for every fixture, the placeholder index equals the index the card has after `render()`.

### 6.5 Reference implementation (start from this; keep it under about 260 lines)
```js
/* self-dnd.js — pointer + keyboard drag engine for SELF. Zero dependencies. */
(function(){
'use strict';
const adapters=new Map();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let d=null, kbd=null, suppressClick=false, raf=0;

const $live=()=>document.getElementById('dnd-live');
const say=m=>{const l=$live();if(l){l.textContent='';setTimeout(()=>l.textContent=m,30)}};
const zoneOf=el=>el?.closest?.('[data-dnd-zone]');
const listOf=z=>z.querySelector('[data-dnd-list]')||z;
const parse=z=>{const [type,...rest]=z.dataset.dndZone.split(':');return {type,value:rest.join(':')}};
const items=z=>[...listOf(z).querySelectorAll(':scope>[data-dnd-item]')];
const adapterFor=z=>adapters.get(parse(z).type);

function register(type,adapter){adapters.set(type,adapter)}

function flipMove(nodes,mutate){
  const before=new Map(nodes.map(n=>[n,n.getBoundingClientRect()]));mutate();
  if(reduced())return;
  nodes.forEach(n=>{const b=before.get(n),a=n.getBoundingClientRect();const dx=b.left-a.left,dy=b.top-a.top;
    if(dx||dy)n.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'})});
}
function placeIn(zone,item,pointerY){
  const ad=adapterFor(zone);if(!ad?.accepts(item,zone))return false;
  const others=items(zone).filter(n=>n!==item);
  let idx=ad.landingIndex?.(item,zone);
  if(idx==null){idx=others.findIndex(n=>{const r=n.getBoundingClientRect();return pointerY<r.top+r.height/2});if(idx<0)idx=others.length}
  const ref=others[idx]||null;
  if(item.parentElement===listOf(zone)&&item.nextElementSibling===ref)return true;
  const affected=[...new Set([...others,...items(zoneOf(item)||zone)])].filter(n=>n!==item);
  flipMove(affected,()=>listOf(zone).insertBefore(item,ref));
  return true;
}

/* ---------- pointer ---------- */
function down(e){
  if(e.button>0||d||kbd)return;
  const item=e.target.closest?.('[data-dnd-item]');if(!item)return;
  const onGrip=!!e.target.closest('[data-dnd-grip]');
  if(!onGrip&&e.target.closest('button,a,input,select,textarea,label'))return;
  const touch=e.pointerType!=='mouse';
  d={item,id:item.dataset.dndItem,from:zoneOf(item),fromNext:item.nextElementSibling,x0:e.clientX,y0:e.clientY,
     pid:e.pointerId,started:false,touch,armed:!touch||onGrip,timer:0};
  if(touch&&!onGrip){d.timer=setTimeout(()=>{if(d&&!d.started){d.armed=true;navigator.vibrate?.(8);start(e)}},350)}
  addEventListener('pointermove',move,{passive:false});addEventListener('pointerup',up);addEventListener('pointercancel',cancel);
}
function start(e){
  const r=d.item.getBoundingClientRect(),g=d.item.cloneNode(true);
  g.classList.add('dnd-ghost');g.removeAttribute('id');g.setAttribute('aria-hidden','true');
  Object.assign(g.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
  document.body.appendChild(g);
  Object.assign(d,{ghost:g,ox:e.clientX-r.left,oy:e.clientY-r.top,started:true,px:e.clientX,py:e.clientY});
  d.item.classList.add('dnd-placeholder');document.documentElement.classList.add('dnd-active');
  if(!reduced())g.animate([{transform:'none'},{transform:'scale(1.04) rotate(-1.5deg)'}],{duration:160,easing:'cubic-bezier(.34,1.56,.64,1)',fill:'forwards'});
  say('Picked up '+(d.item.getAttribute('aria-label')||'item'));
  loop();
}
function move(e){
  if(!d||e.pointerId!==d.pid)return;
  if(!d.started){
    const dist=Math.hypot(e.clientX-d.x0,e.clientY-d.y0);
    if(d.touch&&!d.armed){if(dist>8){clearTimeout(d.timer);cleanup()}return} // user is scrolling
    if(dist<6)return;start(e);
  }
  e.preventDefault();d.px=e.clientX;d.py=e.clientY;
  d.ghost.style.translate=`${e.clientX-d.ox-parseFloat(d.ghost.style.left)}px ${e.clientY-d.oy-parseFloat(d.ghost.style.top)}px`;
  const z=zoneOf(document.elementFromPoint(e.clientX,e.clientY));
  if(z!==d.over){d.over?.classList.remove('dnd-over');d.over=z;
    if(z&&placeIn(z,d.item,e.clientY)){z.classList.add('dnd-over');say('Over '+(adapterFor(z).label?.(parse(z).value)||parse(z).value))}}
  else if(z&&adapterFor(z)?.landingIndex?.(d.item,z)==null)placeIn(z,d.item,e.clientY);
}
function loop(){ // auto-scroll near edges
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(function step(){
    if(!d?.started)return;
    const sc=d.over?.closest('[data-dnd-scroll]')||document.scrollingElement;const r=sc===document.scrollingElement?{left:0,right:innerWidth,top:0,bottom:innerHeight}:sc.getBoundingClientRect();
    const edge=56,sx=d.px<r.left+edge?-(r.left+edge-d.px):d.px>r.right-edge?d.px-(r.right-edge):0;
    const sy=d.py<r.top+edge?-(r.top+edge-d.py):d.py>r.bottom-edge?d.py-(r.bottom-edge):0;
    if(sx||sy)sc.scrollBy(Math.max(-18,Math.min(18,sx/3)),Math.max(-18,Math.min(18,sy/3)));
    raf=requestAnimationFrame(step);
  });
}
async function up(e){
  if(!d||e.pointerId!==d.pid)return;
  clearTimeout(d.timer);
  if(!d.started){cleanup();return}           // plain click: let it through
  suppressClick=true;
  const target=d.over&&adapterFor(d.over)?.accepts(d.item,d.over)?d.over:d.from;
  if(target===d.from&&zoneOf(d.item)!==d.from)listOf(d.from).insertBefore(d.item,d.fromNext?.isConnected?d.fromNext:null); // dropped outside or on a refusing zone: go home
  await settle(d.ghost,d.item);
  await finish(target);
}
function settle(g,item){
  const a=item.getBoundingClientRect(),gx=parseFloat(g.style.left),gy=parseFloat(g.style.top);
  if(reduced()){g.remove();return Promise.resolve()}
  return g.animate([{translate:g.style.translate||'0 0',transform:'scale(1.04) rotate(-1.5deg)'},
                    {translate:`${a.left-gx}px ${a.top-gy}px`,transform:'none'}],
                   {duration:220,easing:'cubic-bezier(.34,1.56,.64,1)',fill:'forwards'}).finished.then(()=>g.remove());
}
async function finish(target){
  const {item,id,from,fromNext}=d;const ad=adapterFor(target);const t=parse(target),f=parse(from);
  item.classList.remove('dnd-placeholder');document.documentElement.classList.remove('dnd-active');
  target.classList.remove('dnd-over');cleanup();
  if(target===from&&ad.landingIndex?.(item,target)!=null){say('Dropped. No change.');return}
  item.classList.add('is-saving');item.setAttribute('aria-busy','true');
  let ok=false;try{ok=await ad.commit(id,f.value,t.value,{index:items(target).indexOf(item)})}catch(err){ok=false}
  if(!ok&&item.isConnected){flipMove([...items(target),...items(from)],()=>listOf(from).insertBefore(item,fromNext?.isConnected?fromNext:null));
    item.classList.remove('is-saving');item.removeAttribute('aria-busy');say('Move failed. Returned to '+(ad.label?.(f.value)||f.value));return}
  pending={id,zone:target.dataset.dndZone};        // afterRender() applies the landed pulse
  say('Moved to '+(ad.label?.(t.value)||t.value));
}
function cancel(){if(d?.started){d.ghost?.remove();listOf(d.from).insertBefore(d.item,d.fromNext?.isConnected?d.fromNext:null);
  d.item.classList.remove('dnd-placeholder');document.documentElement.classList.remove('dnd-active');d.over?.classList.remove('dnd-over');say('Cancelled')}cleanup()}
function cleanup(){removeEventListener('pointermove',move);removeEventListener('pointerup',up);removeEventListener('pointercancel',cancel);cancelAnimationFrame(raf);d=null}

/* ---------- keyboard ---------- */
function key(e){
  const item=e.target.closest?.('[data-dnd-item]');
  if(!kbd){
    if(!item||e.key!==' '||(e.target!==item&&!e.target.closest('[data-dnd-grip]')))return; // Space on a select/button inside the card keeps its own meaning
    e.preventDefault();e.stopPropagation();
    kbd={item,from:zoneOf(item),fromNext:item.nextElementSibling};item.classList.add('dnd-kbd');
    say('Picked up. Arrow keys move, Space drops, Escape cancels.');return;
  }
  e.stopPropagation();
  const zones=[...document.querySelectorAll(`[data-dnd-zone^="${parse(kbd.from).type}:"]`)];
  const cur=zoneOf(kbd.item);let i=zones.indexOf(cur);
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();i=Math.max(0,Math.min(zones.length-1,i+(e.key==='ArrowRight'?1:-1)));
    placeIn(zones[i],kbd.item,Infinity);kbd.item.focus();const ad=adapterFor(zones[i]);
    say((ad.label?.(parse(zones[i]).value)||parse(zones[i]).value)+', position '+(items(zones[i]).indexOf(kbd.item)+1)+' of '+items(zones[i]).length)}
  else if((e.key==='ArrowUp'||e.key==='ArrowDown')&&adapterFor(cur).landingIndex?.(kbd.item,cur)==null){e.preventDefault();
    const sib=e.key==='ArrowUp'?kbd.item.previousElementSibling:kbd.item.nextElementSibling?.nextElementSibling;
    flipMove(items(cur),()=>listOf(cur).insertBefore(kbd.item,sib||null));kbd.item.focus()}
  else if(e.key===' '||e.key==='Enter'){e.preventDefault();const {item,from,fromNext}=kbd;item.classList.remove('dnd-kbd');
    d={item,id:item.dataset.dndItem,from,fromNext};kbd=null;finish(zoneOf(item))}
  else if(e.key==='Escape'||e.key==='Tab'){if(e.key==='Escape')e.preventDefault();
    listOf(kbd.from).insertBefore(kbd.item,kbd.fromNext?.isConnected?kbd.fromNext:null);kbd.item.classList.remove('dnd-kbd');kbd.item.focus();kbd=null;say('Cancelled')}
}

/* ---------- post-render hook ---------- */
let pending=null;
function afterRender(){
  if(!pending)return;const el=document.querySelector(`[data-dnd-item="${CSS.escape(pending.id)}"]`);
  const badge=document.querySelector(`[data-count-for="${CSS.escape(pending.zone)}"]`);pending=null;
  if(reduced())return;
  el?.animate([{transform:'scale(1)',boxShadow:'0 0 0 0 var(--tint-line)'},{transform:'scale(1.03)',boxShadow:'0 0 0 8px transparent'},{transform:'scale(1)'}],{duration:420,easing:'cubic-bezier(.34,1.56,.64,1)'});
  badge?.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],{duration:260,easing:'cubic-bezier(.34,1.56,.64,1)'});
}

document.addEventListener('pointerdown',down);
document.addEventListener('keydown',key,true); // capture: runs before app shortcuts while carrying
document.addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.stopPropagation();e.preventDefault()}},true);
window.SELFDnd={register,afterRender,_sortedSlot:(list,rec,cmp)=>{let i=0;while(i<list.length&&cmp(list[i],rec)<=0)i++;return i}};
})();
```
```css
/* drag styles (rooms.css) */
.dnd-ghost{position:fixed;z-index:70;pointer-events:none;margin:0;box-shadow:var(--e-lift);border-color:var(--tint-line)!important;will-change:translate,transform}
.dnd-placeholder{opacity:.35;outline:2px dashed var(--tint-line);outline-offset:-2px}
.dnd-placeholder>*{visibility:hidden}
.dnd-over{background:var(--tint-soft)!important;box-shadow:inset 0 0 0 2px var(--tint-line);transition:background var(--d-quick)}
.dnd-kbd{outline:3px solid var(--tint);outline-offset:3px;transform:translateY(-3px) rotate(-1deg);box-shadow:var(--e-lift)}
.dnd-active,.dnd-active *{cursor:grabbing!important;user-select:none}
.grip{border:0;background:transparent;color:var(--faint);cursor:grab;min-width:32px;min-height:32px;border-radius:8px;touch-action:none}
.grip:hover{background:var(--hover);color:var(--text)}
.is-saving{position:relative}
.is-saving::after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--tint) 18%,transparent),transparent);background-size:200% 100%;animation:shimmer 1s linear infinite}
@keyframes shimmer{to{background-position:-200% 0}}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
```

### 6.6 Wiring and removal
1. Load `self-dnd.js` **before** `app.js` in `index.html`. Add it to `ASSETS` and to the CI `node --check` list.
2. In `app.js`, after `$('#app').innerHTML=…` in `render()`, call `window.SELFDnd?.afterRender()`.
3. Register the `status` adapter in `app.js` and the `stage` adapter in `career.js` after init.
4. **Only once the D1 tests pass**, remove the HTML5 listeners (`app.js` about lines 320–323; `career-phase2.js` `init()`) and the `draggable="true"` attributes. Keep `moveTaskStatus`, `setStage`, the Undo paths and the native status selects.
5. Delete the now-unused `workDragStart`, `workDragOver`, `workDrop`, `workDragEnd` and `resetTaskDropHighlights` **only if** nothing else references them (search the repo first).

---

## 7. Accessibility checklist (every phase)
- [ ] Every interactive element is reachable by Tab, with a visible focus ring (`outline:3px solid var(--tint)`).
- [ ] Doors use `aria-current="page"`; pills use `aria-current` or `aria-pressed`, never only colour.
- [ ] Drag-and-drop works fully by keyboard with live announcements, and the native status select remains as a second path.
- [ ] Dialogs (Focus, palette, sheet) trap focus, close on Esc and return focus to their trigger.
- [ ] Targets are at least 40px (doors 72px, grips 32px is the one exception because the whole card is also a target).
- [ ] Nothing clips at 150% text scale at 1366×768 and 390×844.
- [ ] Reduced motion is honoured (§3.13).

## 8. Performance budget
- No layout reads inside pointermove except `elementFromPoint` and the rects needed by `placeIn`. Placeholder moves are batched one per frame through `requestAnimationFrame` if profiling shows jank.
- A drag must hold ≥ 55 fps on a mid-range phone (Chrome DevTools, 4× CPU throttle): record a trace in the D1 PR.
- No new libraries. `rooms.css`, `motion.css`, `motion.js` and `self-dnd.js` together stay under 30 KB unminified.

---

## 9. Phase plan, with copy-paste prompts

Each prompt is meant to be pasted into a fresh Sonnet or Haiku session as-is. Replace `<date>` with today's date.

### P0 · Hi-fi prototype (safe, no shared files)
**Goal:** one static file the user can click through to approve the look and motion before production work.
**Files:** `design/concepts/rooms-hifi.html` only (self-contained HTML/CSS/JS, sample data clearly labelled).
**Prompt:**
> Read `AGENTS.md`, `docs/design/ROOMS_REDESIGN_BLUEPRINT.md` and `docs/design/ROOMS_BUILD_SPEC.md`. Build `design/concepts/rooms-hifi.html`, a single self-contained HTML file implementing every screen in spec §4–§5 with the motion kit in §3 and the drag-and-drop engine in §6 (copy the reference code and adapt it to in-memory sample data). Use sample data only, labelled "Sample data · nothing is saved". Use the real Career Prep titles from `content/career-learning.json` and `content/career-director-review/review-panels.json`. Don't touch any other file. Verify with Playwright (Chromium at `/opt/pw-browsers`): screenshots at 1440×900 and 390×844 in dark and light, a scripted drag of a Kanban card between two columns, keyboard drag (Space, ArrowRight, Space), no console errors and no horizontal overflow. Commit on branch `design/rooms-hifi-<date>` and open a draft PR with the screenshots.

**Accept when:** all five rooms, Focus, palette, sheet and triage work; drag-and-drop works with mouse, touch (grip) and keyboard; reduced motion has been checked.

### R0 · Contract (Haiku)
> Read the docs listed in spec §0. Edit only `docs/DESIGN_CONTRACT.md`: add a "Rooms shell" section summarising spec §2–§4 and §7 and linking both design docs, and record that the user approved it on <date>. Link the spec from `README.md`. No code. Open a draft PR.

### R1 · Shell and routing (Sonnet)
> Implement blueprint phase R1 together with spec §4 (rail, door bar, top bar, room header, sub-nav thumb). Create `rooms.js` and `rooms.css`; edit `chrome()`/`nav()`/`go()` in `app.js`, `index.html`, the `tools/build_cloudflare.py` ASSETS list and the CI `node --check` list. Keep `state.view` values and the `sidebar` class. Add `tests/smoke_rooms.cjs`. Run all README checks and paste the results. Don't change data loading or any Supabase call.

### M1 · Motion and feel kit (Haiku)
> Create `motion.css` and `motion.js` exactly as spec §3 describes (press, ripple, rise with the `animateNext` flag, aurora, save pill, toasts with Undo, burst, count-up, bump, flip, theme reveal, optional sound, reduced motion). Wire only: the ripple listener, the theme reveal in the existing `theme` action, the toast restyle and the save pill. Add both files to `index.html`, ASSETS and CI. All smoke tests must pass. Include a reduced-motion screenshot.

### D1 · Drag-and-drop engine (Sonnet)
> Implement spec §6 in `self-dnd.js`, starting from the reference code. Extract `taskOrder` from `filteredTasks()` in `app.js` and use it in both places. Register the `status` adapter (My Work board, commit = existing `moveTaskStatus`) and the `stage` adapter (export `setStage` from `career-phase2.js`; commit = `setStage`). Restyle the Kanban cards and columns per spec §5.2 and §5.3. Add `tests/smoke_dnd.cjs`, which loads `self-dnd.js` in node vm and tests `_sortedSlot` against `taskOrder` fixtures, including equal dates and null dates. Add `tests/browser_dnd.cjs` (Playwright fixture with Supabase intercepted): mouse drag To Do→Review saves exactly one PATCH with `{status:'review'}`; a failed PATCH (503) returns the card and shows an error toast; keyboard drag works; Undo restores. Only then remove the HTML5 drag listeners (§6.6). Paste the test output.

### R2 · Today (Sonnet)
> Implement blueprint R2 with spec §5.1: capture bar, Three for today (with the `three` adapter), agenda with the now line, and the triage stack with swipe and buttons (delayed delete with Undo). Create `today.js`. Use existing insert/patch/del and `priorityRank()`. Add `tests/smoke_today.cjs`, covering the agenda merge with fixed WIB fixtures and pins reading/writing with localStorage throwing. No new tables.

### R3 · Hunt and Study (Sonnet)
> Implement blueprint R3 with spec §5.3–§5.4: hosted Career render, pill sub-nav, KPI strip with conversion, pipeline using the `stage` adapter, Needs a touch, people cards, radar relevance rings, interview countdowns, Kit copy buttons; the Study path with sprint progress from canonical sprint Tasks, Learn filters with FLIP, and the Director Review step rail. Keep `career-workspace` and a visually hidden "CAREER STUDIO" heading. All Career smoke and browser tests must pass.

### R4 · Palette and capture grammar (Sonnet + Haiku)
> Sonnet: create `capture-parse.js` (pure `parseCapture`) and `palette.js` per blueprint R4 and spec §5.7. Haiku: write `tests/smoke_capture_parse.cjs` with at least 25 fixtures (Indonesian and English dates, weekday rollover across a week boundary, URLs, unknown `#space`, `!priority`, plain notes).

### R5 · Focus mode (Haiku)
> Implement spec §5.6 in `focus.js`, reusing the `data-task-field` and checklist actions so saving goes through existing handlers. Add a Focus button to Three for today and the task sheet. Test: a checklist toggle in Focus appears in My Work without a reload.

### R6 · Polish and QA (Haiku)
> Run the full checklist in spec §7–§8 and blueprint §5. Fix only what fails. Commit screenshots to `docs/rooms-review/R6/` at 1366 and 390 px, 100% and 150% text, dark and light, plus reduced motion. Record the contrast ratios. Report anything still unverified.

---

### After R6
Feature phases U1–U7 and the Wave 2 migrations are specified in [`SELF_PRODUCT_UPGRADE_PLAN.md`](./SELF_PRODUCT_UPGRADE_PLAN.md) §8, with their own prompts. Start them only after the Rooms phases above have merged.

## 10. Definition of done (whole project)
- [ ] Every route in blueprint §3 is reachable, and every existing feature still works (all README checks pass).
- [ ] Drag-and-drop works with mouse, touch and keyboard on: My Work board, My Work calendar week, Hunt pipeline and Three for today. Every drop persists through an existing save function, with Undo.
- [ ] No database migration, no new table or column, and no production writes from tests.
- [ ] Motion follows §3 and turns off under reduced motion.
- [ ] Screenshots for every phase are committed. Live deployment is verified separately from CI (the `Workers Builds: self` check was already failing on `main`-era PRs at the time of writing).

## 11. Don't
- Don't animate on every re-render; only on room or tab entry and direct user actions.
- Don't show success before the save resolves.
- Don't let a drop position imply an order that isn't saved (§6.4).
- Don't add libraries (no SortableJS, GSAP or React).
- Don't redesign the Concept D whiteboard editor or the Task Detail content.
- Don't invent counts, people, companies or progress in production markup.
