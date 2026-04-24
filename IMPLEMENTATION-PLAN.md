# Implementation plan

Living document that tracks planned changes to the app, data schema, UI, scripts
and workflows. Entries are added when a decision is made and moved to **Done**
once shipped.

## Current status

**Bank:** 125 questions in `src/data/questions.json` (latest: `ace-adm-040`
TAD). Export regenerated from JSON via `npm run gen:md` into
`interview_questions.md`.

**Working tracks:**

- **Pending drafts review** (this plan entry "Pending question drafts"):
  the 10-item batch has been walked, 9 graduated, 1 dropped. 3 stubs
  remain in `drafts/pending-questions.md` awaiting authoring (OTel, cache
  options, Designer-local).
- **Blog-sourced candidates** (`drafts/blog-sourced-candidates.md`): 75
  items with the author's verdicts filled in. User-half of the T items
  (16) walked interactively and graduated. Helper-half of the T items
  (16) sent out in `drafts/blog-tweaks-helper.md`, awaiting return. K
  items (22) still need batch-drafting into `questions.json`.
- **Bob-sourced candidates** (`drafts/bob-sourced-candidates.md`): 79
  items generated from internal guidelines; Verdict column still empty,
  awaiting author pass.
- **25 farmed-out review batch** (`D:\tmp\review-batch-25.md`): sent to
  an external reviewer, awaiting return.

**Project-wide rules in force:**

- Em dashes forbidden anywhere in the repo (swept once, script kept at
  `scripts/em-dash-sweep.mjs` for future re-runs).
- Every question carries `references` where authoritative links exist.
  `scripts/check-references.mjs` (with advisory mode, pending) runs in CI.
- Answers are written as bullets + short explanation paragraph, in a
  "what an interviewer listens for" style.

**Schemas now live:**

- `answerBulletsShort?: string[]` on `Question` for the Short/Long toggle
  (populated gradually).
- `answerType?: 'free' | 'single' | 'multi'` + `choices?: Choice[]` for
  MCQ / checkbox auto-grading (two samples land: `mq-adm-027` and
  `ace-adm-029`, plus the ESQL MCQ `ace-dev-026`).

---

Format per entry:

- **Status**: Planned / In progress / Done
- **Motivation**: why the change
- **Schema change**: data shape impact, if any
- **Data work**: follow-on content changes (fields to populate, etc.)
- **UI**: user-visible changes
- **Scripts / tooling**: markdown export, CI checks, etc.
- **Notes**: open questions, risks, rollout

---

## Intended use cases

What this app is for shapes what we build. Current known audiences:

1. **Interviewer aid during a live interview**: the interviewer opens the
   app on a second screen, searches / filters to the next area, reveals
   answers as they listen. Current design already supports this well.
2. **Engineer self-study**: an engineer drills on their own weak spots
   using Browse + Quiz, persists progress locally. Current design supports
   this; the Short/Long and MCQ entries below make it better.
3. **Candidate-facing assessment**: a candidate is given a link and
   completes a timed, graded quiz. This is a **materially different mode**:
   answers must not be visible before submission, sessions need isolation
   and reporting, and the question bank can't be trusted to stay on the
   client. See the "Candidate-facing assessment mode" entry below.
4. **Team lead / capability mapping**: run the same questions across a
   team, see where the collective gaps are (security, clustering, cloud…).
   Needs aggregated reporting; realistically layered on top of (3).
5. **Onboarding / training path**: new hires follow a guided sequence
   through the bank, with progress tracked and handed back to a manager.
   Shares the most with (2) + (4).
6. **Conference talk / workshop source**: the bank as a reference for
   preparing talks and workshops. Current read-only browse is enough;
   nothing extra to build.

Decisions that flow from this:

- Keep the current UI strongly tuned to use cases 1 and 2 (fast to browse,
  answers visible on click, client-side only, zero setup).
- Treat use case 3 as a separate mode (and probably a separate deployment
  target), not a toggle, the trust model is fundamentally different.
