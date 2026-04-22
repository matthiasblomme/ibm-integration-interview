# Implementation plan

Living document that tracks planned changes to the app — data schema, UI, scripts
and workflows. Entries are added when a decision is made and moved to **Done**
once shipped.

Format per entry:

- **Status** — Planned / In progress / Done
- **Motivation** — why the change
- **Schema change** — data shape impact, if any
- **Data work** — follow-on content changes (fields to populate, etc.)
- **UI** — user-visible changes
- **Scripts / tooling** — markdown export, CI checks, etc.
- **Notes** — open questions, risks, rollout

---

## Intended use cases

What this app is for shapes what we build. Current known audiences:

1. **Interviewer aid during a live interview** — the interviewer opens the
   app on a second screen, searches / filters to the next area, reveals
   answers as they listen. Current design already supports this well.
2. **Engineer self-study** — an engineer drills on their own weak spots
   using Browse + Quiz, persists progress locally. Current design supports
   this; the Short/Long and MCQ entries below make it better.
3. **Candidate-facing assessment** — a candidate is given a link and
   completes a timed, graded quiz. This is a **materially different mode**:
   answers must not be visible before submission, sessions need isolation
   and reporting, and the question bank can't be trusted to stay on the
   client. See the "Candidate-facing assessment mode" entry below.
4. **Team lead / capability mapping** — run the same questions across a
   team, see where the collective gaps are (security, clustering, cloud…).
   Needs aggregated reporting; realistically layered on top of (3).
5. **Onboarding / training path** — new hires follow a guided sequence
   through the bank, with progress tracked and handed back to a manager.
   Shares the most with (2) + (4).
6. **Conference talk / workshop source** — the bank as a reference for
   preparing talks and workshops. Current read-only browse is enough;
   nothing extra to build.

Decisions that flow from this:

- Keep the current UI strongly tuned to use cases 1 and 2 (fast to browse,
  answers visible on click, client-side only, zero setup).
- Treat use case 3 as a separate mode (and probably a separate deployment
  target), not a toggle — the trust model is fundamentally different.
- Use cases 4 and 5 are extensions on top of 3 once it exists.

---

## Active

### Short / long answer versions + UI toggle

- **Status:** Planned
- **Motivation:** Several questions (RDQM, Native HA, Uniform Cluster,
  Transactionality, Persistence…) have deep answers that are great for learning
  but too long for quick revision or as a flashcard prompt. Offer a short
  version for scanning and a long version for study, with the reader choosing.
- **Schema change:** Add an optional `answerBulletsShort: string[]` (≤ 3–4
  bullets, tight one-liners) to `Question` in `src/types.ts`. The existing
  `answerBullets` + `answerExplanation` remain the long version and stay
  required. Backfill is gradual — questions without a short answer fall back
  to the long one in the UI.
- **Data work:** Populate `answerBulletsShort` for every existing question,
  drafted from the long answer. Batch per section so review stays focused.
- **UI:**
  - Sidebar (or a compact header control) with a two-way toggle **Short / Long**.
  - Preference persisted to `localStorage` like the theme; applied on initial
    render to avoid flicker.
  - `QuestionCard` and `FlashCard` read the preference and render short or
    long accordingly. If short is selected but not populated for a question,
    render long and show a subtle "long only" indicator (not an error).
- **Scripts / tooling:** `scripts/json-to-md.mjs` emits both versions when
  present — e.g. `**Short answer:**` bullet block followed by the existing
  full answer under `**Answer:**`. `scripts/check-references.mjs` / the CI
  "stale markdown" check picks up the new field automatically because the
  export is deterministic.
- **Notes:**
  - Keep the short bullets strictly under ~15 words each — if it needs more,
    it belongs in the long version.
  - Flashcard mode should probably default to Short for the question stem
    and Long on reveal, regardless of the global toggle — decide during
    implementation.
  - Deferred decision: whether to add a similar split for `answerExplanation`
    (e.g. `answerExplanationShort`). Default position: keep one explanation,
    suppress it entirely in Short mode.

