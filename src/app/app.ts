import { Component, signal, effect, inject } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { HeaderComponent } from './components/header/header.component';
import { StatsComponent } from './components/stats/stats.component';
import { IssueListComponent } from './components/issue-list/issue-list.component';
import { ChangelogService } from './services/changelog.service';
import { ChangelogData } from './models/changelog.model';

@Component({
  imports: [HttpClientModule, HeaderComponent, StatsComponent, IssueListComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  template: `
    <div class="app">
      <app-header [changelog]="changelog()" />
      <app-stats [changelog]="changelog()" />
      <app-issue-list [changelog]="changelog()" [loading]="loading()" />
    </div>
  `,
})
export class App {
  private changelogService = inject(ChangelogService);

  changelog = signal<ChangelogData | null>(null);
  loading = signal(true);

  constructor() {
    effect(() => {
      this.loadChangelog();
    });
  }

  private loadChangelog(): void {
    this.loading.set(true);
    this.changelogService.getChangelog().subscribe({
      next: (data) => {
        this.changelog.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.changelog.set(null);
        this.loading.set(false);
      },
    });
  }
}