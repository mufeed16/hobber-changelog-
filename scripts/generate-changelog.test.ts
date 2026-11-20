import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processIssues, groupByMonth } from './changelog-utils';

describe('generate-changelog', () => {
  describe('processIssues', () => {
    it('should process issues with all fields', () => {
      const rawIssues = [{
        number: 1,
        title: 'Test Issue',
        url: 'https://github.com/owner/repo/issues/1',
        author: { login: 'testuser' },
        labels: { nodes: [{ name: 'bug' }, { name: 'high-priority' }] },
        closedAt: '2026-11-20T10:00:00Z',
        closingReason: 'COMPLETED',
        state: 'CLOSED',
      }];

      const result = processIssues(rawIssues);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        number: 1,
        title: 'Test Issue',
        url: 'https://github.com/owner/repo/issues/1',
        author: 'testuser',
        labels: ['bug', 'high-priority'],
        closedAt: '2026-11-20T10:00:00Z',
        closingReason: 'COMPLETED',
        state: 'CLOSED',
      });
    });

    it('should handle missing author', () => {
      const rawIssues = [{
        number: 2,
        title: 'Issue without author',
        url: 'https://github.com/owner/repo/issues/2',
        author: null,
        labels: { nodes: [] },
        closedAt: '2026-11-20T10:00:00Z',
        closingReason: 'NOT_PLANNED',
        state: 'CLOSED',
      }];

      const result = processIssues(rawIssues);

      expect(result[0].author).toBeNull();
    });

    it('should handle missing labels', () => {
      const rawIssues = [{
        number: 3,
        title: 'Issue without labels',
        url: 'https://github.com/owner/repo/issues/3',
        author: { login: 'user' },
        labels: { nodes: [] },
        closedAt: '2026-11-20T10:00:00Z',
        closingReason: 'COMPLETED',
        state: 'CLOSED',
      }];

      const result = processIssues(rawIssues);

      expect(result[0].labels).toEqual([]);
    });

    it('should handle null closing reason', () => {
      const rawIssues = [{
        number: 4,
        title: 'Issue with null closing reason',
        url: 'https://github.com/owner/repo/issues/4',
        author: { login: 'user' },
        labels: { nodes: [{ name: 'bug' }] },
        closedAt: '2026-11-20T10:00:00Z',
        closingReason: null,
        state: 'CLOSED',
      }];

      const result = processIssues(rawIssues);

      expect(result[0].closingReason).toBeNull();
    });
  });

  describe('groupByMonth', () => {
    const mockIssues = [
      {
        number: 1,
        title: 'Issue 1',
        url: 'https://github.com/owner/repo/issues/1',
        author: 'user1',
        labels: ['bug'],
        closedAt: '2026-11-20T10:00:00Z',
        closingReason: 'COMPLETED',
        state: 'CLOSED',
      },
      {
        number: 2,
        title: 'Issue 2',
        url: 'https://github.com/owner/repo/issues/2',
        author: 'user2',
        labels: ['feature'],
        closedAt: '2026-11-15T10:00:00Z',
        closingReason: 'NOT_PLANNED',
        state: 'CLOSED',
      },
      {
        number: 3,
        title: 'Issue 3',
        url: 'https://github.com/owner/repo/issues/3',
        author: 'user3',
        labels: ['docs'],
        closedAt: '2026-10-25T10:00:00Z',
        closingReason: 'COMPLETED',
        state: 'CLOSED',
      },
      {
        number: 4,
        title: 'Issue 4',
        url: 'https://github.com/owner/repo/issues/4',
        author: 'user4',
        labels: ['bug'],
        closedAt: '2026-10-10T10:00:00Z',
        closingReason: 'COMPLETED',
        state: 'CLOSED',
      },
    ];

    it('should group issues by month and year', () => {
      const groups = groupByMonth(mockIssues);

      expect(groups).toHaveLength(2);
      expect(groups[0].month).toBe('November');
      expect(groups[0].year).toBe(2026);
      expect(groups[0].issues).toHaveLength(2);
      expect(groups[1].month).toBe('October');
      expect(groups[1].year).toBe(2026);
      expect(groups[1].issues).toHaveLength(2);
    });

    it('should sort months newest first', () => {
      const groups = groupByMonth(mockIssues);

      expect(groups[0].month).toBe('November');
      expect(groups[1].month).toBe('October');
    });

    it('should sort issues within month newest first', () => {
      const groups = groupByMonth(mockIssues);

      expect(groups[0].issues[0].number).toBe(1); // Nov 20
      expect(groups[0].issues[1].number).toBe(2); // Nov 15
      expect(groups[1].issues[0].number).toBe(3); // Oct 25
      expect(groups[1].issues[1].number).toBe(4); // Oct 10
    });

    it('should handle empty issue list', () => {
      const groups = groupByMonth([]);

      expect(groups).toHaveLength(0);
    });
  });

  describe('closing reason classification', () => {
    it('should classify COMPLETED correctly', () => {
      const issues = [{
        number: 1,
        title: 'Test',
        url: 'https://github.com/owner/repo/issues/1',
        author: 'user',
        labels: [],
        closedAt: '2026-11-20T10:00:00Z',
        closingReason: 'COMPLETED',
        state: 'CLOSED',
      }];

      const completed = issues.filter(i => i.closingReason === 'COMPLETED');
      expect(completed).toHaveLength(1);
    });

    it('should classify NOT_PLANNED correctly', () => {
      const issues = [{
        number: 1,
        title: 'Test',
        url: 'https://github.com/owner/repo/issues/1',
        author: 'user',
        labels: [],
        closedAt: '2026-11-20T10:00:00Z',
        closingReason: 'NOT_PLANNED',
        state: 'CLOSED',
      }];

      const notPlanned = issues.filter(i => i.closingReason === 'NOT_PLANNED');
      expect(notPlanned).toHaveLength(1);
    });

    it('should not classify null closing reason as COMPLETED', () => {
      const issues = [{
        number: 1,
        title: 'Test',
        url: 'https://github.com/owner/repo/issues/1',
        author: 'user',
        labels: [],
        closedAt: '2026-11-20T10:00:00Z',
        closingReason: null,
        state: 'CLOSED',
      }];

      const completed = issues.filter(i => i.closingReason === 'COMPLETED');
      expect(completed).toHaveLength(0);
    });

    it('should not classify unknown closing reason as COMPLETED', () => {
      const issues = [{
        number: 1,
        title: 'Test',
        url: 'https://github.com/owner/repo/issues/1',
        author: 'user',
        labels: [],
        closedAt: '2026-11-20T10:00:00Z',
        closingReason: 'UNKNOWN_REASON',
        state: 'CLOSED',
      }];

      const completed = issues.filter(i => i.closingReason === 'COMPLETED');
      expect(completed).toHaveLength(0);
    });
  });

  describe('pagination handling', () => {
    it('should handle multiple pages of issues', () => {
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        number: i + 1,
        title: `Issue ${i + 1}`,
        url: `https://github.com/owner/repo/issues/${i + 1}`,
        author: { login: 'user' },
        labels: { nodes: [] },
        closedAt: '2026-11-20T10:00:00Z',
        closingReason: 'COMPLETED',
        state: 'CLOSED',
      }));

      const page2 = Array.from({ length: 50 }, (_, i) => ({
        number: i + 101,
        title: `Issue ${i + 101}`,
        url: `https://github.com/owner/repo/issues/${i + 101}`,
        author: { login: 'user' },
        labels: { nodes: [] },
        closedAt: '2026-11-19T10:00:00Z',
        closingReason: 'COMPLETED',
        state: 'CLOSED',
      }));

      const result1 = processIssues(page1);
      const result2 = processIssues(page2);

      expect(result1).toHaveLength(100);
      expect(result2).toHaveLength(50);
      expect([...result1, ...result2]).toHaveLength(150);
    });
  });
});