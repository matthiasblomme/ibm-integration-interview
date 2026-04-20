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

## Deploy to GitHub Pages

The repo ships with a GitHub Actions workflow at
[.github/workflows/deploy.yml](.github/workflows/deploy.yml) that:

1. Builds the Vite app on every push to `main`.
2. Uploads `dist/` as a Pages artefact.
3. Deploys via `actions/deploy-pages`.

To use it:

1. Push this repo to GitHub.
2. In repo **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` — the workflow runs and publishes to
   `https://<user>.github.io/<repo>/`.

**Important:** the Vite `base` in
[vite.config.ts](vite.config.ts) is hardcoded to `/ibm-integration-interview/`
because GitHub Pages serves project pages under that subpath. If your repo name
is different, update `REPO_BASE` in `vite.config.ts` to match.

The app uses `HashRouter`, so routes look like `/#/browse`. This avoids the
GitHub Pages 404-on-refresh problem for client-side routes without needing a
`404.html` fallback.

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
