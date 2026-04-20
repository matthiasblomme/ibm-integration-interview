# IBM Integration Interview Prep — ACE & MQ

A small React + Vite webapp that lets you browse, search and quiz yourself on
IBM ACE and IBM MQ interview questions (Dev + Admin), plus a curated resource
list. Intended as a study / interview-prep tool.

All content lives in plain JSON:

- [src/data/questions.json](src/data/questions.json) — question bank (single source of truth)
- [src/data/resources.json](src/data/resources.json) — curated links

A readable Markdown export is kept at
[interview_questions.md](interview_questions.md), regenerated from the JSON.

## Run locally

Requires Node 18+.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the production build locally
npm run gen:md   # regenerate interview_questions.md from JSON
```

## Features

- **Browse** — filter by product (MQ / ACE / Cloud / General), role (Admin /
  Dev / Any) and topic. Full-text search across question, answer and tags
  (Fuse.js).
- **Quiz** — flashcard mode. Pick filters, draw N random questions, reveal
  answers and self-rate. Progress is kept in `localStorage`.
- **Resources** — curated IBM docs, community sites, GitHub repos and
  reference PDFs, filterable by product.

## GitHub workflows

Two workflows live under [.github/workflows/](.github/workflows/):

- [ci.yml](.github/workflows/ci.yml) — runs on every pull request (and push to
  `main`): typechecks, builds, and verifies `interview_questions.md` is in sync
  with the JSON. Use this as the required status check in branch protection.
- [deploy.yml](.github/workflows/deploy.yml) — runs on push to `main`: builds
  and publishes to GitHub Pages.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In repo **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` — `deploy.yml` runs and publishes to
   `https://<user>.github.io/<repo>/`.

**Important:** the Vite `base` in
[vite.config.ts](vite.config.ts) is hardcoded to `/ibm-integration-interview/`
because GitHub Pages serves project pages under that subpath. If your repo name
is different, update `REPO_BASE` in `vite.config.ts` to match.

The app uses `HashRouter`, so routes look like `/#/browse`. This avoids the
GitHub Pages 404-on-refresh problem for client-side routes without needing a
`404.html` fallback.

## Protect `main` (require PR + passing build)

Branch protection lives on GitHub, not in the repo, so this has to be enabled
once the repo is pushed. You have two options.

### Option A — GitHub UI

Repo **Settings → Branches → Branch protection rules → Add rule**:

- **Branch name pattern:** `main`
- ✅ **Require a pull request before merging**
  - Required approvals: 0 (solo) or 1+ (team)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Search for and add the check named **`Typecheck & Build`** (from
    `ci.yml`) — it appears in the list after the workflow has run at least
    once (open a throwaway PR first if needed)
- Leave **Include administrators** off if you're the only admin, so you don't
  lock yourself out.

### Option B — one-liner with `gh` CLI

After the CI workflow has run at least once so the check name is registered:

```bash
gh api -X PUT repos/:owner/:repo/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Typecheck & Build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

Replace `:owner/:repo` with your `user/ibm-integration-interview` path.

### Day-to-day workflow after that

```bash
git checkout -b feat/add-questions
# edit files...
git commit -am "Add MQ clustering questions"
git push -u origin feat/add-questions
gh pr create --fill
# CI runs. Once it's green, merge the PR in the UI or with `gh pr merge --squash`.
```

Direct pushes to `main` will be rejected by GitHub, and merging a PR without a
green build will be blocked.

## Adding / editing questions

Edit [src/data/questions.json](src/data/questions.json). Each question is:

```json
{
  "id": "mq-adm-099",
  "product": "MQ",
  "role": "Admin",
  "topic": "Security",
  "question": "...",
  "answerBullets": ["...", "..."],
  "answerExplanation": "Short context / why.",
  "tags": ["tls", "chlauth"],
  "difficulty": "medium"
}
```

After editing, run `npm run gen:md` to refresh the Markdown export.

## Project layout

```
├── .github/workflows/deploy.yml
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── scripts/
│   └── json-to-md.mjs
└── src/
    ├── main.tsx
    ├── router.tsx
    ├── types.ts
    ├── data/
    │   ├── questions.json
    │   └── resources.json
    ├── lib/
    │   ├── search.ts
    │   └── storage.ts
    ├── components/
    │   ├── Layout.tsx
    │   ├── Sidebar.tsx
    │   ├── QuestionCard.tsx
    │   └── FlashCard.tsx
    ├── pages/
    │   ├── Home.tsx
    │   ├── Browse.tsx
    │   ├── Quiz.tsx
    │   └── Resources.tsx
    └── styles/
        └── index.css
```