### Multiple-choice / checkbox answers (auto-graded quiz mode)

- **Status:** Planned
- **Motivation:** Many questions have a small, enumerable set of correct
  answers (e.g. "the three MQPER_* values", "which commands are standalone
  only", "is DEFPSIST enforced"). For those, a multiple-choice or multi-select
  checkbox format lets the quiz auto-grade instead of relying on self-rating,
  which is both more rigorous and more fun. Free-text self-rate stays as the
  default for open-ended questions that genuinely need it.
- **Schema change:** Add two optional fields to `Question` in `src/types.ts`:
  - `answerType: 'free' | 'single' | 'multi'` — defaults to `'free'` (current
    behaviour) so existing questions need no change.
  - `choices?: { text: string; correct: boolean; explanation?: string }[]` —
    required when `answerType` is `'single'` or `'multi'`. `explanation` is
    optional per-choice feedback shown after the user picks.
- **Data work:**
  - Pick ~20 existing questions suitable for auto-grading and add `choices`
    to them (persistence, MQPER_*, MI vs HA, LTS vs CD, AKS/EKS, parsers,
    etc.). Write 4–6 options per question, with 1 correct (single) or 2–3
    correct (multi).
  - Teaching content (`answerBullets` + `answerExplanation`) stays — it's
    shown after the user submits, the same way the current flashcard reveal
    works. Choices don't replace the answer, they gate the reveal.
- **UI:**
  - Quiz mode detects `answerType`. If `single` → radio buttons, if `multi`
    → checkboxes, else existing reveal-and-self-rate flow.
  - On submit: highlight correct/incorrect picks, show per-choice
    `explanation` if provided, then show the full `answerBullets` +
    `answerExplanation` like today's reveal. Record the result (correct /
    partial / wrong) in the same `QuizProgress` structure used by self-rate,
    so weak-spot prioritisation continues to work.
  - Browse mode: when `choices` is present, render the options under the
    question and visually mark the correct ones when expanded.
  - Quiz configure screen: add a filter "include auto-graded / include
    free-text / both" so users can restrict a session to auto-graded drills.
- **Scripts / tooling:** `json-to-md.mjs` renders choices as a checkbox/
  radio-looking Markdown list with correct answers annotated (e.g. `- [x]`
  for correct, `- [ ]` for wrong); that keeps the markdown export
  self-describing. Reference-check script is unaffected.
- **Notes:**
  - Storage: the quiz progress rating set becomes `got-it | unsure | missed
    | correct | partial | wrong`, or we map auto-graded results onto the
    existing three buckets (correct→got-it, partial→unsure, wrong→missed).
    Decide during implementation — mapping keeps the data model simpler.
  - Some questions have a "best answer" rather than strictly one correct
    answer (e.g. parser choice). Use `answerType: 'single'` with a clear
    `correct: true` on the best option and per-choice `explanation` on the
    near-misses so the nuance is surfaced rather than lost.
  - Consider a separate question-authoring helper later — writing 4
    plausible wrong choices per question is the time-consuming part.

### Pending question drafts

- **Status:** Planned (drafts authored, waiting on review)
- **Motivation:** Questions drafted in response to review-side requests that
  aren't ready to merge into the main bank until the author has checked
  them. Keeps `src/data/questions.json` clean.
- **Location:** [drafts/pending-questions.md](drafts/pending-questions.md)
- **Current batch (10):** callable-flow switch server in SaaS, fried vs
  baked, grouping nodes, sequencing nodes, CSV parser choice, App Connect
  runtimes, App Connect Operator (intro), ESQL `[>]`/`[<]`, Transformation
  Advisor, ACE MQOutput persistence property.
- **Workflow:** author reviews the drafts in place, annotates with
  keep/tweak/rewrite, then each approved draft is moved into
  `src/data/questions.json` and deleted from the pending file.

