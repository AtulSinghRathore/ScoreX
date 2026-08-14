import type {AdminUser, AuditEntry} from '../domain/types';

export const APP_CONFIG = {
  providerName: 'SportScore',
  matchesEndpoint: 'https://sportscore.com/api/widget/matches/',
  providerHome: 'https://sportscore.com/',
  matchesPerSport: 50,
  providerDailyRequestLimit: 10_000,
  providerCacheMs: 60_000,
  refreshIntervalMs: 90_000,
  minimumRequestIntervalMs: 60_000,
  requestTimeoutMs: 12_000,
  sourceIdentifier: 'scorex',
  startingBalance: 25_000,
  eventPageSize: 24
} as const;

export const STORAGE_KEYS = {
  liveCache: 'scorex.live-cache.v2',
  session: 'scorex.session.v2'
} as const;

export const DEFAULT_ADMINS: AdminUser[] = [
  {id: 1, name: 'Atul Singh', email: 'superadmin@scorex.demo', role: 'SUPER_ADMIN', active: true, lastLogin: 'Just now'},
  {id: 2, name: 'Priya Sharma', email: 'markets@scorex.demo', role: 'MARKET_MANAGER', active: true, lastLogin: '2 hours ago'},
  {id: 3, name: 'Rahul Verma', email: 'support@scorex.demo', role: 'SUPPORT_AGENT', active: true, lastLogin: 'Yesterday'}
];

export const DEFAULT_AUDIT: AuditEntry[] = [
  {action: 'Super Admin signed in to the local console', time: 'Just now'}
];
