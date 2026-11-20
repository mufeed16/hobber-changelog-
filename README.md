# GitHub Changelog

A build-time changelog generator for GitHub repositories. Displays all closed issues from the repository where it's deployed, grouped by month with completion status badges.

## Features

- **Build-time data generation** — Fetches closed issues via GitHub GraphQL API during CI/CD, never exposing tokens to the browser
- **Zero-configuration deployment** — Works when cloned to any GitHub account without code changes (uses `GITHUB_REPOSITORY` env var)
- **Cursor-based pagination** — Handles repositories with 100+ issues
- **Monthly grouping** — Issues organized by month, newest first
- **Closing reason classification** — Explicit COMPLETED/NOT_PLANNED badges (null/unknown reasons not defaulted to completed)
- **Responsive UI** — Clean Angular 22 interface with light/dark mode support
- **GitHub Pages ready** — Configured for official Pages actions with dynamic base-href

## Quick Start

### Prerequisites

- Node.js 20+
- GitHub Personal Access Token (classic) with `repo` scope
- Angular CLI: `npm install -g @angular/cli`

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-org/your-repo.git
cd your-repo

# Install dependencies
npm ci

# Generate changelog data locally (requires GITHUB_TOKEN)
export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_REPOSITORY=owner/repo
npm run generate-changelog

# Start dev server
npm start
```

Open http://localhost:4200 — the app loads sample data from `public/data/changelog.json` for local development.

### Production Deployment

1. **Push to GitHub** — Repository must be named `hobber-changelog` (or update workflow)
2. **Add secret** — In repository Settings → Secrets → Actions, add `GH_PAGES_TOKEN` with a PAT having `repo` and `workflow` scopes
3. **Enable Pages** — Settings → Pages → Source: "GitHub Actions"
4. **Push to main** — Workflow triggers on push, builds, generates changelog, and deploys

The deployed site will be at: `https://<owner>.github.io/hobber-changelog/`

## Project Structure

```
├── .github/workflows/deploy.yml    # GitHub Actions CI/CD
├── public/data/changelog.json      # Generated at build time (sample for local dev)
├── scripts/
│   ├── changelog-utils.ts          # Pure utility functions (tested)
│   ├── generate-changelog.ts       # Build-time data generator
│   └── generate-changelog.test.ts  # Vitest unit tests (13 tests)
├── src/
│   ├── app/
│   │   ├── app.ts                  # Root component (signals + effect)
│   │   ├── app.css                 # Global styles (CSS variables, dark mode)
│   │   ├── app.config.ts           # HttpClient with fetch
│   │   ├── app.spec.ts             # Angular component tests
│   │   ├── models/changelog.model.ts  # TypeScript interfaces
│   │   ├── services/changelog.service.ts  # Data fetching + processing
│   │   └── components/
│   │       ├── header/header.component.ts
│   │       ├── stats/stats.component.ts
│   │       └── issue-list/issue-list.component.ts
├── angular.json                    # Angular config (assets from public/)
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server (loads sample data) |
| `npm run build` | Production build to `dist/` |
| `npm run generate-changelog` | Fetch issues from GitHub API → `public/data/changelog.json` |
| `npm test` | Run Angular tests (Karma/Jasmine) |
| `npx vitest run` | Run utility tests (Vitest) |

## Architecture

### Build-Time Data Generation

```
GitHub Actions (secure env) → GraphQL API → changelog.json → Angular build → static files → GitHub Pages
```

- `GITHUB_TOKEN` only exists in GitHub Actions runner memory
- Browser receives only static JSON — no secrets, no API calls
- Dynamic `base-href` via workflow: `--base-href=/${{ github.event.repository.name }}/`

### Data Flow

1. **Generate script** (`scripts/generate-changelog.ts`):
   - Reads `GITHUB_TOKEN` and `GITHUB_REPOSITORY` (owner/repo) from env
   - Queries GitHub GraphQL with cursor pagination (100 issues/page)
   - Transforms via `processIssues()` and `groupByMonth()` (pure functions)
   - Writes `public/data/changelog.json`

2. **Angular app** (`src/app/services/changelog.service.ts`):
   - HttpClient fetches `data/changelog.json` (relative to base-href)
   - Processes dates, classifies closing reasons, computes stats
   - Components consume via signals

### Closing Reason Logic

```typescript
// Explicit classification — null/unknown are NOT treated as completed
const isCompleted = issue.closingReason === 'COMPLETED';
const isNotPlanned = issue.closingReason === 'NOT_PLANNED';
```

## Testing

### Utility Tests (Vitest)

```bash
npx vitest run
# 13 tests covering:
# - processIssues: all fields, missing author, missing labels, null closing reason
# - groupByMonth: grouping, month sorting, issue sorting, empty list
# - closing reason classification: COMPLETED, NOT_PLANNED, null, unknown
# - pagination handling: multiple pages
```

### Angular Tests (Karma)

```bash
npm test
# 2 tests:
# - Component creation
# - Title rendering
```

## Configuration

### Environment Variables (Build Time)

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | PAT with `repo` scope |
| `GITHUB_REPOSITORY` | Yes | Format: `owner/repo` (auto-set in Actions) |

### Angular Config (`angular.json`)

- `assets: ["src/favicon.ico", "src/assets", "public"]` — includes generated `changelog.json`
- Output path: `dist/hobber-changelog/browser`

## Security

- ✅ No tokens in browser bundle
- ✅ No runtime API calls from client
- ✅ Token only in GitHub Actions runner (ephemeral)
- ✅ `changelog.json` contains only public issue data
- ✅ Content Security Policy compatible

## License

MIT — Hobber Advertising LLC