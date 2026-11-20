import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangelogData } from '../../models/changelog.model';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (changelog()) {
      <section class="stats" aria-label="Changelog statistics">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon stat-total" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ changelog()!.totalIssues }}</span>
              <span class="stat-label">Total Closed</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-completed" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ changelog()!.completedCount }}</span>
              <span class="stat-label">Completed</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-not-planned" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ changelog()!.notPlannedCount }}</span>
              <span class="stat-label">Not Planned</span>
            </div>
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    .stats {
      padding: 1.5rem;
      background: #fff;
      border-bottom: 1px solid #e1e4e8;
    }

    .stats-grid {
      max-width: 900px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: #f6f8fa;
      border-radius: 8px;
      border: 1px solid #e1e4e8;
      transition: all 0.15s ease;
    }

    .stat-card:hover {
      background: #f3f4f6;
      border-color: #d0d7de;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .stat-icon svg {
      width: 20px;
      height: 20px;
    }

    .stat-total {
      background: rgba(88, 166, 255, 0.15);
      color: #0969da;
    }

    .stat-completed {
      background: rgba(44, 165, 93, 0.15);
      color: #2da44e;
    }

    .stat-not-planned {
      background: rgba(196, 128, 0, 0.15);
      color: #bf8700;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2328;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #656d76;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    @media (max-width: 640px) {
      .stats {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .stat-card {
        padding: 0.875rem 1rem;
      }

      .stat-icon {
        width: 36px;
        height: 36px;
      }

      .stat-value {
        font-size: 1.375rem;
      }
    }
  `],
})
export class StatsComponent {
  changelog = input<ChangelogData | null>(null);
}