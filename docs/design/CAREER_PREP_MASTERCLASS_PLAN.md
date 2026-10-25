# Career Prep: from well-sourced study guide to masterclass

**Build status (24 Oct 2026):** M1 Lesson Loop v2 shell, M3 practice engine (`career-grid.js`, 96 fixtures) and M5 review queue with the Daily Drill in Today are built. M2 has the Waterfall and the model-format bridge (`career-visuals.js`); BalanceBars, RollForward, CohortTriangle, CapTable and Sensitivity are still to build with the VC and Consulting lessons. M4 is done for the six starter lessons (PE-L01, PE-L02, VC-L01, VC-L02, CO-L01, CO-L02) in `content/career-lessons-v2.json`, every number recomputed from the case exhibits by `tests/smoke_lessons_v2.cjs` and `tests/smoke_lessons_v2_more.cjs`. M6 is done as a Next-up card at the top of Study (`career-nextup.js`). Not started: PE-L03 to PE-L06 and the other v1 lessons in the new format, the Skill Map, foundations (M7), the interview layer (M8). Watch segments: PE-L01 and PE-L02 have no usable chapters, so they play from the start; the other four use the video owner's own chapter markers (`segment_basis: publisher_chapters`) and say they were not yet watched and verified by a person.


**Purpose:** an honest audit of SELF Career Prep as it stands on `3165c04`, and a build plan that turns it into a programme that produces a top-quartile first-year analyst in PE, VC or strategy consulting. Written for Sonnet or Haiku to build from (§12), and for the owner to decide on.
**Method:**
- Read all 18 guided lessons, 12 evidence panels, 11 videos, 3 sprints, the 36-competency blueprint, the Director Review panels and the Work Sample index.
- Recomputed all 18 practice answers.
- Ran every Career Prep tab in Chromium and looked at what a learner actually sees.

**Honesty rules kept:**
- Simulated cases stay labelled SIMULATED.
- Self-check is never called expert review.
- No invented timestamps, screenshots, firm endorsements or hiring outcomes.
- Statements about the job market are practice-informed judgement as of 2025–26; verify firm-specific processes before relying on them.

---

## 1. Verdict

**Not yet masterclass-level, but the foundations are better than most paid courses.** The rigour and honesty are real. The cases have genuine decision tension (cash conversion versus EBITDA growth; retention hidden under ARR growth; capacity-constrained initiatives), every number checks out, and the provenance discipline is unusually good.

What's missing is the teaching layer between "here is a source" and "now you try". Today a lesson is a well-written explanation with:
- a hot-linked screenshot from a different company's model;
- a link out to a YouTube video with no timestamp;
- one arithmetic question that copies the worked example with new numbers.

A masterclass shows the idea with your own numbers, makes you build it in the format professionals use, makes you find the mistake a tired analyst would make, and brings it back three days later.

