# Implementation Notes

## Approach

I built an Angular 22 application that displays a changelog from GitHub closed issues. The architecture separates concerns into:

1. **Build-time data generation** (`scripts/generate-changelog.ts`): Fetches all closed issues from GitHub GraphQL API during the CI/CD pipeline, handles pagination for >100 issues, groups by month, and outputs JSON to `public/data/changelog.json`.

2. **Runtime Angular app**: Loads the pre-generated JSON and displays it with a clean, responsive UI. Uses standalone components, signals for state management, and HttpClient for data fetching.

3. **GitHub Actions workflow**: Runs on push to main and manual trigger. Uses the automatic `GITHUB_TOKEN` (no secrets needed), generates the changelog, builds Angular with dynamic `baseHref`, and deploys to GitHub Pages.

## Key Design Decisions

- **Build-time vs runtime fetching**: Chose build-time generation to avoid CORS issues, rate limits, and exposing tokens. The `GITHUB_TOKEN` never touches the deployed site.
- **GraphQL over REST**: GraphQL lets us fetch exactly what we need (labels, author, stateReason) in fewer requests.
- **Pagination handling**: The script uses a while loop to fetch all pages (100 issues per page).
- **Dynamic baseHref**: Angular's `baseHref` is set at build time using the repository name from GitHub Actions env vars.
- **No hardcoded values**: Everything derives from `GITHUB_REPOSITORY_OWNER`, `GITHUB_REPOSITORY_NAME`, and `GITHUB_TOKEN` env vars.

## What the AI Got Wrong & How I Caught It

1. **Initial service design**: First version tried to fetch from GraphQL at runtime. This would fail due to CORS and token exposure. Fixed by moving to build-time generation.

2. **Date binding in template**: Used `[datetime]` which isn't a valid Angular binding. Fixed to `[attr.datetime]`.

3. **Base href configuration**: Initially tried to set baseHref in angular.json statically. Fixed by using a placeholder that gets replaced at build time via env var.

4. **Token handling**: Initially considered using a personal access token. Caught this - the requirements explicitly forbid it. The workflow now uses only `GITHUB_TOKEN`.

5. **State reason handling**: GitHub returns `stateReason` as `COMPLETED` or `NOT_PLANNED` (or null). Added proper TypeScript types and UI distinction with color-coded badges and border-left indicators.

## What I'd Improve With More Time

1. **Automated tests**: Add unit tests for the service and component, plus e2e tests for the full flow.

2. **Error recovery**: Better error handling in the generation script (retry logic, partial data saving).

3. **Incremental updates**: Only fetch issues closed since last generation (using `since` parameter) to speed up large repos.

4. **Search/filter**: Add client-side search by title, author, or label.

5. **Accessibility**: More ARIA labels, keyboard navigation improvements.

6. **Caching headers**: Configure GitHub Pages caching for the JSON file.

7. **Dark mode**: Add CSS custom properties for theme support.

8. **Webhook trigger**: Instead of only push/manual, add a workflow that triggers when issues are closed (using `issues` event with `types: [closed]`).

## Assumptions Made

- The repository has Issues enabled
- The default branch is `main` (configurable in workflow)
- GitHub Pages will be enabled after first push (first run may fail as noted in requirements)
- Node 20+ is available in GitHub Actions (standard)
- The `GITHUB_TOKEN` has `contents: read` permission (default)