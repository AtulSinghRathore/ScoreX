import {describe, expect, it} from 'vitest';
import {mapSportScoreMatch, normalizeEventStatus, sortEvents} from '../src/domain/live-event.mapper';

describe('live-event mapper', () => {
  it('normalizes provider status variants', () => {
    expect(normalizeEventStatus('in_progress')).toBe('live');
    expect(normalizeEventStatus('finished')).toBe('finished');
    expect(normalizeEventStatus('not_started')).toBe('upcoming');
  });

  it('maps provider data without treating scores as virtual odds', () => {
    const event = mapSportScoreMatch('Cricket', {
      home: 'India',
      away: 'Australia',
      home_score: '189/4',
      away_score: '—',
      status: 'live',
      status_text: '2nd innings',
      time: '2026-08-15T12:00:00Z',
      competition: 'Test Series',
      url: '/cricket/match/india-vs-australia/'
    });

    expect(event.status).toBe('live');
    expect(event.homeScore).toBe('189/4');
    expect(event.marketCount).toBe(3);
    expect(event.sourceUrl).toBe('https://sportscore.com/cricket/match/india-vs-australia/');
  });

  it('sorts live events before upcoming and completed events', () => {
    const base = mapSportScoreMatch('Football', {home: 'A', away: 'B'});
    const result = sortEvents([
      {...base, id: 'finished', status: 'finished'},
      {...base, id: 'upcoming', status: 'upcoming'},
      {...base, id: 'live', status: 'live'}
    ]);
    expect(result.map(event => event.id)).toEqual(['live', 'upcoming', 'finished']);
  });
});