| Dimension | Score /10 | Evidence |
|---|---|---|
| Technical correctness | **9** | All 18 practice answers recomputed: all correct. The Aruna exhibit reconciles exactly (EBITDA 39 − interest 6 − tax 5.5 − ΔNWC 37 = CFO −9.5). The sprint formulas (levered FCF, cash tax floor, sweep, IRR from MOIC) are right. |
| Honesty and provenance | **9** | 41 sources with access notes, SIMULATED labels, "not blind assessment" disclaimers. One gap: 38 of 41 sources are `page_retrieved_title_matched_not_deep_review`. |
| Case design | **8** | Real tensions, realistic constraints (covenants, execution slots, cohort ages), Work Samples with no answer keys in the bundle. |
| Explanation and visualisation | **3** | No SELF-native visual anywhere. The lesson visual is a hot-linked publisher screenshot (JoeCo, not Aruna). It did not load in my test browser, and the data itself warns it "may be blocked by source browser policies". |
| Video integration | **3** | Videos open on YouTube from the lesson, with no start or end time. The four Wall Street Prep parts have zero verified chapters, so "watch the cash-flow part" leaves the learner hunting. Two Consulting videos have unverified durations. |
| Practice depth | **3** | Every practice is a single substitution. 12 of 18 mirror the worked example with swapped numbers, and some are trivial (CO-L06 is 7 − 3 − 4; PE-L06 subtracts two numbers given in the question). Multiple-choice distractors are often absurd ("Ya, jika chart berwarna", "Tambah animasi"). The PE lab prints the formula next to each input ("01 · 39 × 7"), so it tests typing, not thinking. |
| Feedback | **3** | Right or wrong plus a hint. No diagnosis of the specific mistake (sum instead of change, sign flip, balance instead of movement). |
| Retention | **1** | "Besok coba ingat" is a sentence, not a system. Nothing resurfaces. |
| Progress and mastery | **2** | Labs, Director Review and Work Samples are session-only by design. The learner can't see what they've mastered or what's next. |
| Competency coverage | **6** | All 36 competencies are *tagged*, but about 10 have no lesson that teaches them. PE-03 (normalising EBITDA) is tagged on an EV-vs-equity lesson. PE-11/12 (memo, defence), CO-10/11/12 (roadmap, decision ask, defence) and VC-02/10/11/12 are piled onto one lesson each and only practised elsewhere. |
| Job-market fit | **5** | The core technical spine is right. Missing are the foundations every track assumes, the interview layer, timed conditions, and 2026 skills (§3). |
| Experience and navigation | **5** | Ten tabs with no "what do I do next". Grouping them (R3) helped, but there's still no path. |

**Overall: about 5 out of 10 as a learning experience, on a 9 out of 10 content foundation.** The fastest gains come from the teaching layer, not new content.

## 2. What the learner actually experiences today (PE-L01, as rendered)
1. Title and exhibit text: "Aruna Supply Exhibit 01 (simulated): NWC 2023 Rp51bn, 2024 Rp73bn…"
2. Left column: analogy (a shop sells on credit), then "Yes, ini namanya Operating NWC", the definition, why it matters, and where the analogy stops.
3. Right column: a broken or blocked publisher image of JoeCo's LBO, "Buka sumber asli ↗", then "Watch → Build: Tonton bagian cash-flow…" and "Buka video terkait ↗".
4. Worked example: `73 − 51 = 22`.
5. Practice: "2024 Rp73bn and 2025 Rp110bn: kenaikan NWC?" (answer 37).
6. A multiple-choice question with one sensible option.
7. Build, Defend and Recall as three lines of text.

The order is roughly *explain → (external) show → watch elsewhere → compute once*. You asked for **video → explain with the right visual → industry-standard example tied to our points → let me try**. That instinct is right and matches the evidence on multimedia learning, worked examples and retrieval practice. I'd add a 30-second *predict* before the video and a *lock-in* after the practice. §5 specifies this.

## 3. Is it aligned with the 2025–26 job market?
In short: the **technical spine is right**, but a strong new hire is selected and judged on more than the spine. This is practice-informed and not firm-specific; check each target firm's current process.

| What recruiters and day-1 managers test | SELF today | Gap |
|---|---|---|
| Accounting: three statements and how they link; walk me through a DCF; EV vs equity | Assumed, partly covered inside PE | **No foundations stage.** Every track assumes it. |
| Excel speed and modelling hygiene (keyboard-only, blue inputs / black formulas, checks, no hard-codes) | Starter XLSX and a workbook structure check | **No drills, no timed build, no audit-a-model exercise** |
| PE: paper LBO (mental, ~10 min), 1–3 h LBO test, case study take-home, IC memo | Sprint, labs, Work Sample, Director Review | No **paper LBO**, no **timed** mode, memo writing not taught (only assigned) |
| VC: market maps, sourcing, thesis writing, metrics, cap tables incl. SAFEs/convertibles, deal-screening volume | Metrics, cohorts, cap table, waterfall, memo spec | No **market map / sourcing** practice, no SAFE or convertible math, no "screen 10 decks in an hour" |
| Consulting: case interviews (candidate-led and interviewer-led), case math under time, chart reading, brainstorming, personal experience interview; digital assessments widely reported (McKinsey Solve, BCG Casey-style chatbot cases) | Profit bridge, initiatives, deck storyline | No **live case practice with timer**, no **case-math or chart drills**, no **behavioural / PEI** prep |
| Behavioural / fit: "why this firm", STAR stories, a deal or market you follow | Absent | **Interview layer missing** |
| Commercial awareness (local): Indonesian listed companies, IDR units, OJK context, regional VC climate | One upgrade case uses Astra Otoparts filings | **No market-awareness habit** |
| 2026 reality: analysts use AI for first drafts, research and Excel, and are judged on catching its errors | Not addressed | **No "verify the AI" training**, a real differentiator |

