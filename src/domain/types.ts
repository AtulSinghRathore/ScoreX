export const SUPPORTED_SPORTS = ['Cricket', 'Football', 'Basketball', 'Tennis'] as const;

export type Sport = (typeof SUPPORTED_SPORTS)[number];
export type SportFilter = Sport | 'All';
export type EventStatus = 'live' | 'upcoming' | 'finished';
export type ViewMode = 'sports' | 'live' | 'upcoming' | 'results' | 'admin';
export type ScheduleFilter = 'all' | 'today' | 'tomorrow' | 'later';
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MARKET_MANAGER' | 'SUPPORT_AGENT' | 'VIEWER';
export type AccountKind = 'user' | 'admin';
export type PredictionStatus = 'open' | 'won' | 'lost';
export type WalletTransactionKind = 'admin_credit' | 'admin_debit' | 'prediction_stake' | 'prediction_return';
export type TopUpStatus = 'pending' | 'credited' | 'declined';

export interface SportScoreMatchDto {
  home?: string | null;
  away?: string | null;
  home_logo?: string | null;
  away_logo?: string | null;
  home_score?: string | number | null;
  away_score?: string | number | null;
  status?: string | null;
  status_text?: string | null;
  time?: string | null;
  competition?: string | null;
  url?: string | null;
}

export interface SportScoreResponseDto {
  sport?: string;
  count?: number;
  matches: SportScoreMatchDto[];
  updated?: string;
}

export interface SportEvent {
  id: string;
  sport: Sport;
  league: string;
  status: EventStatus;
  statusText: string;
  startTime: string;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: string;
  awayScore: string;
  marketCount: number;
  multipliers: readonly [number, number, number];
  suspended: boolean;
  sourceUrl: string;
}

export interface PredictionSelection {
  id: string;
  eventId: string;
  match: string;
  label: string;
  market: string;
  multiplier: number;
  outcomeIndex: number;
}

export interface OpenPrediction extends PredictionSelection {
  userId: string;
  selections: PredictionSelection[];
  stake: number;
  potentialReturn: number;
  placedAt: string;
  status: PredictionStatus;
  payout: number;
  settledAt: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  lastLogin: string;
  publicId: string;
  passwordHash: string;
  upiId: string;
}

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  adminPublicId: string;
  active: boolean;
  createdAt: string;
}

export interface AuthSession {
  kind: AccountKind;
  accountId: string;
}

export interface WalletAccount {
  userId: string;
  balance: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  adminPublicId: string;
  kind: WalletTransactionKind;
  amount: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
}

export interface TopUpRequest {
  id: string;
  userId: string;
  adminPublicId: string;
  sxcAmount: number;
  paymentAmount: number;
  upiId: string;
  status: TopUpStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  action: string;
  time: string;
}

export interface FeedState {
  loading: boolean;
  refreshing: boolean;
  error: string;
  lastUpdatedAt: Date | null;
  lastRequestAt: Date | null;
}

export interface AppState {
  events: SportEvent[];
  selectedSport: SportFilter;
  viewMode: ViewMode;
  scheduleFilter: ScheduleFilter;
  liveOnly: boolean;
  visibleEventLimit: number;
  selections: PredictionSelection[];
  authSession: AuthSession | null;
  users: ClientUser[];
  wallets: WalletAccount[];
  walletTransactions: WalletTransaction[];
  predictions: OpenPrediction[];
  topUpRequests: TopUpRequest[];
  admins: AdminUser[];
  audit: AuditEntry[];
  suspendedEventIds: string[];
  feed: FeedState;
}

export interface LiveCache {
  updated: string;
  events: SportEvent[];
}

export interface PersistedSession {
  authSession: AuthSession | null;
  users: ClientUser[];
  wallets: WalletAccount[];
  walletTransactions: WalletTransaction[];
  predictions: OpenPrediction[];
  topUpRequests: TopUpRequest[];
  admins: AdminUser[];
  audit: AuditEntry[];
  suspendedEventIds: string[];
}
