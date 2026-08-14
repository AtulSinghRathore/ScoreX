import type {AdminUser, AuditEntry, ClientUser, OpenPrediction, WalletAccount, WalletTransaction} from '../domain/types';

const DEMO_PASSWORD_HASH = '59d0f2d6b8e726e4a0d70e93c4b17d3491bc505825e6313516331e55c0e83155';

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
  sxcPerRupee: 10,
  eventPageSize: 24
} as const;

export const STORAGE_KEYS = {
  liveCache: 'scorex.live-cache.v2',
  session: 'scorex.session.v3'
} as const;

export const DEFAULT_ADMINS: AdminUser[] = [
  {id: 1, name: 'Atul Singh', email: 'superadmin@scorex.demo', role: 'SUPER_ADMIN', active: true, lastLogin: 'Never', publicId: 'SXA-ATUL-01', passwordHash: DEMO_PASSWORD_HASH, upiId: 'scorex.atul@upi'},
  {id: 2, name: 'Priya Sharma', email: 'markets@scorex.demo', role: 'MARKET_MANAGER', active: true, lastLogin: 'Never', publicId: 'SXA-PRIYA-02', passwordHash: DEMO_PASSWORD_HASH, upiId: 'scorex.priya@upi'},
  {id: 3, name: 'Rahul Verma', email: 'support@scorex.demo', role: 'SUPPORT_AGENT', active: true, lastLogin: 'Never', publicId: 'SXA-RAHUL-03', passwordHash: DEMO_PASSWORD_HASH, upiId: 'scorex.rahul@upi'}
];

export const DEFAULT_USERS: ClientUser[] = [{
  id: 'user-demo',
  name: 'Demo Player',
  email: 'demo@scorex.demo',
  passwordHash: DEMO_PASSWORD_HASH,
  adminPublicId: 'SXA-ATUL-01',
  active: true,
  createdAt: '2026-08-01T10:00:00.000Z'
}];

export const DEFAULT_WALLETS: WalletAccount[] = [{userId: 'user-demo', balance: APP_CONFIG.startingBalance}];

export const DEFAULT_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {id: 'txn-demo-4', userId: 'user-demo', adminPublicId: 'SYSTEM', kind: 'prediction_stake', amount: -800, balanceAfter: 25_000, note: 'Prediction stake · England v Spain', createdAt: '2026-08-12T15:00:00.000Z'},
  {id: 'txn-demo-3', userId: 'user-demo', adminPublicId: 'SYSTEM', kind: 'prediction_return', amount: 1_800, balanceAfter: 25_800, note: 'Prediction return · India v Australia', createdAt: '2026-08-10T18:00:00.000Z'},
  {id: 'txn-demo-2', userId: 'user-demo', adminPublicId: 'SYSTEM', kind: 'prediction_stake', amount: -1_000, balanceAfter: 24_000, note: 'Prediction stake · India v Australia', createdAt: '2026-08-10T14:00:00.000Z'},
  {id: 'txn-demo-1', userId: 'user-demo', adminPublicId: 'SXA-ATUL-01', kind: 'admin_credit', amount: 25_000, balanceAfter: 25_000, note: 'Opening demo balance', createdAt: '2026-08-01T10:05:00.000Z'}
];

export const DEFAULT_PREDICTIONS: OpenPrediction[] = [
  {
    id: 'history-lost', eventId: 'archive-football-1', match: 'England v Spain', label: 'England',
    market: 'ScoreX match prediction', multiplier: 2.1, outcomeIndex: 0, userId: 'user-demo',
    selections: [{id: 'archive-football-1::0', eventId: 'archive-football-1', match: 'England v Spain', label: 'England', market: 'ScoreX match prediction', multiplier: 2.1, outcomeIndex: 0}],
    stake: 800, potentialReturn: 1_680, placedAt: '2026-08-12T15:00:00.000Z', status: 'lost', payout: 0, settledAt: '2026-08-12T18:00:00.000Z'
  },
  {
    id: 'history-won', eventId: 'archive-cricket-1', match: 'India v Australia', label: 'India',
    market: 'ScoreX match prediction', multiplier: 1.8, outcomeIndex: 0, userId: 'user-demo',
    selections: [{id: 'archive-cricket-1::0', eventId: 'archive-cricket-1', match: 'India v Australia', label: 'India', market: 'ScoreX match prediction', multiplier: 1.8, outcomeIndex: 0}],
    stake: 1_000, potentialReturn: 1_800, placedAt: '2026-08-10T14:00:00.000Z', status: 'won', payout: 1_800, settledAt: '2026-08-10T18:00:00.000Z'
  }
];

export const DEFAULT_AUDIT: AuditEntry[] = [
  {action: 'ScoreX local identity and wallet demo initialized', time: 'System'}
];
