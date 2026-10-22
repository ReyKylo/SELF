# Phase 5 — Director Review: decision defense
**SIMULATED / ORIGINAL SELF LEARNING CONTENT · 2026-10-22**

## Scope and readiness
This is the **original educational content contract**, paired with a browser-local Director Review UI merged into `main` on 22 October 2026 (commits `4342375` and `dd48055`). It follows the three Phase 4 Analyst Labs (Aruna PE, ArusOps VC, SajiRasa Consulting). Automated CI and isolated Chromium tests passed. **Live Cloudflare deployment and authenticated real-device UI have not been verified.** No Supabase schema changes or production data writes were required.

**Outcome:** a candidate can defend an independently prepared investment/strategy decision against adversarial but evidence-based questions, without being coached into the reference answer. The exercise tests judgment and evidence as well as arithmetic.

### The everyday analogy, then the professional vocabulary
Bayangin lu mengusulkan beli toko yang kelihatan ramai. Pemilik modal bertanya: "Kalau omzet naik tapi uang kas habis, kenapa gue harus beli?" Lu tidak cukup mengulang hitungan; lu harus menjelaskan mekanisme, menunjukkan risiko, dan menyebut bukti apa yang akan mengubah pikiran lu. **Yes, ini namanya Investment Committee Defense (PE), Partner Review (VC), dan Executive Steering Committee / CEO Challenge (Consulting).** Kuncinya bukan menang debat: justru mengubah keputusan secara rasional ketika data baru lebih kuat.

## Learner journey
1. **Freeze:** learner selects a track and submits initial decision, model reference, evidence ledger, explicit unknowns and 2–3 material sensitivities. Do not display a model answer before this submission.
2. **Cross-examine:** present 5 fixed, track-specific challenge prompts from `review-panels.json`, one at a time; collect 80–160 words or an equivalent inspectable written derivation for each.
3. **Counterfactual:** introduce one explicitly *simulated new information* twist after first five responses. Learner must update or defend decision and cite the precise threshold that changed (or did not change) the recommendation.
4. **Red team:** require the learner to argue the strongest reasonable opposite case, followed by falsifiable diligence/implementation gates.
5. **Decision memo:** 1-page final recommendation with numerical anchors, conditions, downside, and requested approval.
6. **Human review:** use rubric below, annotate claims with evidence from Phase 4 artifacts; passing arithmetic does not automatically certify executive judgment.

**Privacy guard:** do not put blind key, private learner uploads or hidden grading solutions inside publicly shipped JS/JSON. This packet intentionally contains prompts and criteria only.

## Three boardroom situations
- **PE — Aruna Supply:** IC chair questions funding reconciliation, conversion of accounting earnings to debt-service cash, five-year leverage downside, and ceiling purchase price. Preserve distinctions between EV, seller proceeds, equity cheque, sponsor IRR, MOIC, cash floor, liquidity and covenants.
- **VC — ArusOps:** Partner questions cohort comparability, gross/net retention, acquisition payback on *gross profit*, runway, preference waterfall versus headline ownership and funding dilution. An attractive growth rate is not an investment conclusion.
- **Consulting — SajiRasa:** CEO questions historical-to-run-rate comparability, the profit bridge, causality versus observed change, initiative interaction, the IDR1,800m upfront budget and seven execution slots, and credible 90-day kill/scale gates. Annualized steady-state benefit is not 90-day realized cash.

## Consistent rubric — 100 points (SELF internal, not an external firm's rubric)
| Dimension | Points | Observable evidence |
|---|---:|---|
| Technical/numeric integrity | 30 | Reconciled model; explicit units, time periods and denominator; scenario checks |
| Judgment | 25 | Coherent invest/pass/conditional decision; opportunity cost and credible alternative |
| Evidence discipline | 20 | Case exhibit citations, fact/assumption/inference labels, no invented verification |
| Risk and counterfactual | 15 | Downside, triggers, and revised decision when evidence changes |
| Executive communication | 10 | Action-first concise answer, specific decision ask and implementation gate |

**Draft candidate threshold:** at least 80/100, technical at least 24/30, evidence at least 14/20, no critical numeric or ethical failures. A reviewer must verify actual learner work. Failing a critical gate overrides the total score.

**Critical gates:** any missing or inconsistent base financial reconciliation, EV/equity/proceeds mix-up, undisclosed year/unit confusion, hindsight leakage presented as original underwriting, double-counted savings, fabricated source, or material answer contradicted by exhibits requires correction before pass.

## Evaluation behavior
Feedback should quote the relevant *learner's own* statement and explain what is missing. Do not infer competency from answer length. A good answer may legitimately say "insufficient evidence: seek diligence" with a measurable gate. Do not hallucinate original file contents, expert endorsement or actual recruiter evaluation.

A director's score is a **reviewer judgment**, not deterministic proof. Numeric test suites in the existing repo check example calculations, not the learner's private spreadsheet.

## Historical integration contract (implemented in PR #29; production acceptance still open)
- Expose a **Director Review** route under existing Career Prep navigation, without redesigning current features.
- Read `review-panels.json` as *public challenge prompts only*. Isolate submissions by authenticated learner if persistence is approved; otherwise explicitly label local session mode.
- Collect frozen original response before showing challenge 2; track answered/unanswered prompts. Never auto-mark vague free text as correct.
- Export an inspectable decision-defense dossier (prompts, responses, original vs final recommendation, rubric and source references).
- CI: verify schema, 3 tracks × 5 unique challenges, twist per track, weighted rubric=100, distinct critical gates; check no answer key shipped. Add accessibility keyboard/label checks.
- Integration and deploy require their own reviewed authorizations; this worker changes neither shared app files nor Supabase.

## Known limitations and acceptance
A browser-local UI is implemented and available in GitHub `main`, with no recorded oral defense, persistent drafts, automatic spreadsheet checker, professional certification, or actual learner scoring. The original test suite covers the isolated module, not a fully authenticated production session. Do **not** claim production launch until the checks in [PHASE5_PRODUCTION_RELEASE_GATE.md](./PHASE5_PRODUCTION_RELEASE_GATE.md) are evidenced.