- Use cases 4 and 5 are extensions on top of 3 once it exists.

---

## Study-app feature roadmap (phased)

Drawn from a comparison with Anki, Quizlet, Duolingo, Brilliant, RemNote and
interview-specific tools (LeetCode, Interview Cake). Captures the features
those tools have in common that this app doesn't. Grouped into phases so
they can be picked up one at a time on future sessions.

Each phase lists its features with a high-level implementation sketch, not
file-by-file. When a phase starts, scope the specific files + tasks fresh.

### Phase 1: Foundation UX polish

- **Status**: Planned
- **Goal**: Cheap, independent wins that make the app feel more complete
  without touching the data model. Good warm-up before the bigger phases.
- **Rationale**: None of these features depend on each other or require a
  schema migration. They can all ship as small PRs and the app gets visibly
  better between each.

**Features**

- **Keyboard shortcut help overlay**: press `?` (or `/`) to open a modal
  listing every shortcut. New `src/components/HelpOverlay.tsx`, global
  keydown listener, gated by a `useState` + focus trap. Content is static.
- **Mastery dashboard**: on Home or a new `/progress` route, render a
  topic by product matrix showing the ratio of got-it vs total per cell,
  plus a top-level "N of <total> mastered" summary. Pure derivation from
  the existing `QuizProgress` + questions bank, no schema change. New
  component plus a small helper in [src/lib/storage.ts](src/lib/storage.ts).
- **Bookmarks / stars**: a "★" toggle on each `QuestionCard` and
  `FlashCard`. New `localStorage` key `ibm-interview-bookmarks-v1` storing
  `string[]` of question IDs. New filter "Bookmarked only" on Browse (and
  an Include option on Quiz). Small storage helper, one UI control.
- **Per-question notes**: freeform text area when a card is expanded in
  Browse. Persisted per-ID in `localStorage` under
  `ibm-interview-notes-v1` as `Record<string, string>`. Reveal with a
  "✎ Add note" button to keep the normal expanded view uncluttered.

**Dependencies**: none.

### Phase 2: Spaced repetition

- **Status**: Planned
- **Goal**: Replace the current bucket-based weak-spot prioritisation with
  a real spaced-repetition scheduler, so questions come back at expanding
  intervals after the user gets them right (1d, 3d, 7d, 14d, 30d) and more
  frequently when missed. The single biggest retention lever for a bank of
  100+ items.
- **Rationale**: This is the core learning mechanic that Anki, Quizlet and
  RemNote all converged on. The current weak-spot sort only distinguishes
  four buckets; a card you got right on Monday is indistinguishable from
  one you got right six months ago.

**High-level implementation**

- **Schema**: extend `QuizProgress.ratings` from
  `Record<string, RatingValue>` to
  `Record<string, { rating: RatingValue; interval: number; dueAt: number; reps: number }>`.
  Bump the storage version key to `-v2` and keep a v1 to v2 migration that
  treats existing ratings as "just rated, interval 1 day."
- **Scheduler**: a pure function `nextInterval(prev, rating)` returning
  `{ interval, dueAt }`, implementing a simplified SM-2 variant:
  - `missed`: reset interval to 1 day, `dueAt = now + 1d`.
  - `unsure`: keep interval (or halve it), `dueAt = now + interval`.
  - `got-it`: multiply interval by ~2.5, cap at 180 days.
- **Quiz integration**: replace the current `priorityBucket` sort in
  [src/pages/Quiz.tsx](src/pages/Quiz.tsx) with:
  - Due first (`dueAt <= now`), ordered by most overdue.
  - Then never-seen.
  - Then not-yet-due (if the user wants more than their due list).
- **UI surfacing**: the configure screen shows "X cards due today" so the
  user sees the effect. Add a "Just due items" toggle that short-circuits
  the pool to due-only.
- **Migration + safety**: keep the old `priorityBucket` fallback for any
  card that lacks scheduler metadata; decay gradually as cards get rated.

