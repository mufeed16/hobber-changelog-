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

export interface RepositoryInfo {
  owner: string;
  name: string;
  url: string;
}

export interface ChangelogData {
  repository: RepositoryInfo;
  generatedAt: string;
  totalIssues: number;
  completedCount: number;
  notPlannedCount: number;
  monthlyGroups: MonthlyGroup[];
}