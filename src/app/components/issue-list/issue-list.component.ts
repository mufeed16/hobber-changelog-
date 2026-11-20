import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangelogData, MonthlyGroup, Issue } from '../../models/changelog.model';
import { ChangelogService } from '../../services/changelog.service';

@Component({
  selector: 'app-issue-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (changelog(); as data) {
      @if (data.monthlyGroups.length === 0) {
        <section class="empty-state" aria-label="No closed issues">
          <div class="empty-content">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            <h2>No closed issues yet</h2>
            <p>Once issues are closed in this repository, they will appear here after the next deployment.</p>
          </div>
        </section>
      } @else {
        <section class="changelog" aria-label="Changelog">
          @for (group of data.monthlyGroups; track group.year + '-' + group.month) {
            <article class="month-group">
              <header class="month-header">
                <h2 class="month-title">{{ group.month }} {{ group.year }}</h2>
                <span class="month-count">{{ group.issues.length }} issue{{ group.issues.length !== 1 ? 's' : '' }}</span>
              </header>
              <ul class="issue-list" role="list">
                @for (issue of group.issues; track issue.number) {
                  <li class="issue-item">
                    <article class="issue-card">
                      <div class="issue-header">
                        <a
                          [href]="issue.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="issue-number"
                          [attr.aria-label]="'Issue #' + issue.number"
                        >
                          #{{ issue.number }}
                        </a>
                        <span class="issue-state">{{ issue.state }}</span>
                      </div>
                      <h3 class="issue-title">
                        <a
                          [href]="issue.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          [attr.aria-label]="'View issue: ' + issue.title"
                        >
                          {{ issue.title }}
                        </a>
                      </h3>
                      <div class="issue-meta">
                        @if (issue.author) {
                          <div class="meta-item meta-author">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span>{{ issue.author }}</span>
                          </div>
                        }
                        <div class="meta-item meta-date">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          <time [dateTime]="issue.closedAt">{{ formatDate(issue.closedAt) }}</time>
                        </div>
                      </div>
                      @if (issue.labels.length > 0) {
                        <div class="issue-labels" aria-label="Labels">
                          @for (label of issue.labels; track label) {
                            <span class="label">{{ label }}</span>
                          }
                        </div>
                      }
                      <div class="issue-footer">
                        <span
                          class="closing-badge"
                          [class]="getClosingReasonClass(issue.closingReason)"
                        >
                          {{ getClosingReasonLabel(issue.closingReason) }}
                        </span>
                      </div>
                    </article>
                  </li>
                }
              </ul>
            </article>
          }
        </section>
      }
    } @else if (loading()) {
      <section class="loading-state" aria-label="Loading changelog">
        <div class="loading-content">
          <div class="spinner" aria-hidden="true"></div>
          <p>Loading changelog...</p>
        </div>
      </section>
    } @else {
      <section class="error-state" aria-label="Error loading changelog">
        <div class="error-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2>Unable to load changelog</h2>
          <p>The changelog data could not be loaded. Please try refreshing the page.</p>
        </div>
      </section>
    }
  `,
  styles: [`
    .changelog {
      max-width: 900px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .month-group {
      margin-bottom: 2rem;
    }

    .month-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid #e1e4e8;
    }

    .month-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2328;
    }

    .month-count {
      font-size: 0.875rem;
      color: #656d76;
      font-weight: 500;
    }

    .issue-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .issue-card {
      background: #fff;
      border: 1px solid #e1e4e8;
      border-radius: 10px;
      padding: 1.25rem;
      transition: all 0.15s ease;
    }

    .issue-card:hover {
      border-color: #d0d7de;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      transform: translateY(-1px);
    }

    .issue-header {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .issue-number {
      font-size: 0.875rem;
      font-weight: 600;
      color: #58a6ff;
      text-decoration: none;
      background: rgba(88, 166, 255, 0.1);
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      transition: all 0.15s ease;
    }

    .issue-number:hover {
      background: rgba(88, 166, 255, 0.2);
      color: #0969da;
    }

    .issue-state {
      font-size: 0.75rem;
      font-weight: 600;
      color: #656d76;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .issue-title {
      margin: 0 0 0.75rem 0;
      font-size: 1.05rem;
      font-weight: 500;
      line-height: 1.4;
      color: #1f2328;
    }

    .issue-title a {
      color: inherit;
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .issue-title a:hover {
      color: #0969da;
      text-decoration: underline;
    }

    .issue-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
      font-size: 0.8125rem;
      color: #656d76;
    }

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }

    .meta-item svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      color: #8b949e;
    }

    .issue-labels {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-bottom: 0.75rem;
    }

    .label {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 500;
      padding: 0.125rem 0.5rem;
      border-radius: 3px;
      background: #f3f4f6;
      color: #4b5563;
      border: 1px solid #e5e7eb;
      text-transform: capitalize;
    }

    .issue-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-top: 0.75rem;
      border-top: 1px solid #f0f0f0;
    }

    .closing-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .badge-completed {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #dcfce7;
    }

    .badge-not-planned {
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fef3c7;
    }

    .badge-default {
      background: #f3f4f6;
      color: #4b5563;
      border: 1px solid #e5e7eb;
    }

    .empty-state,
    .loading-state,
    .error-state {
      max-width: 900px;
      margin: 0 auto;
      padding: 4rem 1.5rem;
      text-align: center;
    }

    .empty-content,
    .loading-content,
    .error-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      max-width: 400px;
      margin: 0 auto;
    }

    .empty-icon,
    .error-content svg {
      width: 48px;
      height: 48px;
      color: #8b949e;
    }

    .empty-content h2,
    .error-content h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2328;
    }

    .empty-content p,
    .error-content p,
    .loading-content p {
      margin: 0;
      color: #656d76;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e1e4e8;
      border-top-color: #0969da;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 640px) {
      .changelog {
        padding: 1rem;
      }

      .issue-card {
        padding: 1rem;
      }

      .issue-title {
        font-size: 1rem;
      }

      .month-title {
        font-size: 1.125rem;
      }

      .empty-state,
      .loading-state,
      .error-state {
        padding: 3rem 1rem;
      }
    }
  `],
})
export class IssueListComponent {
  changelog = input<ChangelogData | null>(null);
  loading = input<boolean>(false);

  constructor(private changelogService: ChangelogService) {}

  getClosingReasonLabel(reason: string | null): string {
    return this.changelogService.getClosingReasonLabel(reason);
  }

  getClosingReasonClass(reason: string | null): string {
    return this.changelogService.getClosingReasonClass(reason);
  }

  formatDate(dateString: string): string {
    return this.changelogService.formatDate(dateString);
  }
}