### Normalise reference links to latest product versions

- **Status:** Planned
- **Motivation:** References in `questions.json` currently point at a mix of
  product-doc versions (e.g. `ibm-mq/9.2.x`, `9.3.x`, `9.4.x`,
  `app-connect/11.0.0`, `13.0`, `13.0.x`). Where a newer version of the same
  page exists, we should point at it so readers land on current content —
  and the exercise also catches broken or moved links.
- **Schema change:** None.
- **Data work:** Walk every `references` URL on every question. For each
  IBM-hosted link, check whether a newer version of the same topic exists
  (e.g. swap `9.2.x` for the current supported version, `11.0.0` for `13.0`)
  and update the URL if so. Keep older links only when the newer page
  genuinely doesn't exist or the content meaningfully differs.
- **UI:** None.
- **Scripts / tooling:** Extend the existing `scripts/check-references.mjs`
  with a "latest-version" advisory mode — it already verifies links are
  reachable, so adding a check for "is there a newer version path that
  also resolves" is a natural extension. Keep it non-fatal (warnings in CI,
  not hard failures) so old-version links used deliberately don't block PRs.
- **Notes:**
  - Not every IBM docs URL pattern is predictable — some pages move topics
    between versions, so the script should verify the candidate URL before
    recommending a swap.
  - Run this as a dedicated pass once, then keep the advisory in CI so new
    references get nudged to current as they're added.

### Candidate-facing assessment mode

- **Status:** Planned (larger, separate track — not a simple toggle on the
  current app)
- **Motivation:** Extend the app so a candidate can take a timed, graded
  quiz and an interviewer gets a usable report afterwards. The current
  design assumes the person using the app is already trusted (interviewer
  or engineer studying), so answers are visible on click and the question
  bank ships to the browser. A candidate-facing flow flips both of those
  assumptions.
- **Schema change:** Questions targeted for candidate-facing use must have
  **MCQ or checkbox** answers (see the "Multiple-choice / checkbox
  answers" entry) so grading is automatic and deterministic. Free-text
  self-rated questions don't fit this mode.
- **Data work:** Tag a subset of questions as `assessment: true` (or
  similar) once the field exists, drawn only from questions that have
  `answerType: 'single' | 'multi'`. Curate per role (Admin / Dev) and
  per difficulty so templates can be drawn without handpicking each time.
- **UI:**
  - **Distinct mode / route** (probably a separate deployed build) rather
    than a toggle on the existing app — keeps the trust boundary clean.
  - Candidate flow: enter a token / session link → instructions →
    per-question timer → no answer reveal before submit → submit to
    server → final 'thank you' page.
  - Interviewer flow: create an assessment (pick questions or a template,
    set time limit, generate a one-time link) → monitor status → view
    report (score overall, score per topic, per-question correct/wrong,
    time taken, flagged integrity events like tab-switch if we capture
    those).
- **Scripts / tooling:** Needs real **backend** — can't rely on the
  static SPA. Question bank, grading logic and session state have to
  live server-side to prevent tampering and leaking the correct
  answers. Most minimal shape: small Node service backed by a DB
  (SQLite / Postgres), signed session tokens, question-content endpoint
  that never returns the `correct` flags until submission.
- **Notes:**
  - Security posture needs real thought: rate limits, token expiry,
    prevent re-using a completed link, optional IP / device binding.
  - Anti-cheat in a pure-browser context has hard limits — be honest
    about what the tool does and doesn't claim to detect.
  - Questions used in candidate assessments should probably NOT be the
    exact questions published on the study site (or at least, a subset
    should be kept private) — otherwise the "study app" becomes an
    answer key.
  - Roll it out as a separate repo / subdomain so the open study site
    stays fully static and public.
  - Likely pairs with "Aggregated team reporting" as use case (4) once
    assessment mode exists — deferred until then.

---

## Done

_(none yet — populated as entries are implemented and merged)_
