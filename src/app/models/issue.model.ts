export interface Issue {
  number: number;
  title: string;
  url: string;
  labels: Label[];
  author: Author;
  closedAt: string;
  stateReason: 'COMPLETED' | 'NOT_PLANNED' | null;
}

export interface Label {
  name: string;
  color: string;
}

export interface Author {
  login: string;
  avatarUrl: string;
  url: string;
}

export interface ChangelogData {
  issues: Issue[];
  totalClosed: number;
  totalCompleted: number;
  totalNotPlanned: number;
  groupedByMonth: MonthlyIssues[];
  generatedAt?: string;
}

export interface MonthlyIssues {
  month: string;
  monthKey: string;
  issues: Issue[];
}