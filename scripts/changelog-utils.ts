export interface Issue {
  number: number;
  title: string;
  url: string;
  author: string | null;
  labels: string[];
  closedAt: string;
  closingReason: string | null;
  state: string;
}

export interface MonthlyGroup {
  month: string;
  year: number;
  issues: Issue[];
}

export interface ChangelogData {
  repository: {
    owner: string;
    name: string;
    url: string;
  };
  generatedAt: string;
  totalIssues: number;
  completedCount: number;
  notPlannedCount: number;
  monthlyGroups: MonthlyGroup[];
}

interface GraphQLIssueNode {
  number: number;
  title: string;
  url: string;
  author: { login: string } | null;
  labels: { nodes: Array<{ name: string }> };
  closedAt: string;
  closingReason: string | null;
  state: string;
}

export function processIssues(rawIssues: GraphQLIssueNode[]): Issue[] {
  return rawIssues.map(issue => ({
    number: issue.number,
    title: issue.title,
    url: issue.url,
    author: issue.author?.login || null,
    labels: issue.labels.nodes.map(l => l.name),
    closedAt: issue.closedAt,
    closingReason: issue.closingReason,
    state: issue.state,
  }));
}

export function groupByMonth(issues: Issue[]): MonthlyGroup[] {
  const groups = new Map<string, Issue[]>();

  for (const issue of issues) {
    const date = new Date(issue.closedAt);
    const year = date.getUTCFullYear();
    const month = date.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
    const key = `${year}-${month}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(issue);
  }

  const monthlyGroups: MonthlyGroup[] = [];
  for (const [key, groupIssues] of groups.entries()) {
    const [yearStr, month] = key.split('-', 2);
    const year = parseInt(yearStr, 10);

    groupIssues.sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());

    monthlyGroups.push({
      month,
      year,
      issues: groupIssues,
    });
  }

  monthlyGroups.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month);
  });

  return monthlyGroups;
}