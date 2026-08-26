import { formatDuration, formatRelativeTime, formatDateTime } from '../src/utils/date';

describe('Date and Duration Utilities', () => {
  describe('formatDuration', () => {
    it('formats seconds into MM:SS when less than 1 hour', () => {
      expect(formatDuration(0)).toBe('00:00');
      expect(formatDuration(45)).toBe('00:45');
      expect(formatDuration(65)).toBe('01:05');
      expect(formatDuration(599)).toBe('09:59');
      expect(formatDuration(3599)).toBe('59:59');
    });

    it('formats seconds into HH:MM:SS when 1 hour or more', () => {
      expect(formatDuration(3600)).toBe('01:00:00');
      expect(formatDuration(3665)).toBe('01:01:05');
      expect(formatDuration(7200)).toBe('02:00:00');
      expect(formatDuration(28800)).toBe('08:00:00');
    });
  });

  describe('formatRelativeTime', () => {
    it('returns "Just now" for empty or very recent dates', () => {
      expect(formatRelativeTime(undefined)).toBe('Just now');
      expect(formatRelativeTime(new Date().toISOString())).toBe('Just now');
    });

    it('returns minutes ago', () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinsAgo)).toBe('5m ago');
    });

    it('returns hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
    });

    it('returns days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
      expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
    });
  });

  describe('formatDateTime', () => {
    it('returns empty string for undefined input', () => {
      expect(formatDateTime(undefined)).toBe('');
    });

    it('formats ISO date string into readable date time', () => {
      const formatted = formatDateTime('2026-08-26T14:30:00.000Z');
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });
});