**Dependencies**: none; internal to Quiz + storage.

### Phase 3: Engagement metrics (sessions, streaks, heatmap)

- **Status**: Planned
- **Goal**: Give the user a visible record of how often they study and
  reward consistency. Streaks and activity calendars are the single most
  copied pattern across study apps for a reason, they materially change
  how often people open the app.
- **Rationale**: Grouped because streaks and the heatmap both read from
  the same underlying piece of state (a per-day activity log). Building
  the log once feeds both features.

**High-level implementation**

- **Activity log**: new `localStorage` key `ibm-interview-activity-v1` as
  `Record<string /* YYYY-MM-DD */, { cards: number; sessions: number }>`.
  Write from `recordRating` (increment `cards`) and from quiz-start /
  quiz-complete (increment `sessions`). Small helper in
  [src/lib/storage.ts](src/lib/storage.ts).
- **Streak + daily goal**: daily goal configurable in a new Settings
  surface (default 10 cards). Streak counted as consecutive days where
  `cards >= goal`. Rendered on Home: "🔥 7-day streak · 6 / 10 today."
  Graceful "freeze" day logic optional (skip now; add later if needed).
- **Activity heatmap**: GitHub-style calendar grid, last 365 days, colour
  intensity by `cards` bucket. New component using CSS-grid; no libraries
  needed. Rendered on Home below the stats cards.

**Dependencies**: none. Useful standalone; even better paired with
Phase 2's "cards due today" (streak credit for clearing the due list).

### Phase 4: Installable + offline (PWA)

- **Status**: Planned
- **Goal**: Make the site installable to the home screen and usable
  offline. Primary motivation is mobile study on commutes / flights /
  anywhere IBM docs aren't reachable.
- **Rationale**: Standalone. Can slide into any phase window.

**High-level implementation**

- Add the [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) plugin
  (adds service worker + manifest generation with minimal config).
- `public/manifest.webmanifest` with name, short name, theme colour,
  background, icon entries pointing at the existing `public/icon.png`
  (generate a few sizes: 192, 512).
