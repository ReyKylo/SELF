# Hunt › Tracker: one place to drop any link and know what to do next

**Status (26 Oct 2026): T1 (helpers) and T2 (migration) done; T3–T5 not built.** Builder: Sonnet, one PR per step (§9). The migration in §5 was applied on 26 Oct 2026 with the user's explicit approval ("Go Migration"): live version `20261026145143`, repo file `supabase/migrations/20261026145143_career_tracker.sql`; tables, RLS policies, grants and the unique URL index verified afterwards.

**The problem, in the user's words:** "Gak semua via LinkedIn." Job hunting happens across company websites, LinkedIn Jobs, Jobstreet, Glints, Kalibrr, email and referrals. Today SELF only has a place for *people on LinkedIn* (Outreach), so:
1. A careers page that turns out to be a dead end (no Indonesia office, no Indonesians, no vacancy in Indonesia) leaves no trace. The effort is lost, and the same firm gets researched again later.
2. Job links from LinkedIn Jobs or Jobstreet get thrown somewhere, and a week later it is unclear what the job was, where it came from and what the next move is.
3. There is no way to filter by industry.
4. Small things are missing: there is no delete on the Outreach board, a company cannot be deleted while anything is attached to it, and a Radar opportunity can only be dismissed.

**The answer:** a **Tracker**. Every link (or note) is one row, with a status, a next step and an automatic "last touched" log. Company, industry and source are labels for filtering, not folders you have to create first. Outreach, Pipeline and Companies stay as detail views that a row can be sent to.

---

## 1. Decisions already made with the user
| Question | Decision |
|---|---|
| Industry list | A fixed list (§4.4), editable in code, with "Other" |
| Job link without a clear company (e.g. a confidential Jobstreet post) | Allowed; company stays empty |
| Dead ends | Not a hidden state: every row shows **how long since you last touched it** and **what you did**, plus a **Stale** view |
| Claude/AI in the workflow | **None.** Everything runs inside SELF, with no AI calls and no usage cost |
| Stale threshold | 14 days by default, changeable per device |

## 2. What exists today (verified in code, 26 Oct 2026)
| Piece | Where | Gap for this plan |
|---|---|---|
| Hunt pills | `career.js:195` `HUNT_PILLS` | No Tracker pill |
| Companies with `industry` (free text) | `career_companies` | Industry not used as a filter |
| People board (LinkedIn only) | `outreach.js` | No delete on the board; only LinkedIn |
| Applications | `career_applications` (`company_id` NOT NULL, FK `ON DELETE RESTRICT`) | Blocks company delete |
| Opportunities (Radar) | `career_opportunities` | Too rigid for free capture: `provider IN ('Remotive','Manual')`, `cluster` has 4 values, `relevance_score` required. Only *dismiss*, no delete |
| Delete of a record | `career.js:360` `erase()` through the old edit drawer only | Not reachable from the newer boards |
| Global capture | `palette.js` + `capture-parse.js` (Ctrl/Cmd K) | A pasted link becomes a generic Link, not a career item |
| Follow-ups on Today | `today.js followUps()` | People only |

## 3. The experience
### 3.1 Tracker page (Hunt › **Tracker**, the first and default Hunt pill)
```
[ Paste a link or type a note…                                   ]  [Add]

 Today (3)   Inbox (5)   All   Stale (4)    Industry: [PE] [VC] [Consulting] [Fintech] …   Source ▾  Kind ▾  Status ▾

 ● Analyst Intern · Northstar        Jobstreet    PE       Next: send CV · today          2d ago   ⋯
 ● Sari A. · Meranti                 LinkedIn     PE       Next: follow up · tomorrow     6d ago   ⋯
 ○ careers.kaliandra.com             Website      VC       Not processed yet              new      ⋯
 ◌ Business Analyst · Xendit         LinkedIn Jobs Fintech Waiting for reply              12d ago  ⋯
 ✕ Meranti careers page              Website      PE       Dropped: no Indonesia office   23d ago  ⋯
```
- Each row: status dot, **title · company**, source badge, industry, **next step + due date** (or the outcome when done or dropped), **last touched** age, `⋯` menu.
- Clicking the title opens the link in a new tab (`safeHttp`, `rel="noopener noreferrer"`). Clicking anywhere else on the row opens the **row drawer** (§3.3).
- Filters combine and persist per device. The industry chips are the fixed list (§4.4) plus "No industry".
- Empty states: "Paste your first link: a job post, a careers page, a LinkedIn profile, anything." For an empty view: "Nothing due today."

