import {APP_CONFIG} from '../config/app';
import {sortEvents} from '../domain/live-event.mapper';
import {applyMarketSuspensions} from '../features/admin/admin.service';
import type {AppState} from '../domain/types';
import type {BrowserStorage} from '../services/browser-storage';

export function createState(storage: BrowserStorage): AppState {
  const session = storage.loadSession();
  const cache = storage.loadLiveCache();
  const cacheDate = cache?.updated ? new Date(cache.updated) : null;
  return {
    events: cache?.events ? applyMarketSuspensions(sortEvents(cache.events), session.suspendedEventIds) : [],
    selectedSport: 'All',
    viewMode: 'sports',
    scheduleFilter: 'all',
    liveOnly: false,
    visibleEventLimit: APP_CONFIG.eventPageSize,
    selections: [],
    authSession: session.authSession ?? null,
    users: Array.isArray(session.users) ? session.users : [],
    wallets: Array.isArray(session.wallets) ? session.wallets : [],
    walletTransactions: Array.isArray(session.walletTransactions) ? session.walletTransactions : [],
    predictions: Array.isArray(session.predictions) ? session.predictions : [],
    topUpRequests: Array.isArray(session.topUpRequests) ? session.topUpRequests : [],
    admins: Array.isArray(session.admins) ? session.admins : [],
    audit: Array.isArray(session.audit) ? session.audit : [],
    suspendedEventIds: Array.isArray(session.suspendedEventIds) ? session.suspendedEventIds : [],
    feed: {
      loading: true,
      refreshing: false,
      error: '',
      lastUpdatedAt: cacheDate && !Number.isNaN(cacheDate.getTime()) ? cacheDate : null,
      lastRequestAt: null
    }
  };
}
