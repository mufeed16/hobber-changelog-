import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangelogData } from '../../models/changelog.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-content">
        <div class="header-main">
          <h1 class="app-title">GitHub Changelog</h1>
          @if (changelog()) {
            <div class="repo-info">
              <a
                [href]="changelog()!.repository.url"
                target="_blank"
                rel="noopener noreferrer"
                class="repo-link"
              >
                <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                {{ changelog()!.repository.owner }}/{{ changelog()!.repository.name }}
              </a>
            </div>
          }
        </div>
        <p class="app-description" *ngIf="changelog()">
          Closed issues from <strong>{{ changelog()!.repository.owner }}/{{ changelog()!.repository.name }}</strong>
          grouped by month. Updated {{ formatDate(changelog()!.generatedAt) }}.
        </p>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
      border-bottom: 1px solid #30363d;
      padding: 2rem 1.5rem;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(ellipse at 50% 0%, rgba(88, 166, 255, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    .header-content {
      max-width: 900px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .header-main {
      display: flex;
      align-items: baseline;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }

    .app-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #f0f6fc;
      letter-spacing: -0.02em;
    }

    .repo-info {
      display: flex;
      align-items: center;
    }

    .repo-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #58a6ff;
      text-decoration: none;
      font-size: 1rem;
      font-weight: 500;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      transition: all 0.15s ease;
      background: rgba(88, 166, 255, 0.1);
      border: 1px solid rgba(88, 166, 255, 0.2);
    }

    .repo-link:hover {
      background: rgba(88, 166, 255, 0.2);
      border-color: rgba(88, 166, 255, 0.4);
      color: #79b8ff;
      transform: translateY(-1px);
    }

    .github-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .app-description {
      margin: 0;
      color: #8b949e;
      font-size: 0.95rem;
      line-height: 1.5;
      max-width: 700px;
    }

    .app-description strong {
      color: #c9d1d9;
    }

    @media (max-width: 640px) {
      .header {
        padding: 1.5rem 1rem;
      }

      .app-title {
        font-size: 1.5rem;
      }

      .header-main {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .app-description {
        font-size: 0.875rem;
      }
    }
  `],
})
export class HeaderComponent {
  changelog = input<ChangelogData | null>(null);

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }
}