### 3.2 Views (all the same data)
| View | Shows | Sorted by |
|---|---|---|
| **Today** | Not done or dropped, `next_due ≤ today` or `deadline ≤ today + 3` | Overdue first, then due date |
| **Inbox** | `status = inbox` (dropped in, not processed) | Newest first |
| **All** | Everything, with filters | Last touched, newest first |
| **Stale** | Not done or dropped, `last_activity_at` older than the threshold (14 days default) | Oldest touch first |

Done and Dropped rows are hidden from Today, Inbox and Stale, but always visible in All with the status filter.

### 3.3 Fast capture
1. Paste a link (or several, or a messy block of text) into the bar and press **Enter**. Each link becomes an **Inbox** row immediately. Nothing else is required.
2. SELF fills what it can **from the URL alone** (§4.2): source, kind and a company guess. Guesses are labelled "guessed from link".
3. Optional inline second step (Tab after paste): **Title** and **Next step** with a date shorthand (`besok`, `jumat`, `due:2026-11-03`, reuse `capture-parse.js` date rules). Filling a next step moves the row to **Active**.
4. Plain text without a link becomes a note row (`kind = other`, no URL).
5. **Duplicate link:** never a second row. SELF scrolls to the existing row, highlights it and says "Already tracked · last touched 5d ago · Waiting".
6. **From anywhere:** the command palette (Ctrl/Cmd K) offers **"Track in Career"** for any query that contains a link (and for plain text, as an alternative). It inserts an Inbox row without leaving the current page.

### 3.4 Row drawer
Fields: URL, title, company (text, with suggestions from `career_companies`; picking one links `company_id`), industry, location, kind, source, status, next step + due date, deadline, notes.

Below the fields, the **activity log** (newest first): "26 Oct · Status Inbox → Active", "27 Oct · Next step: send CV (31 Oct)", "3 Nov · Note: …". Each save writes the log entry and bumps `last_activity_at` (§5). A **"Touched it"** button logs a one-line note ("Checked, still open") for when you looked but nothing changed, so Stale stays honest.

Actions in the drawer and the `⋯` menu:
- **Mark done** with outcome: Applied, Got a reply, Interview, Offer, Rejected, Other (free text).
- **Drop** with reason: one tap on a common reason (No Indonesia office, No Indonesians there, No vacancy in Indonesia, No careers page, Closed, Not a fit) or free text.
- **Reopen** (done or dropped → Active).
- **Send to Outreach** (kind *person*): creates or links a `career_people` row (profile URL, name, company) and stores `person_id`. The row stays in the Tracker.
- **Make it an Application** (kind *job*): creates the company if missing (asks for its name when empty), creates a `career_applications` row (`hiring_stage = 'applied'`, `source_url`, `applied_at = today`), stores `application_id`, sets the row to Waiting and logs it.
- **Delete** (§3.6).

### 3.5 Status
`inbox` (dropped in) → `active` (you are on it) → `waiting` (ball is in their court) → `done` (with outcome) or `dropped` (with reason). Any status can move to any other. The drawer offers the next sensible one first.

### 3.6 Delete everywhere
- **Tracker row:** `⋯ → Delete` hides the row at once and shows "Deleted · Undo" for 10 seconds; the DELETE request is sent only when the toast expires or the page is left. Undo cancels it, so nothing has to be re-created. Its log rows go with it (FK cascade).
- **Outreach board card:** add **Delete** to the card's `⋯` menu, using the same delayed delete. Touchpoints and task links follow their existing FKs.
- **Company** (from the Outreach overview, the Companies page and the company board): if nothing is attached, delete with undo. If something is attached, a dialog lists the counts:
  - People and Tracker rows: "Unlink them (they stay, without a company)". Their FKs are already `ON DELETE SET NULL`.
  - Applications: they block the delete (`ON DELETE RESTRICT`). The dialog offers **"Also delete N applications"** (explicit checkbox) or Cancel. It never deletes applications silently.
- **Radar opportunity:** add **Delete** next to Dismiss.

### 3.7 Today
Add a **Career** block to Today, next to "Needs a touch": "3 due · 5 in Inbox · 4 stale", each a link to the Tracker view, plus the first three due rows inline with their next step. Hidden when all three counts are zero.

## 4. Pure helpers (`tracker.js`, exported as `root.SELFTracker`, testable in Node)
### 4.1 `normalizeUrl(text)`
Trim, add `https://` when the scheme is missing, lowercase the host, drop the `www.` prefix, drop the hash and tracking parameters (`utm_*`, `trk`, `trackingId`, `refId`, `lipi`, `ref`, `source`, `gclid`, `fbclid`), drop the trailing slash. Keep other query parameters (some job boards use them as the job id, e.g. `currentJobId`). Returns `null` for anything that is not `http(s)` or `mailto:`.

