import type {AdminUser, AppState, ClientUser, OpenPrediction, WalletTransaction} from './types';

export function currentUser(state: AppState): ClientUser | null {
  if (state.authSession?.kind !== 'user') return null;
  return state.users.find(user => user.id === state.authSession?.accountId && user.active) ?? null;
}

export function currentAdmin(state: AppState): AdminUser | null {
  if (state.authSession?.kind !== 'admin') return null;
  return state.admins.find(admin => String(admin.id) === state.authSession?.accountId && admin.active) ?? null;
}

export function currentBalance(state: AppState): number {
  const user = currentUser(state);
  return user ? state.wallets.find(wallet => wallet.userId === user.id)?.balance ?? 0 : 0;
}

export function currentPredictions(state: AppState): OpenPrediction[] {
  const user = currentUser(state);
  return user ? state.predictions.filter(prediction => prediction.userId === user.id) : [];
}

export function currentWalletTransactions(state: AppState): WalletTransaction[] {
  const user = currentUser(state);
  return user ? state.walletTransactions.filter(transaction => transaction.userId === user.id) : [];
}

export function usersForAdmin(state: AppState, admin: AdminUser): ClientUser[] {
  return admin.role === 'SUPER_ADMIN'
    ? state.users
    : state.users.filter(user => user.adminPublicId === admin.publicId);
}