## 4. "Best new hire in town": the Day-1 Analyst Standard
Make it concrete and measurable. A learner finishes when they meet these bars (all practicable in SELF):

1. **Builds** a five-year LBO from a blank sheet in ≤ 60 min with zero balance or check errors (timed mode, structure check).
2. **Paper LBO** within ±10% of the true IRR in ≤ 8 min, with no calculator for the core math.
3. **Explains** how the three statements link, and EV vs equity, in under 2 minutes each (recorded, self-scored against a rubric).
4. **Audits** a 40-row model and finds ≥ 5 of 6 planted errors in 20 minutes.
5. **Writes** a one-page memo or exec summary with the decision in the first line, three drivers, two risks with falsifiable gates, and the ask.
6. **Case math:** 20 problems at ≥ 90% accuracy in 10 minutes; reads a chart's "so what" in 30 seconds.
7. **Recall:** ≥ 90% on 150 technical flashcards, checked by spaced review over ≥ 3 weeks.
8. **Stories:** 6 STAR stories mapped to competencies; "why PE/VC/consulting" and "why this firm" under 90 seconds.
9. **Market:** 8 weekly Market Pulse entries (deal or news, the numbers, a 3-line view) to draw on in interviews.
10. **AI judgement:** given an AI-drafted memo with 3 planted errors (one numeric, one logical, one sourcing), finds all 3 and fixes them.

These become the **Skill Map** milestones (§8) and the finish line of the programme.

## 5. The Lesson Loop v2 (your flow, completed)
About 25–35 minutes, eight beats. Each beat is a component; lessons are data.

| # | Beat | What happens | Why |
|---|---|---|---|
| 0 | **Predict** (30 s) | A puzzle with the case numbers: *"Aruna's EBITDA rose 34% in 2025. Did its operating cash rise too?"* Pick an answer; it's kept. | Committing to a prediction makes the explanation stick and reveals misconceptions. |
| 1 | **Watch** (3–8 min) | The video embedded inline, starting and stopping at **verified** times, with 3 "watch for" prompts beside it. If times aren't verified yet, play from the start with the prompts and mark the segment "unverified". | Your step 1. A short, targeted segment beats a 66-minute link. |
| 2 | **See it** (3 min) | A **SELF-native animated visual with the case's own numbers**, built step by step. The analogy is a caption layer, and each new bar reveals "Yes, ini namanya …". | Your step 2, and the biggest missing piece today. Own visuals have no rights problems and match the case. |
| 3 | **How pros lay it out** (3 min) | An **exhibit replica**: our numbers in the industry-standard *format* (banker Sources & Uses, cash-flow bridge, cohort triangle, action-title slide), with numbered callouts mapped to the lesson's points, plus a link to the original source. Formatting conventions are shown (blue inputs, black formulas, checks row). | Your step 3, tied explicitly to *our* points rather than a screenshot of someone else's case. |
| 4 | **Worked example** (2 min) | Fully solved, steps expandable, each referencing a cell. | Worked examples come before independent practice for novices. |
| 5 | **Your turn: the ladder** (8–12 min) | **a. Complete:** fill 2 cells in a mini-grid, as a formula or a value. **b. Independent:** new numbers, no scaffold. **c. Twist:** change one driver and say what moves. **d. Red pen:** a junior's or an AI's calculation with one planted error. Find it, fix it. | Your step 4, with faded scaffolding and far transfer. The red pen is what managers actually do to analysts' work. |
| 6 | **Defend** (2 min) | One director question. Type or record (local only) an answer, then compare against 3 model points with a self-score. | Interviews and ICs test explanation, not arithmetic. |
| 7 | **Lock in** (1 min) | 3 flashcards go to the review queue, the build output goes on the workbook checklist, and the prediction from beat 0 is revisited ("You said… here's why"). | Spacing and closure. |