For LinkedIn job URLs, reduce to `https://www.linkedin.com/jobs/view/<id>` (LinkedIn always uses the `www.` host, matching Outreach profile links) (also when the id comes from `?currentJobId=`). LinkedIn profiles reuse `SELFOutreach.profileUrl`, so the Tracker and Outreach share one duplicate key.

### 4.2 `detectSource(url)` → `{source, kind, companyGuess}`
Only the URL is read. **Nothing is fetched.**
| URL pattern | source | kind | company guess |
|---|---|---|---|
| `linkedin.com/jobs/view/…`, `linkedin.com/jobs/…currentJobId=` | `linkedin_jobs` | job | none |
| `linkedin.com/in/<slug>` | `linkedin` | person | none (title = `SELFOutreach.nameFromSlug`) |
| `linkedin.com/company/<slug>` | `linkedin` | company | from slug |
| `jobstreet.co.id`, `id.jobstreet.com`, `jobstreet.com` | `jobstreet` | job | none |
| `glints.com` (`/opportunities/jobs/…`) | `glints` | job | none |
| `kalibrr.com` (`/c/<company>/jobs/…`) | `kalibrr` | job | from `<company>` |
| `dealls.com`, `techinasia.com/jobs`, `indeed.com`, `id.indeed.com` | `job_board` | job | none |
| `boards.greenhouse.io/<co>`, `job-boards.greenhouse.io/<co>`, `jobs.lever.co/<co>`, `<co>.workable.com`, `jobs.ashbyhq.com/<co>`, `<co>.wd*.myworkdayjobs.com` | `ats` | job | from `<co>` |
| host starting `careers.` / `jobs.`, or path containing `/careers` / `/jobs` / `/karir` | `company_site` | job | from the registrable domain |
| `mailto:` | `email` | person | from the email domain unless it is a free-mail domain |
| anything else | `website` | company | from the registrable domain |

Company guesses are title-cased slugs (`northstar-capital` → "Northstar Capital"), marked as a guess, and matched against `career_companies` by normalised name or website domain (reuse `SELFOutreach.normName`). A match links `company_id` automatically.

### 4.3 Other helpers
- `parseDrop(text)` → `[{url, source, kind, companyGuess, title}]` or one note `{note}`: extracts every link in a block, dedupes within the block.
- `findDuplicate(url, tracks)` → the existing row or `null`.
- `bucket(track, today, staleDays)` → the set of views it appears in (§3.2).
- `ageLabel(ts, today)` → `new`, `today`, `1d ago`, `12d ago`, `3mo ago`.
- `sortFor(view, rows, today)` → the orders in §3.2.
- `DROP_REASONS`, `OUTCOMES`, `SOURCES` (labels), `INDUSTRIES`.

### 4.4 `INDUSTRIES`
`Private Equity`, `Venture Capital`, `Investment Banking`, `Consulting`, `Corporate Finance / Strategy`, `Asset Management`, `Banking`, `Fintech`, `Tech`, `Other`. Stored as the label text. `industryOf(text)` maps existing free-text values in `career_companies.industry` (e.g. "PE", "pe fund", "VC") to the list, so old companies filter correctly without a data migration. A row with no industry but a linked company inherits the company's industry for filtering.

## 5. Data change (**applied 26 Oct 2026 with the user's explicit approval; do not run again**)
New migration `supabase/migrations/<timestamp>_career_tracker.sql`, applied once by the Integrator. It is additive only: two new tables and no change to existing rows. RLS and grants follow the four owner policies used in `20261021135000_self_career_phase1_core.sql`.

