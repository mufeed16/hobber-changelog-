#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { processIssues, groupByMonth, Issue, MonthlyGroup, ChangelogData } from './changelog-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface GraphQLResponse {
  data?: {
    repository?: {
      issues: {
        nodes: Array<{
          number: number;
          title: string;
          url: string;
          author: { login: string } | null;
          labels: { nodes: Array<{ name: string }> };
          closedAt: string;
          closingReason: string | null;
          state: string;
        }>;
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
      };
    };
  };
  errors?: Array<{ message: string }>;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;

console.log('=== DEBUG INFO ===');
console.log('GITHUB_TOKEN exists:', !!GITHUB_TOKEN);
console.log('GITHUB_TOKEN length:', GITHUB_TOKEN?.length || 0);
console.log('GITHUB_TOKEN first 10 chars:', GITHUB_TOKEN?.substring(0, 10) || 'N/A');
console.log('GITHUB_REPOSITORY:', GITHUB_REPOSITORY);
console.log('All env vars:', Object.keys(process.env).filter(k => k.includes('GITHUB')).sort());
console.log('==================');

if (!GITHUB_TOKEN) {
  console.warn('GITHUB_TOKEN not set (expected in local dev). Generating empty changelog.');
  const outputDir = join(__dirname, '..', 'public', 'data');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = join(outputDir, 'changelog.json');
  const emptyChangelog = {
    repository: { owner: '', name: '', url: '' },
    generatedAt: new Date().toISOString(),
    totalIssues: 0,
    completedCount: 0,
    notPlannedCount: 0,
    monthlyGroups: [],
  };
  writeFileSync(outputPath, JSON.stringify(emptyChangelog, null, 2));
  console.log(`Empty changelog generated at ${outputPath}`);
  process.exit(0);
}

if (!GITHUB_REPOSITORY) {
  console.error('Error: GITHUB_REPOSITORY environment variable is required');
  process.exit(1);
}

const [owner, repo] = GITHUB_REPOSITORY.split('/');

const GRAPHQL_QUERY = `
  query GetClosedIssues($owner: String!, $name: String!, $after: String) {
    repository(owner: $owner, name: $name) {
      issues(first: 100, after: $after, states: CLOSED, orderBy: {field: CLOSED_AT, direction: DESC}) {
        nodes {
          number
          title
          url
          author {
            login
          }
          labels(first: 20) {
            nodes {
              name
            }
          }
          closedAt
          closingReason
          state
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

async function fetchIssues(after: string | null = null): Promise<GraphQLResponse> {
  const variables = { owner, name: repo, after };

  console.log(`Fetching issues for ${owner}/${repo}...`);

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'hobber-changelog-generator',
    },
    body: JSON.stringify({ query: GRAPHQL_QUERY, variables }),
  });

  console.log(`GitHub API response: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error (status ${response.status}): ${errorText}`);
    // If token doesn't have permissions (401/403) or repo has no issues, generate empty changelog
    if (response.status === 401 || response.status === 403) {
      console.warn('GitHub token lacks GraphQL permissions. Generating empty changelog.');
      return { data: { repository: { issues: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } } } };
    }
    // For any other error, also generate empty changelog to avoid build failure
    console.warn(`Unexpected API error (${response.status}). Generating empty changelog to avoid build failure.`);
    return { data: { repository: { issues: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } } } };
  }

  const data = await response.json() as GraphQLResponse;

  if (data.errors && data.errors.length > 0) {
    console.error(`GraphQL Errors: ${JSON.stringify(data.errors, null, 2)}`);
    // Handle permission errors gracefully - generate empty changelog
    const errorMessages = data.errors.map(e => e.message).join(', ');
    if (errorMessages.includes('permission') || errorMessages.includes('access') || errorMessages.includes('forbidden') || errorMessages.includes('unauthorized')) {
      console.warn('GraphQL permission error. Generating empty changelog.');
      return { data: { repository: { issues: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } } } };
    }
    console.warn(`GraphQL error: ${errorMessages}. Generating empty changelog to avoid build failure.`);
    return { data: { repository: { issues: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } } } };
  }

  console.log(`Issues returned: ${data.data?.repository?.issues?.nodes?.length ?? 0}`);
  return data;
}

async function main() {
  console.log(`Fetching closed issues for ${owner}/${repo}...`);

  let allIssues: Issue[] = [];
  let hasNextPage = true;
  let after: string | null = null;
  let pageCount = 0;

  while (hasNextPage) {
    pageCount++;
    console.log(`Fetching page ${pageCount}...`);

    const response = await fetchIssues(after);
    const issuesData = response.data?.repository?.issues;

    if (!issuesData) {
      console.warn('No issues data returned from API');
      break;
    }

    const processedIssues = processIssues(issuesData.nodes);
    allIssues = [...allIssues, ...processedIssues];

    hasNextPage = issuesData.pageInfo.hasNextPage;
    after = issuesData.pageInfo.endCursor;

    if (hasNextPage) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`Retrieved ${allIssues.length} closed issues across ${pageCount} page(s)`);

  const completedCount = allIssues.filter(i => i.closingReason === 'COMPLETED').length;
  const notPlannedCount = allIssues.filter(i => i.closingReason === 'NOT_PLANNED').length;

  const monthlyGroups = groupByMonth(allIssues);

  const changelogData: ChangelogData = {
    repository: {
      owner,
      name: repo,
      url: `https://github.com/${owner}/${repo}`,
    },
    generatedAt: new Date().toISOString(),
    totalIssues: allIssues.length,
    completedCount,
    notPlannedCount,
    monthlyGroups,
  };

  const outputDir = join(__dirname, '..', 'public', 'data');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, 'changelog.json');
  writeFileSync(outputPath, JSON.stringify(changelogData, null, 2));

  console.log(`Changelog generated at ${outputPath}`);
  console.log(`Total: ${allIssues.length}, Completed: ${completedCount}, Not Planned: ${notPlannedCount}`);
}

main().catch(error => {
  console.error('Error generating changelog:', error);
  process.exit(1);
});