### 5.1 Fully specified example: PE-L01 "Laba naik, tapi kas hilang?" rewritten
All numbers are from `content/career-cases/pe/exhibits/exhibit-01-historical.csv` (SIMULATED).
- **Predict:** "EBITDA naik dari Rp29bn ke Rp39bn (+34%). Kas dari operasi 2025?" Options: naik / kurang lebih sama / **negatif**.
- **Watch:** V03 (Wall Street Prep, Cash Flow Statement and Debt Schedule). Start and end times are to be verified by a human, not invented. Watch for: (1) where working capital enters the cash flow; (2) why repayment uses cash, not EBITDA; (3) what happens when cash is short.
- **See it:** waterfall for 2025, in Rp bn:
  `EBITDA 39 → − interest 6 → − tax 5.5 → − ΔNWC 37 → CFO −9.5 → − capex 13 → FCF −22.5 → + net new debt 23 → change in cash +0.5`.
  ΔNWC then expands into its parts: `receivables +25 (50→75) · inventory +22 (58→80) · payables −10 (35→45, a source)`.
  Caption layer: the shop analogy, then "Yes, ini namanya **Operating Net Working Capital**", and where the analogy breaks (late payment isn't the same as bad debt; see the aging exhibit: Rp16bn of receivables past 90 days).
- **How pros lay it out:** a cash-flow bridge in model format (rows: EBITDA, cash interest, cash tax, (increase)/decrease in NWC, CFO, capex, FCF, net debt issuance, change in cash, check row = 0). Callouts: ① NWC is shown as an *(increase)* in brackets, a use of cash; ② tax is cash tax, not book tax; ③ the check row ties to the balance sheet's cash movement (13.04 → 13.54).
- **Worked:** 2023→2024 ΔNWC = 73 − 51 = 22.
- **Ladder:**
  - **a. Complete:** grid with AR, inventory and AP for 2024 and 2025. Fill `ΔNWC 2025` as `=(C5+C6−C7)−(B5+B6−B7)` or 37.
  - **b. Independent:** "Build CFO 2024 from EBITDA 29, interest 4, tax 3.96, ΔNWC 22." (−0.96)
  - **c. Twist:** "If receivables were held at 2023's share of revenue (34/240 = 14.2%), how much cash would 2025 have kept?" (75 − 345 × 34/240 = 75 − 48.9 = **≈ Rp26.1bn**)
  - **d. Red pen:** a junior's bridge shows CFO **64.5** because ΔNWC was *added*. Find the row and fix the sign.
- **Misconception feedback** for the ΔNWC answer: 183 means "you added two balances; change = end − start"; −37 means "the sign is right for the cash flow, but the question asks for the size of the increase"; 110 means "that's the 2025 balance, not the change"; 22 means "that's the 2024 change".
- **Defend:** "Profit up, operating cash negative. What three data requests do you send before buying?" Model points: receivables aging by customer and segment plus the disputes list; inventory aging and turns by SKU plus the obsolescence reserve; supplier terms and any stretched payables.
- **Lock in:** cards "ΔNWC sign in CFO", "Why EBITDA ≠ CFO", "Three diligence asks for cash conversion".

## 6. Native visual library (`career-visuals.js`)
SVG components that render the case data, animate step by step (respecting reduced motion), are keyboard-navigable, and come with a text description for screen readers. Every visual has a "data" view: the same numbers as a table.

| Component | Used by | Behaviour |
|---|---|---|
| `Waterfall` | EBITDA→CFO→FCF, profit bridge (Consulting), EV→equity bridge | Bars appear one by one; clicking a bar expands its parts; the totals line ties out. |
| `BalanceBars` | Sources & Uses | Two stacked columns that must reach the same height; a red gap shows the plug. |
| `RollForward` | Debt schedule, cash, NWC | Beginning + adds − uses = ending, animated per year. |
| `CohortTriangle` | VC retention, NRR and GRR | Heat-map triangle; hover a cell to see its formula and age. Same-age columns are highlighted to fight the classic mistake. |
| `CapTable` | VC rounds and dilution | Ownership donut that re-slices round by round; an option-pool toggle. |
| `Waterfall2` (liquidation) | VC preferences | Exit value slider; who gets paid first, by stack. |
| `Funnel` / `Sizing` | Market sizing (TAM→SAM→SOM), CO-03 | Multiplicative steps with units shown at each step. |
| `IssueTree` | CO-02 | Collapsible tree; "MECE check" highlights overlaps flagged in the data. |
| `Sensitivity` | PE-08/09, VC exits | A 2D grid with the hurdle contour; the max bid is shown where it meets the target. |
| `SlideFrame` | CO-09 | An action title above a single exhibit; compare a "bad title" with a "conclusion title". |

## 7. Practice engine
- **Mini-grid** (`career-grid.js`): a small spreadsheet (≤ 12 × 8) where cells accept numbers or formulas with `+ − × / ^ ( ) SUM MIN MAX ROUND` and cell references. The check is on the **value**, and optionally on **references** (to catch hard-codes): "C8 must reference C5:C7, not type 37". Cells show inputs in blue and formulas in black, matching modelling convention.
- **Ladder** of four rungs per lesson (§5). A rung unlocks after the previous attempt, whether right or wrong.
- **Misconception table** per question: wrong value or pattern mapped to specific feedback. Generic feedback is the fallback.
- **Hints in three levels** (concept → method → solution), recorded per attempt. The Skill Map treats "solved with a solution reveal" differently from "solved alone".
- **Red-pen items:** a plausible wrong artefact (a calculation, a memo paragraph, a slide title) with exactly one planted flaw. The learner marks the location and writes the fix. It is checked on location, with the fix self-scored against the model correction.
- **Timed mode:** for labs and Work Samples. A timer, no hints, results compared to target times. The learner chooses it; it is never forced.
- **Better multiple choice:** every distractor is a real misconception ("NRR above 100% means no churn"), never an absurdity.

## 8. Retention and mastery
- **Review queue** (`career-review.js`): a simple spaced schedule (SM-2-lite: 1, 3, 7, 16, 35 days, adjusted by "easy/hard"). Cards come from lessons' lock-in, Market Pulse entries and Story Bank cues. Shown in **Today** as a 5-minute "Daily Drill" (already planned as U6). Local first; synced in Wave 2.
- **Skill Map** (planned in U6): 36 competencies plus the 10 Day-1 bars. Each cell shows *taught by* (lesson / lab / sample), *practised* (ladder results, hint level), *proved* (artefact in Proof Pack) and *reviewed* (spaced recall streak). There are no percentages pretending to be certification.
- **One path, not ten tabs:** Study opens on **"Next up"**: the next lesson in the learner's chosen track, its time and why it's next, plus "continue where you left off". Tabs become the Library.

## 9. Curriculum v2: four stages
| Stage | Content | New or existing |
|---|---|---|
| **0 · Foundations** (shared, about 2 weeks) | F1 three statements and linking; F2 accruals vs cash; F3 EV vs equity and net debt; F4 unit economics; F5 DCF intuition and comps; F6 Excel standards and keyboard drills; F7 mental math and case math | **New**, 7 lessons in Loop v2 |
| **1 · Track core** | Current PE, VC and Consulting lessons, rebuilt in Loop v2, plus the missing teaching lessons: PE-03 EBITDA normalisation; PE-11 memo anatomy; VC-02 founder evidence; VC-10 diligence gates; VC SAFEs and convertibles; CO-10 90-day roadmap; CO-11 the decision ask; Paper LBO; VC market map | Existing 18 rebuilt plus 9 new |
| **2 · Proof** | Labs (formulas hidden until a hint is requested), Work Samples in timed mode, the public-filings upgrade case (Astra Otoparts), Proof Pack | Existing, upgraded |
| **3 · Interview and Day-1** | Technical Q bank (spaced), Story Bank (STAR), Case Room (live case with timer, interviewer prompts arriving over time), **Deal Room** (§10), Market Pulse, AI Red Pen, Day-1 Playbook | **New** |

## 10. Signature experiences (the creative part)
- **Deal Room (3-hour simulation).** A scripted, timed case where "emails" arrive while you work. At 0:40, "Partner: rerun at 7.5×". At 1:30, "Seller revised 2025 receivables, see attachment". At 2:30, "IC moved to 30 min from now; send the one-pager". Your final outputs are compared with the brief's checklist. Purely local, deterministic, and closest to real analyst life.
- **Model X-ray.** In any lab, hover a number to trace its precedents (which inputs and formulas feed it). This teaches auditing and makes the logic visible.
- **AI Red Pen.** An AI-style draft memo or calculation with three planted errors (numeric, logical, sourcing). Find and fix all three. This trains the 2026 skill of using AI as a draft and owning the check. SELF still doesn't call any AI; the drafts are authored content.
- **Explain like a VP.** A 60-second recorded answer (local MediaRecorder, never uploaded; explicit opt-in) with a 4-point self-rubric. You can play it back next to the model points.
- **Ghost benchmark.** Each timed task shows a target time and your previous best, never a fake leaderboard.
- **Market Pulse.** Weekly: pick a deal or news item (Indonesian or regional), log 3 numbers and a 3-line view. These become interview material and review cards.
- **Story Bank.** STAR stories tagged to competencies, practised on a spaced schedule; ties into Studio's Story Bank recipe and Game Day.

## 11. Video curation fixes
1. **Verify start and end times** for the WSP parts used by lessons. This must be done by a person watching, or with a transcript from the publisher; never invented. Until then, show "segment not verified: watch from the start, these three prompts tell you what to look for".
2. Verify the two Consulting durations, or replace those videos.
3. Add vetted **foundations** videos (three statements, DCF intuition, Excel shortcuts) with the same verification fields, and a **paper LBO** walkthrough.
4. Embed inline using the existing privacy-respecting "load only on Play" behaviour, with `start`/`end` parameters when verified.
5. Keep "teaches" / "do this right after" per video. That part is already good.

## 12. Build plan for Sonnet / Haiku
Each phase is one PR, with no Supabase changes unless noted. All existing Career Prep tests must keep passing.

| Phase | Scope | Model |
|---|---|---|
| **M1 Lesson Loop v2 shell** | A new lesson renderer in `career-teaching.js` with the 8 beats driven by data. Old lessons render through a compatibility mapping (analogy and term → See it caption; panel → How pros lay it out link; practice → ladder rung b). | Sonnet |
| **M2 Visual library** | `career-visuals.js` with Waterfall, BalanceBars, RollForward, CohortTriangle, CapTable, Sensitivity (SVG, reduced motion, table fallback, aria descriptions). Unit tests for the geometry: bars sum to totals; the triangle aligns ages. | Sonnet |
| **M3 Practice engine** | `career-grid.js` (formula parser with no `eval`, sandboxed arithmetic) plus ladder, misconception table, hint tracking and red-pen items. Tests: parser fixtures (≥ 40), reference-checking, misconception routing. | Sonnet |
| **M4 Content: rebuild the 6 starter lessons** | PE-L01, PE-L02, VC-L01, VC-L02, CO-L01, CO-L02 in schema v2 (§13), with all numbers from the existing case exhibits and verified by a numeric test. | Sonnet (content) and Haiku (fixtures) |
| **M5 Review queue and Daily Drill** | `career-review.js` (localStorage, try/catch), shown in the Today room; Skill Map v1 reading lesson and ladder results. | Haiku |
| **M6 Next-up path** | Study opens on "Next up" plus progress; tabs become Library. | Haiku |
| **M7 Foundations and the 9 missing lessons** | Content authoring with sources, then human review before release. | Sonnet plus a human reviewer |
| **M8 Interview layer** | Q bank, Story Bank, Case Room timer, Deal Room engine (scripted events), AI Red Pen. | Sonnet |
| **W2 (optional, approved separately)** | One additive migration: `career_learning_progress(user_id, item_id, kind, result, hints, at)` to sync review and mastery across devices. | Integrator |

**Prompt template (paste per phase):**
> Read `AGENTS.md`, `docs/design/CAREER_PREP_MASTERCLASS_PLAN.md` (this phase's section) and the current Career Prep code (`career-learning.js`, `career-teaching.js`, `content/career-teaching.json`). Build phase **M?** exactly as specified. Use only numbers that exist in `content/career-cases/**` and prove them with a test that recomputes each one. Keep every SIMULATED label and disclaimer. Do not embed external images; use SELF-native visuals. Run every test in `.github/workflows/self-quality.yml` and the Chromium suites, then paste the output into a draft PR.

## 13. Lesson schema v2 (additive to `content/career-teaching.json`)
```json
{
  "id": "PE-L01", "version": 2, "track": "PE", "competencies": ["PE-01","PE-05"], "minutes": 30,
  "predict": {"question": "...", "options": ["naik","kurang lebih sama","negatif"], "answer_index": 2, "reveal": "..."},
  "watch": {"video_id": "V03", "start": null, "end": null, "segment_verified": false, "watch_for": ["...","...","..."]},
  "see_it": {"component": "Waterfall", "data_ref": "pe/exhibit-01#2025", "steps": [{"label":"EBITDA","value":39,"term":"EBITDA"}],
             "analogy": "...", "term_reveal": "Operating Net Working Capital", "analogy_limit": "..."},
  "pro_layout": {"format": "cash_flow_bridge", "rows": [], "callouts": [{"n":1,"row":"(Increase) in NWC","point":"..."}],
                 "original": {"source_id": "S02", "url": "...", "note": "format reference; SELF numbers"}},
  "worked": {"steps": [{"text":"...","cell":"C8","formula":"=C7-B7","value":22}]},
  "ladder": [
    {"rung":"complete","grid":{}, "expect":{"C8":{"value":37,"refs":["C5","C6","C7","B5","B6","B7"]}}},
    {"rung":"independent","question":"...","expected":-0.96,"tolerance":0.01,"unit":"Rp bn"},
    {"rung":"twist","question":"...","expected":26.125,"tolerance":0.2,"unit":"Rp bn"},
    {"rung":"red_pen","artefact":{},"flaw":{"row":"(Increase) in NWC","fix":"subtract 37"}}
  ],
  "misconceptions": [{"value":183,"feedback":"..."},{"value":-37,"feedback":"..."},{"value":110,"feedback":"..."}],
  "hints": ["concept","method","solution"],
  "defend": {"prompt":"...","model_points":["...","...","..."]},
  "lock_in": {"cards":[{"front":"...","back":"..."}], "build_output":"..."},
  "source_notice": "Kasus Aruna seluruhnya SIMULATED…"
}
```
**Test gate:** `tests/smoke_lessons_v2.cjs` recomputes every expected value from the exhibits, checks that every `data_ref` resolves, that no distractor is a duplicate or blank, that each lesson has all 8 beats, and that no external image URL is used as a visual.

## 14. What not to do
- Don't add more tabs or more links out before the loop exists. Depth beats breadth.
- Don't show percentages that look like certification. Show evidence.
- Don't let a lab print the formula before the attempt.
- Don't invent video timestamps, firm processes or salary data.
- Don't upload recordings or call an AI service without explicit approval.