```sql
CREATE TABLE IF NOT EXISTS public.career_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text CHECK (url IS NULL OR url ~* '^(https?://|mailto:)[^[:space:]]+$'),
  kind text NOT NULL DEFAULT 'other' CHECK (kind IN ('job','person','company','other')),
  source text NOT NULL DEFAULT 'website'
    CHECK (source IN ('linkedin','linkedin_jobs','jobstreet','glints','kalibrr','job_board','ats','company_site','email','website','referral','other')),
  title text NOT NULL DEFAULT '' CHECK (char_length(title) <= 200),
  company_name text NOT NULL DEFAULT '' CHECK (char_length(company_name) <= 160),
  company_id uuid,
  industry text NOT NULL DEFAULT '' CHECK (char_length(industry) <= 80),
  location text NOT NULL DEFAULT '' CHECK (char_length(location) <= 160),
  status text NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox','active','waiting','done','dropped')),
  close_reason text NOT NULL DEFAULT '' CHECK (char_length(close_reason) <= 200),
  next_step text NOT NULL DEFAULT '' CHECK (char_length(next_step) <= 200),
  next_due date,
  deadline date,
  notes text NOT NULL DEFAULT '',
  person_id uuid,
  application_id uuid,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id,user_id),
  CHECK (url IS NOT NULL OR char_length(trim(title)) > 0),
  CONSTRAINT career_track_company_owner FOREIGN KEY (company_id,user_id)
    REFERENCES public.career_companies(id,user_id) ON DELETE SET NULL (company_id),
  CONSTRAINT career_track_person_owner FOREIGN KEY (person_id,user_id)
    REFERENCES public.career_people(id,user_id) ON DELETE SET NULL (person_id),
  CONSTRAINT career_track_application_owner FOREIGN KEY (application_id,user_id)
    REFERENCES public.career_applications(id,user_id) ON DELETE SET NULL (application_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS career_tracks_owner_url_uniq ON public.career_tracks(user_id,url) WHERE url IS NOT NULL;
CREATE INDEX IF NOT EXISTS career_tracks_owner_status_idx ON public.career_tracks(user_id,status,next_due);
CREATE INDEX IF NOT EXISTS career_tracks_owner_activity_idx ON public.career_tracks(user_id,last_activity_at DESC);

CREATE TABLE IF NOT EXISTS public.career_track_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('created','status','next_step','note','edit','linked','touched')),
  summary text NOT NULL CHECK (char_length(trim(summary)) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_track_event_owner FOREIGN KEY (track_id,user_id)
    REFERENCES public.career_tracks(id,user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS career_track_events_owner_track_idx ON public.career_track_events(user_id,track_id,created_at DESC);
-- + RLS enable, owner_select/insert/update/delete policies, GRANT to authenticated, REVOKE from anon (same loop as phase 1)
-- Phase 1 defines no updated_at trigger for career tables; the client sets updated_at on PATCH, as the other career tables do.
```
Check before running: the composite `UNIQUE (id,user_id)` on `career_people` and `career_applications` exists (it does in phase 1), and the `ON DELETE SET NULL (column)` syntax works on the live Postgres version (it is already used in phase 1).

**Why client-written events and not a trigger:** it matches how touchpoints are written today and keeps the summaries in plain language ("Dropped: no Indonesia office"). Every Tracker mutation goes through one helper, `track.save(id, patch, eventKind, summary)`, which PATCHes the row with `last_activity_at = now()` and inserts one event. A failed event insert does not undo the row change; the toast says "Saved, but the log entry failed".

## 6. Where the code goes
| File | Change |
|---|---|
| `tracker.js` (new) | Pure helpers (§4), then the UI module `SELFTrackerUI` (`init`, `render`, `action`, `input`, `keydown`, `reset`), mirroring `outreach.js` |
| `tracker.css` (new) | Row list, chips, drawer, phone layout |
| `career.js` | Add `['tracker','Tracker']` as the first entry of `HUNT_PILLS` and make it Hunt's default page; route `render/action/input/keydown` to `SELFTrackerUI` like `SELFOutreachUI`; load `career_tracks` in `load()` |
| `index.html` | Script and stylesheet tags |
| `palette.js` | "Track in Career" create item |
| `today.js` | Career block (§3.7) |
| `outreach.js` | Delete in the card menu; company delete dialog |
| `career-phase3.js` | Delete for Radar opportunities |
| `tests/smoke_tracker.cjs`, `tests/browser_tracker.cjs` (new) | §7 |

`app.js`, `career.js`, `index.html`, `today.js`, `palette.js` and `supabase/**` are shared files. Per `AGENTS.md`, the user authorised this build on 26 Oct 2026; one builder works on them at a time, sequentially by step.

