import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ChangelogData, MonthlyGroup, Issue } from '../models/changelog.model';

@Injectable({
  providedIn: 'root',
})
export class ChangelogService {
  private readonly dataUrl = '/data/changelog.json';

  constructor(private http: HttpClient) {}

  getChangelog(): Observable<ChangelogData | null> {
    return this.http.get<ChangelogData>(this.dataUrl).pipe(
      map(data => this.processData(data)),
      catchError(error => {
        console.error('Failed to load changelog:', error);
        return of(null);
      })
    );
  }

  private processData(data: ChangelogData): ChangelogData {
    const monthlyGroups = data.monthlyGroups.map(group => ({
      ...group,
      issues: [...group.issues].sort((a, b) =>
        new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()
      ),
    }));

    monthlyGroups.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      const monthOrder = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month);
    });

    return {
      ...data,
      monthlyGroups,
    };
  }

  getClosingReasonLabel(reason: string | null): string {
    switch (reason) {
      case 'COMPLETED':
        return 'Completed';
      case 'NOT_PLANNED':
        return 'Not Planned';
      default:
        return 'Closed';
    }
  }

  getClosingReasonClass(reason: string | null): string {
    switch (reason) {
      case 'COMPLETED':
        return 'badge-completed';
      case 'NOT_PLANNED':
        return 'badge-not-planned';
      default:
        return 'badge-default';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }
}