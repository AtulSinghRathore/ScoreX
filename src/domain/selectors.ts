import type {AppState, SportEvent} from './types';
import {matchesScheduleFilter} from './event-schedule';

export function visibleEvents(state: AppState): SportEvent[] {
  return state.events.filter(event => {
    const sportMatches = state.selectedSport === 'All' || event.sport === state.selectedSport;
    const viewMatches = state.viewMode === 'results'
      ? event.status === 'finished'
      : state.viewMode === 'live'
        ? event.status === 'live'
        : state.viewMode === 'upcoming'
          ? event.status === 'upcoming'
          : event.status !== 'finished';
    const scheduleMatches = state.viewMode !== 'upcoming'
      || matchesScheduleFilter(event, state.scheduleFilter);
    return sportMatches && viewMatches && scheduleMatches && (!state.liveOnly || event.status === 'live');
  });
}

export function marketHeading(state: AppState): string {
  if (state.viewMode === 'results') {
    return state.selectedSport === 'All' ? 'Recent results' : `${state.selectedSport} results`;
  }
  if (state.viewMode === 'live' || state.liveOnly) {
    return state.selectedSport === 'All' ? 'Live now' : `Live ${state.selectedSport}`;
  }
  if (state.viewMode === 'upcoming') {
    return state.selectedSport === 'All' ? 'Upcoming schedule' : `Upcoming ${state.selectedSport}`;
  }
  return state.selectedSport === 'All' ? 'Live & upcoming events' : state.selectedSport;
}