## 7. Acceptance
- **Helpers (unit):** URL normalisation (scheme missing, `www.`, tracking parameters, hash, trailing slash, LinkedIn `currentJobId` → `/jobs/view/<id>`, `mailto:`); every row of the §4.2 table; company guess from slugs and domains (including `co.id` / `com.sg` registrable domains); `parseDrop` with a messy multi-link block; duplicates; `bucket` boundaries (due today, due yesterday, deadline in 3 days, stale at exactly 14 days, done/dropped never in Today/Inbox/Stale); `industryOf` mappings.
- **Browser:** paste one link → an Inbox row appears with the detected source; paste a duplicate → no new row, the existing one is highlighted; set a next step for today → the row appears in Today; drop with a reason → it leaves Today, Inbox and Stale and shows the reason in All; delete → Undo restores it and no DELETE request was sent; after 10 s the DELETE is sent once; industry chip filters; "Make it an Application" creates the application and links it; palette "Track in Career" inserts from another room.
- **Company delete:** with only people attached, they are unlinked and kept; with applications attached, the delete is blocked unless the checkbox is ticked.
- **Phone (390 px):** no horizontal page overflow; the capture bar and filters are reachable; the drawer is full-screen.
- Clicking a title never opens an unsafe URL (`safeHttp`); `mailto:` opens the mail client.
- Existing suites still pass: `smoke_outreach`, `browser_outreach`, `browser_hunt`, `browser_today`, `browser_palette`.

## 8. Never
- Fetch, scrape or preview any pasted URL (LinkedIn, Jobstreet or anywhere else), or apply for a job from SELF.
- Call an AI model as part of this workflow.
- Present a guess (company from a domain, name from a slug, kind from a URL) as fact; guesses stay labelled until edited.
- Delete applications as a side effect without the explicit checkbox.

## 9. Build steps (one PR each, in order)
| Step | What | Touches shared files |
|---|---|---|
| T1 | `tracker.js` pure helpers (§4) + `tests/smoke_tracker.cjs` | No |
| T2 | Migration (§5): **only after the user says go**; applied once, constraint and policies verified afterwards | `supabase/**` |
| T3 | Tracker page: capture bar, views, filters, row drawer, activity log, delayed delete; `career.js` pill, default page and load | Yes |
| T4 | Bridges: Send to Outreach, Make it an Application; palette "Track in Career"; Today Career block | Yes |
| T5 | Delete gaps: Outreach card delete, company delete dialog, Radar delete | Yes |

**T1 prompt (copy-paste):**
> Read `AGENTS.md` and `docs/design/HUNT_TRACKER_PLAN.md` §4 and §7 (helpers). Create `tracker.js` with only the pure helpers from §4, exported as `root.SELFTracker` and through `module.exports`, in the style of the top of `outreach.js` (reuse `SELFOutreach.profileUrl`, `nameFromSlug` and `normName` when loaded, with a local fallback in Node). Add `tests/smoke_tracker.cjs` covering every helper case listed in §7. No DOM, no network, no database. Don't touch any other file.

**T2 prompt (copy-paste, only after the user approves):**
> Read `AGENTS.md`, `docs/design/HUNT_TRACKER_PLAN.md` §5 and `supabase/migrations/20261021135000_self_career_phase1_core.sql`. Write `supabase/migrations/<timestamp>_career_tracker.sql` from §5, completing the RLS/grant loop exactly as phase 1 does. Apply it once to the live project, then verify both tables, the policies and the unique URL index. Record the live version in §5 of the plan.

**T3 prompt (copy-paste):**
> Read `AGENTS.md`, `docs/design/HUNT_TRACKER_PLAN.md` §3.1–3.6, §6 and §7, `career.js`, `outreach.js` and `tracker.js`. Build `SELFTrackerUI` in `tracker.js` and `tracker.css`: the capture bar, the four views, filters (industry chips, source, kind, status; persisted per device in try/catch-wrapped `localStorage`), the row drawer with the activity log, and the delayed delete with Undo. All writes go through one `save(id, patch, eventKind, summary)` that bumps `last_activity_at` and inserts a `career_track_events` row. Add `['tracker','Tracker']` as the first Hunt pill and make it the default. Add `tests/browser_tracker.cjs` for the browser cases in §7. Don't touch `supabase/**`.

**T4 prompt (copy-paste):**
> Read `docs/design/HUNT_TRACKER_PLAN.md` §3.3 (point 6), §3.4 (Send to Outreach, Make it an Application) and §3.7, then `palette.js`, `today.js` and `tracker.js`. Implement the two bridges, the palette "Track in Career" item and the Today Career block. Extend `browser_tracker.cjs`, and keep `browser_today.cjs` and `browser_palette.cjs` passing.

**T5 prompt (copy-paste):**
> Read `docs/design/HUNT_TRACKER_PLAN.md` §3.6 and §7 (company delete), then `outreach.js`, `career.js` (`erase`) and `career-phase3.js`. Add Delete to the Outreach card menu (delayed delete with Undo), the company delete dialog with counts and the explicit "Also delete N applications" checkbox, and Delete for Radar opportunities. Extend `browser_outreach.cjs` with the company delete cases.
