import {describe, expect, it} from 'vitest';
import {createOpenPrediction, potentialReturn, toggleSelection} from '../src/features/predictions/prediction.service';
import type {SportEvent} from '../src/domain/types';

const event: SportEvent = {
  id: 'football-1',
  sport: 'Football',
  league: 'Premier League',
  status: 'upcoming',
  statusText: 'Not started',
  startTime: '2026-08-15T12:00:00Z',
  home: 'Home FC',
  away: 'Away FC',
  homeLogo: '',
  awayLogo: '',
  homeScore: '—',
  awayScore: '—',
  marketCount: 3,
  multipliers: [1.8, 3.2, 2.1],
  suspended: false,
  sourceUrl: ''
};

describe('prediction service', () => {
  it('keeps only one outcome per event', () => {
    const home = toggleSelection([], event, 0);
    const away = toggleSelection(home, event, 2);
    expect(away).toHaveLength(1);
    expect(away[0]?.label).toBe('Away FC');
  });

  it('does not select a suspended market', () => {
    expect(toggleSelection([], {...event, suspended: true}, 0)).toEqual([]);
  });

  it('calculates and records a virtual return', () => {
    const selections = toggleSelection([], event, 0);
    expect(potentialReturn(selections, 100)).toBe(180);
    const prediction = createOpenPrediction(selections, 100);
    expect(prediction.potentialReturn).toBe(180);
    expect(prediction.stake).toBe(100);
  });
});
