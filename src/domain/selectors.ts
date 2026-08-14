import type {AppState, SportEvent} from './types';

export function visibleEvents(state: AppState): SportEvent[] {
  return state.events.filter(event => {
    const sportMatches = state.selectedSport === 'All' || event.sport === state.selectedSport;
    const viewMatches = state.viewMode === 'results'
      ? event.status === 'finished'
      : state.viewMode === 'live'
        ? event.status === 'live'
        : event.status !== 'finished';
    return sportMatches && viewMatches && (!state.liveOnly || event.status === 'live');
  });
}

export function marketHeading(state: AppState): string {
  if (state.viewMode === 'results') {
    return state.selectedSport === 'All' ? 'Recent results' : `${state.selectedSport} results`;
  }
  if (state.viewMode === 'live' || state.liveOnly) {
    return state.selectedSport === 'All' ? 'Live now' : `Live ${state.selectedSport}`;
  }
  return state.selectedSport === 'All' ? 'Live & upcoming events' : state.selectedSport;
}
