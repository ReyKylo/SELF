# Hunt › Outreach: one people board per company

**Goal (the user's own workflow):** research target companies → find the people who work there by hand → paste their LinkedIn links into that company's board → move each card **Found → Connect sent → Connected → Approached → Talking**, knowing that not everyone accepts → click a card to open that person's LinkedIn profile.

**Verdict:** this should be the centre of Hunt. Applications are an outcome; relationships are what most often get you there. Most of the plumbing already exists (`career_people.company_id`, `profile_url`, `relationship_stage`, touchpoints, `career_task_links`, the drag-and-drop engine, Today's follow-ups). What's missing is the board, three stage values, fast entry and the nudges.

---

## 1. What exists today (verified in code)
| Piece | Where | State |
|---|---|---|
| Person with company, `profile_url`, stage, `last_contacted_at` | `career_people` (migration `20261021135000`) | ✓ |
| Stages | `new`, `reached_out`, `in_conversation`, `maintain` (CHECK constraint) | **No "connect sent" or "connected" step** |
| People page | `career.js careerPeople()` and `career-phase2.js renderPeople()` | Four lists, not per company, not draggable, a click opens the edit drawer |
| Touchpoints (dated contact log, `next_step`) | `career_touchpoints` | ✓ |
| Follow-up tasks linked to a person | `career_task_links.person_id` | ✓ |
| "Needs a touch" | `today.js followUps()` | ✓, stage-agnostic |
| Drag engine | `self-dnd.js` | Refuses to start a drag on `<a>` (line 50) but already swallows the click after a drag (line 180) |

## 2. The experience
### 2.1 Outreach overview (Hunt › Outreach, replaces the People pill)
One row per target company, sorted by "needs you" first (sample firms):
```
Northstar Capital   PE · Jakarta     ▰▰▰▱▱  Found 3 · Sent 4 · Connected 2 · Approached 1 · Talking 1   ● 2 need you   ›
Meranti Partners    PE · Jakarta     ▰▱▱▱▱  Found 5 · Sent 0                                             Paste links   ›
Kaliandra Ventures  VC · Jakarta     ▰▰▱▱▱  Found 1 · Sent 3 · Connected 1                               ● 1 need you   ›
```
- The stage bar is a 5-segment mini funnel. "Need you" counts the nudges from §2.5 for that company.
- **Add company** and **Import companies (CSV)** sit at the top (for the research pack, §4).
- People without a company appear under "No company yet", so nobody gets lost.

### 2.2 Company board (one Kanban per company; sample names)
```
← Outreach   Northstar Capital  ·  PE · Jakarta  ·  northstar.co ↗          [Find people on LinkedIn ▾]  [Paste links]

 Found (3)          Connect sent (4)     Connected (2)       Approached (1)      Talking (1)
┌──────────────┐   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ SA  Sari A.  │   │ DP  Dimas P. │    │ RW  Rina W.  │    │ BK  Budi K.  │    │ AL  Ayu L.   │
│ Associate    │   │ Analyst      │    │ VP           │    │ Analyst      │    │ Associate    │
│ Peer · in ↗  │   │ sent 9d      │    │ ● approach   │    │ ● follow up  │    │ call Fri     │
└──────────────┘   └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                         No reply (2) ▸  (collapsed tray)
```
- **Click a card → that person's LinkedIn opens in a new tab.** The card's main area is a real link (`<a href=profile_url target=_blank rel="noopener noreferrer">`), so middle-click and long-press work too.
- **Drag a card → move it to another stage.** Drag starts after 6 px, and a drag never opens the link (the engine already swallows the click).
- **⋯ button on the card** → the existing person drawer (edit, notes, touchpoints, delete).
- **No link yet** → the card shows "Add LinkedIn link", and clicking it opens the drawer focused on the URL field.
- **Keyboard:** Tab to a card, Enter opens LinkedIn, Space picks it up, arrows move it, Space drops, `e` opens the drawer.
- **No reply** is a collapsed tray, not a sixth column. "Let go" on a card sends it there; it can be revived at any time.

### 2.3 Fast entry: Paste links
Paste any number of LinkedIn profile links (one per line, or a messy block of text):
1. Extract URLs matching `linkedin.com/in/<slug>` (any subdomain such as `id.` or `www.`).
2. Normalise each to `https://www.linkedin.com/in/<slug>/`, removing query, hash and case differences.
3. Remove duplicates already in SELF for any company (show "Already in Meranti Partners · Connected", never a silent duplicate).
4. Guess the display name from the slug: `budi-santoso-8a1b2c3` → "Budi Santoso" (drop a trailing id part that contains digits). The card shows **"name from link, check it"** until edited.
5. A preview list with editable name and role → **Add 6 people to Found**. Inserts run with `Promise.allSettled`; the toast reports partial failures exactly.

SELF **never fetches LinkedIn**. It stores only the link you pasted, and opening it is your own browser.

### 2.4 Moves do the bookkeeping (each one optional and undoable)
| Move to | SELF does automatically | Toast |
|---|---|---|
| Connect sent | Logs a touchpoint "LinkedIn connection request sent" (channel `message`, today) | "Logged · Undo" |
| Connected | Logs "Connection accepted" | "Now approach Rina? · Write message" |
| Approached | Opens the Message Composer (upgrade plan §5.7) with the "Approach" template; **Log as sent** saves the touchpoint and creates a follow-up task due in 7 days, linked through `career_task_links` | "Follow-up set for Fri · Undo" |
| Talking | Asks one line: "What did they say?" → touchpoint, plus an optional next step | — |
| No reply (Let go) | Logs "Closed: no reply"; removes pending follow-ups for that person | "Moved to No reply · Undo" |

A setting turns auto-logging off for people who prefer to log by hand. Undo removes the touchpoint and task it created and restores the stage.

### 2.5 Nudges (in the card, the company row and Today › Needs a touch)
Derived from stage plus the latest touchpoint date; nothing is sent anywhere:
| Rule | Nudge |
|---|---|
| Connect sent ≥ 14 days | "Pending 15d: wait or withdraw" (stale pending invites are worth withdrawing) |
| Connected ≥ 2 days and not approached | "Approach Rina (connected 3d)" |
| Approached ≥ 7 days, no reply | "Follow up once" (a single polite follow-up is normal) |
| Followed up and ≥ 7 more days without a reply | "Let go?" → moves to No reply |
| Talking, last touch ≥ 21 days | "Keep warm: share something useful" |

### 2.6 Make each company's coverage smart
- **Find people on LinkedIn ▾** opens LinkedIn people search in your browser, with the keywords pre-filled: `"<company>" analyst`, `"<company>" associate`, `"<company>" <your university>` (alumni, from a setting). You still choose the people yourself, as you wanted.
- **Coverage hint** on the board: aim for 3 to 5 people per firm: **peers** (Analyst or Associate: most likely to reply), **seniors** (VP and above: decision makers) and **warm** contacts (same campus or a shared connection). The role group is *guessed from the title* and labelled as a guess.
- **Weekly pace:** "11 requests sent this week", counted from touchpoints, against a cap you set yourself. LinkedIn limits invitations and changes those limits; SELF doesn't claim a number.
- **Note counter:** the connection-note template shows a character counter with a limit you set (the note length LinkedIn allows depends on the account type).

### 2.7 Templates included (Bahasa Indonesia and English; editable in Kit)
- **Connection note:** short, specific, no ask.
- **Approach:** one line on why them, one on you, and a 15-minute ask with two time options.
- **Follow-up:** one polite nudge.
- **Thank-you:** after a call, with the one thing you'll act on.

## 3. Data change (one small, additive migration; Integrator only, with explicit approval)
Add three values to the stage CHECK. **Existing rows are untouched.** `reached_out` keeps its meaning, "messaged them", and is relabelled **Approached**.
```sql
ALTER TABLE public.career_people DROP CONSTRAINT IF EXISTS career_people_relationship_stage_check;
ALTER TABLE public.career_people ADD CONSTRAINT career_people_relationship_stage_check
  CHECK (relationship_stage IN ('new','connect_sent','connected','reached_out','in_conversation','maintain','no_reply'));
```
Verify the live constraint name before running (`\d career_people`), and run it once only. **Board order:** `new`=Found, `connect_sent`=Connect sent, `connected`=Connected, `reached_out`=Approached, `in_conversation`=Talking, `maintain`=Ally (shown under Talking as a badge, filterable), `no_reply`=tray.

**Fallback until approved:** ship the board with the four current stages (Found, Approached, Talking, Ally). Connect sent and Connected stay hidden behind the `outreach:sevenStages` flag, which the client turns on once a test insert confirms the new values are accepted.

## 4. Company research → SELF (the "lu research, gw cari orangnya" part)
Workflow with Claude in chat:
1. You give a list or a brief ("PE funds in Jakarta that hire fresh grads").
2. Claude researches with web sources and returns a **Company Research Pack**: per firm, what they do, strategy and sector focus, notable recent deals or news (with source and date), the analyst-programme or hiring signals that were found, *which titles to look for*, and one "why this firm" angle for your note. Anything unverified is marked as such.
3. Claude also returns `companies.csv` (`name,industry,website,location,notes`). **Import companies** in Outreach previews it, removes duplicates by normalised name or website, and inserts.
4. You open each company board → **Find people on LinkedIn** → paste links → go.

The research text lands in `career_companies.notes`, so the Dossier (upgrade plan §5.1) shows it before every call.

## 5. Acceptance
- Card click opens `profile_url` in a new tab; a drag never opens it; Enter opens it from the keyboard.
- Each move sends exactly one PATCH (plus the optional touchpoint insert); Undo reverses both.
- Paste links: unit tests for extraction, normalisation (subdomains, query, trailing slash, case), duplicate detection across companies, and slug-to-name (`a-b-123abc`, `ab`, unicode, `in/` with no slug).
- A missing or invalid `profile_url` never renders a link (reuse `safeUrl`).
- Phone (390 px): columns scroll horizontally with snap; the tray stays reachable; no page overflow.
- Works with zero companies ("Add your first target firm") and with a company with zero people ("Find people on LinkedIn, then paste their links here").

## 6. Build steps (one PR each)
| Step | What | Builder |
|---|---|---|
| O1 | `outreach.js` pure helpers (link extraction, normalisation, slug → name, dedupe, nudges, role-group guess) + `smoke_outreach.cjs` | Haiku |
| O2 | Overview + company board on the current 4 stages, with card-is-a-link; drag engine: allow `[data-dnd-link]` anchors to start a drag | Sonnet |
| O3 | Paste links, Import companies CSV, Find-people search links | Sonnet |
| O4 | Moves do the bookkeeping + Message Composer hook + nudges in Today | Sonnet |
| O5 | Migration (§3) by the Integrator, then switch on the seven stages | Integrator + Haiku |

**O2 prompt (copy-paste):**
> Read `AGENTS.md`, `docs/design/HUNT_OUTREACH_PLAN.md` §2.1–2.2 and §5, `career.js`, `career-phase2.js` and `self-dnd.js`. Replace the People pill with **Outreach**: an overview of companies with stage counts, and a per-company Kanban using the existing four stages. Card markup: an `<article data-dnd-item data-dnd-type="person">` with an inner `<a data-dnd-link href=safeUrl(profile_url) target=_blank rel="noopener noreferrer">` and a `⋯` button that opens the existing person drawer. In `self-dnd.js`, let a pointerdown inside `[data-dnd-link]` start a drag (keep the 6 px threshold and click suppression). Add a `person-stage` adapter that PATCHes only `relationship_stage`. Add a browser test: a click opens a popup with the profile URL, a drag moves stage without a popup, and there is no overflow at 390 px. Don't touch `supabase/**`.

## 7. Never
- Fetch, scrape or automate LinkedIn, or send any message from SELF.
- Invent names, titles or reply rates. Guesses (name from link, role group) are labelled.
- Store anything about a person that you didn't type or paste yourself.