- Service worker strategy: precache the static build + the already-bundled
  questions JSON (it's part of the JS bundle after Vite builds).
  Network-first for reference links (won't work offline anyway, that's
  fine, the user is studying questions, not docs).
- `index.html` gets the manifest link + appropriate meta tags.
- Update [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
  should work unchanged since PWA output is just more files in `dist/`.

**Dependencies**: none.

### Phase 5: Self-directed timed exam mode

- **Status**: Planned
- **Goal**: Timed quiz mode that mimics an interview round: a timer counts
  down, no per-card reveal, final score screen. Distinct from the
  "Candidate-facing assessment mode" entry below; this one is for the
  learner themself (client-only, no backend needed).
- **Rationale**: Uses the MCQ auto-grading already shipped. Gives the user
  a way to rehearse under pressure.

**High-level implementation**

- **Mode selector** on Quiz configure: a third option alongside "free
  quiz" / "auto-graded quiz" called "timed exam." Picks only auto-graded
  questions, enforces a timer, hides free-text cards.
- **Timer**: session-level countdown, rendered above the flashcard. Time
  up means force-submit whatever's selected for the current card, then the
  quiz ends regardless of queue length.
- **Per-question timer (optional)**: shown on the card, advisory only.
- **No peek**: suppress the reveal block after submit until the whole exam
  ends. Show all answers on the summary screen.
- **Summary screen**: score out of N, per-topic breakdown, average time
  per question, flagged "slow" and "wrong" cards linked back to Browse.
- **Storage**: persist exam history under `ibm-interview-exams-v1` as an
  array of `{ date, score, topicBreakdown, durationMs }`. Useful for a
  future "how am I trending" view.

**Dependencies**: Phase 2 (SRS) is independent; feeds neatly with Phase 3
(exam completion extends the streak). Builds on the existing MCQ flow.
See also the "Candidate-facing assessment mode" entry below; they share
no code, candidate mode needs a real backend.

### Suggested sequence

1. **Phase 1**: quick UX wins (few days of small PRs).
2. **Phase 2**: SRS (the core learning mechanic; medium-effort,
   high-value). Do it before Phase 3 so the streak/due combo lands
   together.
3. **Phase 3**: session log + streak + heatmap.
4. **Phase 5**: timed exam mode.
5. **Phase 4**: PWA. Can slot earlier if mobile study becomes a priority;
   otherwise fine to finish on this.

---

## Active

### Short / long answer versions + UI toggle

- **Status:** Planned
- **Motivation:** Several questions (RDQM, Native HA, Uniform Cluster,
  Transactionality, Persistence…) have deep answers that are great for learning
  but too long for quick revision or as a flashcard prompt. Offer a short
  version for scanning and a long version for study, with the reader choosing.
- **Schema change:** Add an optional `answerBulletsShort: string[]` (≤ 3-4
  bullets, tight one-liners) to `Question` in `src/types.ts`. The existing
  `answerBullets` + `answerExplanation` remain the long version and stay
  required. Backfill is gradual, questions without a short answer fall back
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
  present, e.g. `**Short answer:**` bullet block followed by the existing
  full answer under `**Answer:**`. `scripts/check-references.mjs` / the CI
  "stale markdown" check picks up the new field automatically because the
  export is deterministic.
- **Notes:**
  - Keep the short bullets strictly under ~15 words each, if it needs more,
    it belongs in the long version.
  - Flashcard mode should probably default to Short for the question stem
    and Long on reveal, regardless of the global toggle, decide during
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
  - `answerType: 'free' | 'single' | 'multi'`, defaults to `'free'` (current
    behaviour) so existing questions need no change.
  - `choices?: { text: string; correct: boolean; explanation?: string }[]` ,
    required when `answerType` is `'single'` or `'multi'`. `explanation` is
    optional per-choice feedback shown after the user picks.
- **Data work:**
  - Pick ~20 existing questions suitable for auto-grading and add `choices`
    to them (persistence, MQPER_*, MI vs HA, LTS vs CD, AKS/EKS, parsers,
    etc.). Write 4-6 options per question, with 1 correct (single) or 2-3
    correct (multi).
  - Teaching content (`answerBullets` + `answerExplanation`) stays, it's
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
    Decide during implementation, mapping keeps the data model simpler.
  - Some questions have a "best answer" rather than strictly one correct
    answer (e.g. parser choice). Use `answerType: 'single'` with a clear
    `correct: true` on the best option and per-choice `explanation` on the
    near-misses so the nuance is surfaced rather than lost.
  - Consider a separate question-authoring helper later, writing 4
    plausible wrong choices per question is the time-consuming part.

### Pending question drafts

- **Status:** Mostly cleared. Original 10-item batch has been walked; 9 of
  10 graduated into `src/data/questions.json`, 1 dropped as duplicate of
  an existing entry (`ace-adm-028` bake-vs-fry already covered it). Three
  new items captured as stubs (content still to author).
- **Location:** [drafts/pending-questions.md](drafts/pending-questions.md)
- **Graduated (9):** Switch Server in SaaS (`ace-dev-027`), Grouping nodes
  Group vs Collector vs Aggregation (`ace-dev-028`), Sequencing nodes
  (`ace-dev-029`), CSV parser choice (`ace-dev-030`), ESQL `[>]`/`[<]`
  positional operators (`ace-dev-031`), ACE MQOutput persistence property
  (`ace-dev-032`), App Connect runtimes / Integration Server vs Operator
  (`ace-adm-038`), App Connect Operator intro (`ace-adm-039`),
  Transformation Advisor / TAD for pre-v13 estates (`ace-adm-040`).
- **Dropped (1):** "Fried vs baked processing in App Connect", duplicate
  of `ace-adm-028`.
- **Merges applied to existing questions (2):**
  - M1: `ace-dev-031` (draft, now graduated) had `[>]`/`[<]` semantics
    reversed in the initial draft; corrected in review, and an MCQ
    sibling `ace-dev-026` was added for the second-to-last case.
  - M2: `ace-adm-009` (BAR build commands) picked up richer nuance on
    `mqsipackagebar` being a packager not a compiler, the "Build for"
    Toolkit prep step, and the `mqsicreatebar` + `xvfb-run` footprint
    vs `ibmint package` being genuinely headless.
- **Stubs still to author (3):** OpenTelemetry (OTEL) in ACE; cache
  options in ACE (Global Cache / Redis); using App Connect Designer
  locally. Stubs live in `drafts/pending-questions.md`.
- **Workflow:** new review-side requests go in this file first; author
  reviews, the draft is tightened or rewritten, then each approved draft
  moves into `src/data/questions.json` and is removed from the pending
  file.

### Normalise reference links to latest product versions

- **Status:** Planned
- **Motivation:** References in `questions.json` currently point at a mix of
  product-doc versions (e.g. `ibm-mq/9.2.x`, `9.3.x`, `9.4.x`,
  `app-connect/11.0.0`, `13.0`, `13.0.x`). Where a newer version of the same
  page exists, we should point at it so readers land on current content ,
  and the exercise also catches broken or moved links.
- **Schema change:** None.
- **Data work:** Walk every `references` URL on every question. For each
  IBM-hosted link, check whether a newer version of the same topic exists
  (e.g. swap `9.2.x` for the current supported version, `11.0.0` for `13.0`)
  and update the URL if so. Keep older links only when the newer page
  genuinely doesn't exist or the content meaningfully differs.
- **UI:** None.
- **Scripts / tooling:** Extend the existing `scripts/check-references.mjs`
  with a "latest-version" advisory mode, it already verifies links are
  reachable, so adding a check for "is there a newer version path that
  also resolves" is a natural extension. Keep it non-fatal (warnings in CI,
  not hard failures) so old-version links used deliberately don't block PRs.
- **Notes:**
  - Not every IBM docs URL pattern is predictable, some pages move topics
    between versions, so the script should verify the candidate URL before
    recommending a swap.
  - Run this as a dedicated pass once, then keep the advisory in CI so new
    references get nudged to current as they're added.

### Candidate-facing assessment mode

- **Status:** Planned (larger, separate track, not a simple toggle on the
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
    than a toggle on the existing app, keeps the trust boundary clean.
  - Candidate flow: enter a token / session link → instructions →
    per-question timer → no answer reveal before submit → submit to
    server → final 'thank you' page.
  - Interviewer flow: create an assessment (pick questions or a template,
    set time limit, generate a one-time link) → monitor status → view
    report (score overall, score per topic, per-question correct/wrong,
    time taken, flagged integrity events like tab-switch if we capture
    those).
- **Scripts / tooling:** Needs real **backend**: can't rely on the
  static SPA. Question bank, grading logic and session state have to
  live server-side to prevent tampering and leaking the correct
  answers. Most minimal shape: small Node service backed by a DB
  (SQLite / Postgres), signed session tokens, question-content endpoint
  that never returns the `correct` flags until submission.
- **Notes:**
  - Security posture needs real thought: rate limits, token expiry,
    prevent re-using a completed link, optional IP / device binding.
  - Anti-cheat in a pure-browser context has hard limits, be honest
    about what the tool does and doesn't claim to detect.
  - Questions used in candidate assessments should probably NOT be the
    exact questions published on the study site (or at least, a subset
    should be kept private), otherwise the "study app" becomes an
    answer key.
  - Roll it out as a separate repo / subdomain so the open study site
    stays fully static and public.
  - Likely pairs with "Aggregated team reporting" as use case (4) once
    assessment mode exists, deferred until then.

---

## Done

_(none yet, populated as entries are implemented and merged)_
