import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ChangelogService } from '../../services/changelog.service';
import { ChangelogData } from '../../models/issue.model';

@Component({
  selector: 'app-changelog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './changelog.component.html',
  styleUrl: './changelog.component.css',
  providers: [DatePipe],
})
export class ChangelogComponent implements OnInit {
  protected readonly changelogData = signal<ChangelogData | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly totalClosed = computed(() => this.changelogData()?.totalClosed ?? 0);
  protected readonly totalCompleted = computed(() => this.changelogData()?.totalCompleted ?? 0);
  protected readonly totalNotPlanned = computed(() => this.changelogData()?.totalNotPlanned ?? 0);
  protected readonly groupedByMonth = computed(() => this.changelogData()?.groupedByMonth ?? []);
  protected readonly hasIssues = computed(() => this.totalClosed() > 0);
  protected readonly generatedAt = computed(() => this.changelogData()?.generatedAt);

  constructor(private changelogService: ChangelogService) {}

  ngOnInit(): void {
    this.loadChangelog();
  }

  protected reloadChangelog(): void {
    // Force a fresh fetch by adding a cache-busting parameter
    this.loadChangelog();
  }

  private loadChangelog(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.changelogService.fetchChangelog().subscribe({
      next: (data) => {
        this.changelogData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load changelog');
        this.isLoading.set(false);
      },
    });
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected formatGeneratedAt(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  }

  protected getStateReasonClass(reason: 'COMPLETED' | 'NOT_PLANNED' | null): string {
    switch (reason) {
      case 'COMPLETED':
        return 'completed';
      case 'NOT_PLANNED':
        return 'not-planned';
      default:
        return 'unknown';
    }
  }

  protected getStateReasonLabel(reason: 'COMPLETED' | 'NOT_PLANNED' | null): string {
    switch (reason) {
      case 'COMPLETED':
        return 'Completed';
      case 'NOT_PLANNED':
        return 'Not Planned';
      default:
        return 'Unknown';
    }
  }

  protected getLabelTextColor(hexColor: string): string {
    // Calculate luminance to determine text color
    const r = parseInt(hexColor.slice(0, 2), 16);
    const g = parseInt(hexColor.slice(2, 4), 16);
    const b = parseInt(hexColor.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
}