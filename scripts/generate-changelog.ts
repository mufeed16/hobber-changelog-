#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface GitHubResponse {
  data?: {
    repository?: {
      issues?: {
        nodes: GitHubIssue[];
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
      };
    };
  };
  errors?: Array<{ message: string }>;
}

interface GitHubIssue {
  number: number;
  title: string;
  url: string;
  labels: {
    nodes: Array<{ name: string; color: string }>;
  };
  author: {
    login: string;
    avatarUrl: string;
    url: string;
  } | null;
  closedAt: string;
  stateReason: 'COMPLETED' | 'NOT_PLANNED' | null;
}

interface Issue {
  number: number;
  title: string;
  url: string;
  labels: Array<{ name: string; color: string }>;
  author: { login: string; avatarUrl: string; url: string };
  closedAt: string;
  stateReason: 'COMPLETED' | 'NOT_PLANNED' | null;
}

interface MonthlyIssues {
  month: string;
  monthKey: string;
  issues: Issue[];
}

interface ChangelogData {
  issues: Issue[];
  totalClosed: number;
  totalCompleted: number;
  totalNotPlanned: number;
  groupedByMonth: MonthlyIssues[];
  generatedAt: string;
}

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

async function fetchAllIssues(owner: string, repo: string, token: string): Promise<GitHubIssue[]> {
  const query = `
    query($owner: String!, $repo: String!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        issues(states: CLOSED, first: 100, after: $cursor, orderBy: {field: CLOSED_AT, direction: DESC}) {
          nodes {
            number
            title
            url
            labels(first: 20) {
              nodes {
                name
                color
              }
            }
            author {
              login
              avatarUrl
              url
            }
            closedAt
            stateReason
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  const allIssues: GitHubIssue[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const variables = { owner, repo, cursor };
    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'hobber-changelog',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: GitHubResponse = await response.json();

    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors.map(e => e.message).join(', '));
    }

    if (!data.data?.repository) {
      throw new Error('Repository not found or no access');
    }
    if (!data.data.repository.issues) {
      console.log('No issues data returned from GitHub (possibly no closed issues)');
      return [];
    }

    const page = data.data.repository.issues;
    if (!page) {
      console.log('No closed issues found');
      break;
    }
    allIssues.push(...page.nodes);
    hasNextPage = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
  }

  return allIssues;
}

function processIssues(issues: GitHubIssue[]): ChangelogData {
  // Sort by closedAt descending (newest first)
  issues.sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());

  const totalClosed = issues.length;
  const totalCompleted = issues.filter(i => i.stateReason === 'COMPLETED').length;
  const totalNotPlanned = issues.filter(i => i.stateReason === 'NOT_PLANNED').length;

  // Group by month
  const monthMap = new Map<string, MonthlyIssues>();

  for (const issue of issues) {
    const date = new Date(issue.closedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { month: monthName, monthKey, issues: [] });
    }
    monthMap.get(monthKey)!.issues.push({
      number: issue.number,
      title: issue.title,
      url: issue.url,
      labels: issue.labels.nodes,
      author: issue.author || { login: 'unknown', avatarUrl: '', url: '' },
      closedAt: issue.closedAt,
      stateReason: issue.stateReason,
    });
  }

  // Convert to array and sort by monthKey descending (newest month first)
  const groupedByMonth = Array.from(monthMap.values()).sort(
    (a, b) => b.monthKey.localeCompare(a.monthKey)
  );

  // Sort issues within each month by closedAt descending
  for (const month of groupedByMonth) {
    month.issues.sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());
  }

  return {
    issues: issues.map(i => ({
      number: i.number,
      title: i.title,
      url: i.url,
      labels: i.labels.nodes,
      author: i.author || { login: 'unknown', avatarUrl: '', url: '' },
      closedAt: i.closedAt,
      stateReason: i.stateReason,
    })),
    totalClosed,
    totalCompleted,
    totalNotPlanned,
    groupedByMonth,
    generatedAt: new Date().toISOString(),
  };
}

async function main() {
  const owner = process.env.GITHUB_REPOSITORY_OWNER || process.env.GITHUB_REPOSITORY?.split('/')[0];
  const repo = process.env.GITHUB_REPOSITORY_NAME || process.env.GITHUB_REPOSITORY?.split('/')[1];
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo) {
    console.error('Error: Could not determine repository owner/name');
    console.error('GITHUB_REPOSITORY_OWNER:', process.env.GITHUB_REPOSITORY_OWNER);
    console.error('GITHUB_REPOSITORY_NAME:', process.env.GITHUB_REPOSITORY_NAME);
    console.error('GITHUB_REPOSITORY:', process.env.GITHUB_REPOSITORY);
    process.exit(1);
  }

  if (!token) {
    console.error('Error: GITHUB_TOKEN not available');
    process.exit(1);
  }

  console.log(`Fetching closed issues for ${owner}/${repo}...`);

  try {
    const issues = await fetchAllIssues(owner, repo, token);
    console.log(`Found ${issues.length} closed issues`);

    const changelogData = processIssues(issues);

    // Write to public/data/changelog.json
    const outputDir = join(__dirname, '..', 'public', 'data');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = join(outputDir, 'changelog.json');
    writeFileSync(outputFile, JSON.stringify(changelogData, null, 2));
    console.log(`Changelog written to ${outputFile}`);

    console.log(`Total closed: ${changelogData.totalClosed}`);
    console.log(`Completed: ${changelogData.totalCompleted}`);
    console.log(`Not planned: ${changelogData.totalNotPlanned}`);
    console.log(`Months: ${changelogData.groupedByMonth.length}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();