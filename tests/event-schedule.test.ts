import {describe, expect, it} from 'vitest';
import {matchesScheduleFilter, scheduleDetails} from '../src/domain/event-schedule';
import type {SportEvent} from '../src/domain/types';

function upcoming(startTime: string): SportEvent {
  return {
    id: startTime,
    sport: 'Cricket',
    league: 'Test league',
    status: 'upcoming',
    statusText: 'Scheduled',
    startTime,
    home: 'India',
    away: 'Australia',
    homeLogo: '',
    awayLogo: '',
    homeScore: '—',
    awayScore: '—',
    marketCount: 3,
    multipliers: [1.8, 3.1, 2.2],
    suspended: false,
    sourceUrl: ''
  };
}

describe('event schedule', () => {
  const now = new Date('2026-08-15T10:00:00Z');
  const timeZone = 'Asia/Kolkata';

  it('groups events by the viewer local date', () => {
    const details = scheduleDetails(upcoming('2026-08-15T11:00:00Z'), now, timeZone);
    expect(details.groupLabel).toBe('Today');
    expect(details.primary).toContain('Today');
    expect(details.secondary).toBe('Starts in 1h 0m');
  });

  it('distinguishes tomorrow and later schedule filters', () => {
    const tomorrow = upcoming('2026-08-16T11:00:00Z');
    const later = upcoming('2026-08-18T11:00:00Z');
    expect(matchesScheduleFilter(tomorrow, 'tomorrow', now, timeZone)).toBe(true);
    expect(matchesScheduleFilter(tomorrow, 'later', now, timeZone)).toBe(false);
    expect(matchesScheduleFilter(later, 'later', now, timeZone)).toBe(true);
  });

  it('labels stale upcoming data as delayed', () => {
    const details = scheduleDetails(upcoming('2026-08-15T09:00:00Z'), now, timeZone);
    expect(details.overdue).toBe(true);
    expect(details.groupLabel).toContain('Delayed');
  });
});
