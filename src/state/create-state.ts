import {APP_CONFIG} from '../config/app';
import {sortEvents} from '../domain/live-event.mapper';
import type {AppState} from '../domain/types';
import type {BrowserStorage} from '../services/browser-storage';

export function createState(storage: BrowserStorage): AppState {
  const session = storage.loadSession(APP_CONFIG.startingBalance);
  const cache = storage.loadLiveCache();
  const cacheDate = cache?.updated ? new Date(cache.updated) : null;
  return {
    events: cache?.events ? sortEvents(cache.events) : [],
    selectedSport: 'All',
    viewMode: 'sports',
    liveOnly: false,
    selections: [],
    balance: Number.isFinite(session.balance) ? session.balance : APP_CONFIG.startingBalance,
    openPredictions: Array.isArray(session.openPredictions) ? session.openPredictions : [],
    admins: Array.isArray(session.admins) ? session.admins : [],
    audit: Array.isArray(session.audit) ? session.audit : [],
    feed: {
      loading: true,
      refreshing: false,
      error: '',
      lastUpdatedAt: cacheDate && !Number.isNaN(cacheDate.getTime()) ? cacheDate : null
    }
  };
}
