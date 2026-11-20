# Hobber Changelog

An Angular application that displays a changelog of closed GitHub issues, grouped by month and deployed to GitHub Pages via GitHub Actions.

## Features

- Fetches closed issues from GitHub GraphQL API
- Groups issues by month (newest month first)
- Shows issue number, title (linked to GitHub), labels, author, and close date
- Distinguishes between "Completed" and "Not Planned" closure reasons
- Displays total counts with completed/not-planned split
- Responsive design that works on mobile
- Auto-refreshes on page reload after redeploy
- No hardcoded repository details - works in any repository

## How It Works

### Data Generation (Build Time)

1. A build-time script (`scripts/generate-changelog.ts`) runs during the GitHub Actions workflow
2. It uses the GitHub GraphQL API to fetch **all** closed issues (handles pagination for >100 issues)
3. Issues are grouped by month and saved as `public/data/changelog.json`
4. The token used is the automatic `GITHUB_TOKEN` - no secrets needed

### Angular Application (Runtime)

1. The Angular app loads the pre-generated `changelog.json` at runtime
2. Displays issues grouped by month with sorting (newest first)
3. Shows statistics bar with total/completed/not-planned counts
4. Clean, responsive UI with clear visual distinction between completion states

### Deployment

1. GitHub Actions workflow triggers on:
   - Push to main branch
   - Manual trigger from Actions tab
2. Workflow:
   - Checks out code
   - Generates changelog data
   - Builds Angular app (with dynamic baseHref)
   - Deploys to GitHub Pages

## Setup Instructions

### 1. Create a new repository

Push this code to a new GitHub repository.

### 2. Enable GitHub Pages

Go to **Settings → Pages** and set:
- **Source**: GitHub Actions

### 3. Run the workflow

Go to the **Actions** tab and run the "Deploy Changelog to GitHub Pages" workflow manually, or push to main.

### 4. Access your site

The site will be available at: `https://<owner>.github.io/<repo>/`

## Configuration

No configuration needed! The app automatically detects:
- Repository owner/name from GitHub Actions environment variables
- Uses the built-in `GITHUB_TOKEN` for API access
- Generates the correct base path for GitHub Pages

## Local Development

```bash
# Install dependencies
npm install

# Generate sample changelog data (requires GITHUB_TOKEN)
npm run generate:changelog

# Start dev server
npm start
```

Note: Local development requires a valid `GITHUB_TOKEN` with repo access. For testing without a token, a sample `public/data/changelog.json` is included.

## Project Structure

```
src/
  app/
    components/
      changelog/          # Main changelog component
    models/
      issue.model.ts      # TypeScript interfaces
    services/
      changelog.service.ts # Data fetching service
    app.ts                # Root component
    app.config.ts         # App configuration
scripts/
  generate-changelog.ts   # Build-time data generator
.github/
  workflows/
    deploy.yml            # GitHub Actions workflow
public/
  data/
    changelog.json        # Generated data (committed for fallback)
```

## Technology Stack

- Angular 22 (standalone components)
- TypeScript
- GitHub GraphQL API
- GitHub Actions for CI/CD
- GitHub Pages for hosting

## License

MIT