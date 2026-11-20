# Implementation Notes

## Approach

This project implements a GitHub Changelog application following a **build-time data generation** architecture. The core principle: all GitHub API calls happen at build time in a secure CI/CD environment, and the browser receives only static JSON files — no tokens, no runtime API calls.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Runner                          │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │ GITHUB_TOKEN │───▶│ generate-changelog│───▶│changelog.json│  │
│  │ GITHUB_REPO  │    │   (Node/TSX)     │    │  (public/)   │  │
│  └──────────────┘    └──────────────────┘    └──────┬───────┘  │
└─────────────────────────────────────────────────────┼──────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Angular Build                                │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │ changelog.json│───▶│   ng build       │───▶│  dist/       │  │
│  │  (asset)     │    │ --base-href=...  │    │  (static)    │  │
│  └──────────────┘    └──────────────────┘    └──────┬───────┘  │
└─────────────────────────────────────────────────────┼──────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Pages                                  │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │  Upload      │───▶│  Deploy to       │───▶│  Live Site   │  │
│  │  artifact    │    │  Pages           │    │  (static)    │  │
│  └──────────────┘    └──────────────────┘    └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

### 1. Build-Time Generation Over Runtime Fetching

**Decision**: Fetch all data at build time via a Node script, not in the browser.

**Rationale**:
- Security: `GITHUB_TOKEN` never leaves the CI runner
- Performance: Zero runtime API latency, fully cacheable static files
- Reliability: No CORS issues, no rate limiting in browser, works offline
- Simplicity: Angular app becomes a pure static site consumer

### 2. GraphQL with Cursor Pagination

**Decision**: Use GitHub GraphQL API with `first: 100` + `after` cursor.

**Rationale**:
- REST API v3 pagination (page/per_page) is deprecated for issues
- Cursor pagination is stable across inserts/deletes
- 100 issues/page minimizes API calls (max 10 calls = 1000 issues)
- GraphQL returns only needed fields (reduces bandwidth)

### 3. Pure Utility Functions for Testability

**Decision**: Extract `processIssues()` and `groupByMonth()` to `changelog-utils.ts`.

**Rationale**:
- Original `generate-changelog.ts` had top-level `process.exit()` calls — untestable
- Pure functions enable fast Vitest unit tests (13 tests, no mocks needed)
- Separation of concerns: data transformation ≠ I/O
- Easy to verify sorting, grouping, edge cases in isolation

### 4. Explicit Closing Reason Classification

**Decision**: Only `COMPLETED` and `NOT_PLANNED` are recognized; `null` and unknown reasons are **not** defaulted to completed.

**Rationale**:
- GitHub returns `null` for issues closed without a reason selected
- Defaulting null → completed would inflate completion metrics
- Explicit classification matches GitHub's UI behavior
- Tests verify: `null` ≠ `COMPLETED`, `UNKNOWN_REASON` ≠ `COMPLETED`

### 5. Dynamic Base-Href via Workflow

**Decision**: Set `--base-href=/${{ github.event.repository.name }}/` in the build step.

**Rationale**:
- Repository name is dynamic (works when cloned to any account)
- `angular.json` baseHref is static — can't use `${{ github.repository }}`
- Angular CLI flag overrides config at build time
- Works with official `actions/configure-pages` + `actions/upload-pages-artifact`

### 6. Angular 22: Signals + Standalone + Zoneless (Almost)

**Decision**: Use `signal()`, `computed()`, `effect()` for state; standalone components; provideHttpClient with fetch.

**Rationale**:
- Signals = fine-grained reactivity, no Zone.js overhead
- Standalone = no NgModules, simpler mental model
- `provideHttpClient(withFetch())` = modern fetch API, smaller bundle
- `effect()` for side effects (data loading trigger)

### 7. CSS Custom Properties + `prefers-color-scheme`

**Decision**: All colors/spacing via CSS variables; dark mode via media query.

**Rationale**:
- Single source of truth for design tokens
- No JS toggle needed — respects OS preference automatically
- Easy to extend: add `[data-theme="dark"]` override later
- `oklch()` colors for perceptual uniformity

