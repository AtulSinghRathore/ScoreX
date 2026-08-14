import {formatRelativeTime, formatStartTime} from '../../shared/format';
import type {AppState, SportEvent} from '../../domain/types';
import type {AppElements} from '../elements';

function eventDisplayTime(event: SportEvent): string {
  return event.status === 'live' ? event.statusText : formatStartTime(event.startTime);
}

export function renderFeed(elements: AppElements, state: AppState): void {
  const hasData = state.events.length > 0;
  elements.feedLabel.textContent = state.feed.loading
    ? (hasData ? 'REFRESHING LIVE DATA' : 'CONNECTING LIVE DATA')
    : state.feed.error
      ? (hasData ? 'LIVE DATA · PARTIAL' : 'LIVE DATA UNAVAILABLE')
      : 'REAL LIVE SCORES';
  elements.feedMessage.textContent = state.feed.loading
    ? 'Fetching football, basketball, cricket and tennis'
    : state.feed.error || 'Scores refresh automatically every 90 seconds';
  elements.lastUpdated.textContent = formatRelativeTime(state.feed.lastUpdatedAt);
  elements.feedPulse.classList.toggle('error', Boolean(state.feed.error));
  elements.refreshScores.disabled = state.feed.loading;
  elements.refreshScores.textContent = state.feed.loading ? 'Refreshing…' : 'Refresh scores';
}

export function renderHero(elements: AppElements, state: AppState): void {
  const featured = state.events.find(event => event.status === 'live')
    || state.events.find(event => event.status !== 'finished')
    || state.events[0];
  if (!featured) {
    elements.heroMatchType.textContent = 'LIVE SPORTS';
    elements.heroHome.textContent = 'Connecting…';
    elements.heroHomeScore.textContent = '—';
    elements.heroAway.textContent = 'Waiting for live data';
    elements.heroAwayScore.textContent = '—';
    elements.heroStatus.textContent = 'SportScore feed';
    return;
  }
  elements.heroMatchType.textContent = `${featured.status === 'live' ? 'LIVE' : featured.status === 'finished' ? 'FINAL' : 'UPCOMING'} · ${featured.sport}`;
  elements.heroHome.textContent = featured.home;
  elements.heroHomeScore.textContent = featured.homeScore;
  elements.heroAway.textContent = featured.away;
  elements.heroAwayScore.textContent = featured.awayScore;
  elements.heroStatus.textContent = `${featured.league} · ${eventDisplayTime(featured)}`;
}
