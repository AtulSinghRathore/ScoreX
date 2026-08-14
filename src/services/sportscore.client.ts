import {APP_CONFIG} from '../config/app';
import {mapSportScoreMatch, sortEvents} from '../domain/live-event.mapper';
import {SUPPORTED_SPORTS, type Sport, type SportEvent, type SportScoreResponseDto} from '../domain/types';

export interface SportsFeedResult {
  events: SportEvent[];
  successfulSports: Sport[];
  failedSports: Sport[];
  updatedAt: Date | null;
}

export class SportScoreClient {
  async fetchAll(signal: AbortSignal): Promise<SportsFeedResult> {
    const results = await Promise.allSettled(
      SUPPORTED_SPORTS.map(sport => this.fetchSport(sport, signal))
    );
    const successful = results
      .filter((result): result is PromiseFulfilledResult<{sport: Sport; payload: SportScoreResponseDto}> => result.status === 'fulfilled')
      .map(result => result.value);
    const failedSports = results.flatMap((result, index) =>
      result.status === 'rejected' ? [SUPPORTED_SPORTS[index] as Sport] : []
    );
    const timestamps = successful
      .map(result => new Date(result.payload.updated || ''))
      .filter(date => !Number.isNaN(date.getTime()));

    return {
      events: sortEvents(successful.flatMap(({sport, payload}) =>
        payload.matches.map(match => mapSportScoreMatch(sport, match))
      )),
      successfulSports: successful.map(result => result.sport),
      failedSports,
      updatedAt: timestamps.length
        ? new Date(Math.max(...timestamps.map(date => date.getTime())))
        : successful.length ? new Date() : null
    };
  }

  private async fetchSport(sport: Sport, signal: AbortSignal): Promise<{sport: Sport; payload: SportScoreResponseDto}> {
    const url = new URL(APP_CONFIG.matchesEndpoint);
    url.searchParams.set('sport', sport.toLowerCase());
    url.searchParams.set('limit', String(APP_CONFIG.matchesPerSport));
    url.searchParams.set('src', APP_CONFIG.sourceIdentifier);
    const response = await fetch(url, {
      signal,
      headers: {'Accept': 'application/json'}
    });
    if (!response.ok) throw new Error(`${sport} returned HTTP ${response.status}`);
    const payload = await response.json() as SportScoreResponseDto;
    if (!payload || !Array.isArray(payload.matches)) {
      throw new Error(`${sport} returned an invalid response`);
    }
    return {sport, payload};
  }
}