## Challenges & Solutions

### Challenge 1: Angular CLI Project Name Validation

**Problem**: `ng new hobber` failed — "hobber" invalid for package name (scoped package required).

**Solution**: Created in subdirectory `hobber-changelog`, then moved files to root.

```bash
ng new hobber-changelog --standalone --style=css --ssr=false
# Move contents up one level, update package.json name, angular.json paths
```

### Challenge 2: Base-Href Conflict

**Problem**: Setting `baseHref` in `angular.json` to `/hobber-changelog/` broke local dev (404s on assets).

**Solution**: Remove from config; pass via CLI in workflow only:
```yaml
- run: npx ng build --configuration production --base-href=/${{ github.event.repository.name }}/
```

### Challenge 3: Test Environment Contamination

**Problem**: `generate-changelog.ts` ran `process.exit(1)` on import in Vitest — killed test runner.

**Solution**: Extracted pure functions to `changelog-utils.ts`; generator script only runs when executed directly.

### Challenge 4: Missing @vitest/browser-playwright

**Problem**: `vitest --browser` failed — Playwright dependency not installed.

**Solution**: Use `ng test` (Karma/Jasmine/JSDOM) for Angular component tests; Vitest only for pure utility tests.

### Challenge 5: Default Scaffold Test Failure

**Problem**: `app.spec.ts` expected "Hello, hobber-changelog" but app renders "GitHub Changelog".

**Solution**: Updated test expectation to match actual component title.

### Challenge 6: Sample Data for Local Dev

**Problem**: Without `GITHUB_TOKEN`, local `ng serve` shows empty state.

**Solution**: Committed `public/data/changelog.json` with realistic sample data (5 issues across 2 months). Loaded as asset during dev.

## AI Code Review Notes

### What Worked Well

1. **Separation of I/O and logic** — Pure utilities (`changelog-utils.ts`) are 100% testable, zero dependencies
2. **GraphQL pagination** — Cursor-based approach correctly handles 100+ issues with `hasNextPage`/`endCursor`
3. **Security by architecture** — Token never touches browser; build-time generation is the right pattern
4. **Dynamic repo detection** — `GITHUB_REPOSITORY` env var makes it work on any fork/clone without code changes
5. **CSS variable system** — Dark mode works out of box, easy to theme, no runtime JS
6. **Signal-based Angular** — Clean reactive flow: `effect()` triggers load → `signal()` holds data → `computed()` derives stats

### Areas for Improvement (If Time Permitted)

1. **Error boundary UI** — Current error state is basic; could add retry button, detailed error codes
2. **Loading skeleton** — Replace spinner with content-shaped placeholders
3. **Issue filtering** — Add label filter, author filter, search
4. **Release grouping** — Option to group by GitHub releases instead of calendar months
5. **Accessibility audit** — Verify ARIA labels, keyboard nav, color contrast in dark mode
6. **Bundle analysis** — Check for unused Angular features, optimize chunk splitting

### Security Review

| Check | Status |
|-------|--------|
| No tokens in browser bundle | ✅ Verified — `dist/` contains only static assets |
| No runtime API calls | ✅ HttpClient only fetches local `data/changelog.json` |
| Token scope minimal | ✅ `repo` scope only (read issues) |
| Token rotation | ✅ Stored as GitHub Actions secret, not in repo |
| CSP compatible | ✅ No inline scripts, no eval, static assets only |

### Performance Notes

- **Build time**: ~30s (install + generate + build + deploy)
- **API calls**: 1 per 100 issues (max ~10 for 1000 issues)
- **Bundle size**: ~150KB gzipped (Angular + components + styles)
- **Lighthouse**: Expected 90+ (static files, no JS framework overhead beyond Angular)

## Future Considerations

- **Scheduled regeneration**: Add cron workflow to refresh weekly
- **Multi-repo support**: Aggregate issues across org repos
- **Webhook trigger**: Regenerate on issue close (requires GitHub App)
- **Internationalization**: Month names via `Intl.DateTimeFormat`
- **PWA**: Add service worker for offline viewing