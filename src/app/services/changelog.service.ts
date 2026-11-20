import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { ChangelogData, MonthlyIssues } from '../models/issue.model';

@Injectable({
  providedIn: 'root',
})
export class ChangelogService {
  private readonly CHANGELOG_URL = '/data/changelog.json';

  constructor(private http: HttpClient) {}

  fetchChangelog(): Observable<ChangelogData> {
    return this.http.get<ChangelogData>(this.CHANGELOG_URL).pipe(
      map((data) => {
        // Ensure the data has the expected structure
        return {
          issues: data.issues || [],
          totalClosed: data.totalClosed ?? 0,
          totalCompleted: data.totalCompleted ?? 0,
          totalNotPlanned: data.totalNotPlanned ?? 0,
          groupedByMonth: data.groupedByMonth || [],
          generatedAt: data.generatedAt,
        };
      }),
      catchError((error) => {
        console.error('Failed to load changelog:', error);
        return throwError(() => new Error('Failed to load changelog data'));
      })
    );
  }
}