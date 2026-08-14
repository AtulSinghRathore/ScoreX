import type {EventStatus, Sport, SportEvent, SportScoreMatchDto} from './types';
import {createVirtualMultipliers} from './virtual-market';
import {hashString} from '../shared/hash';
import {safeHttpsUrl} from '../shared/security';

export function normalizeEventStatus(value: unknown): EventStatus {
  const status = String(value ?? '').toLowerCase();
  if (['live', 'playing', 'inprogress', 'in_progress', 'in-play'].includes(status)) return 'live';
  if (['finished', 'ended', 'complete', 'completed', 'fulltime'].includes(status)) return 'finished';
  return 'upcoming';
}

export function mapSportScoreMatch(sport: Sport, match: SportScoreMatchDto): SportEvent {
  const status = normalizeEventStatus(match.status);
  const key = match.url || `${match.home}-${match.away}-${match.time}`;
  const statusText = match.status_text || (status === 'live' ? 'Live' : status === 'finished' ? 'Finished' : 'Upcoming');
  return {
    id: `${sport.toLowerCase()}-${hashString(key).toString(36)}`,
    sport,
    league: match.competition || 'Live sport',
    status,
    statusText,
    startTime: match.time || '',
    home: match.home || 'Home',
    away: match.away || 'Away',
    homeLogo: safeHttpsUrl(match.home_logo),
    awayLogo: safeHttpsUrl(match.away_logo),
    homeScore: String(match.home_score ?? '—'),
    awayScore: String(match.away_score ?? '—'),
    marketCount: sport === 'Football' || sport === 'Cricket' ? 3 : 2,
    multipliers: createVirtualMultipliers(sport, key),
    suspended: status === 'finished',
    sourceUrl: safeHttpsUrl(match.url)
  };
}

export function sortEvents(events: readonly SportEvent[]): SportEvent[] {
  const rank: Record<EventStatus, number> = {live: 0, upcoming: 1, finished: 2};
  return [...events].sort((left, right) => {
    const statusDifference = rank[left.status] - rank[right.status];
    if (statusDifference !== 0) return statusDifference;
    return new Date(left.startTime || 0).getTime() - new Date(right.startTime || 0).getTime();
  });
}
