import {currentAdmin, currentBalance, currentPredictions, currentUser, currentWalletTransactions, usersForAdmin} from '../../domain/account-selectors';
import {formatCoin, formatPlacedTime} from '../../shared/format';
import {escapeHtml} from '../../shared/security';
import type {AppState} from '../../domain/types';
import type {AppElements} from '../elements';

const TRANSACTION_LABELS = {
  admin_credit: 'Admin credit',
  admin_debit: 'Admin debit',
  prediction_stake: 'Prediction stake',
  prediction_return: 'Prediction return'
} as const;

export function renderAccount(elements: AppElements, state: AppState): void {
  const user = currentUser(state);
  const admin = currentAdmin(state);
  const loggedIn = Boolean(user || admin);
  elements.loginButton.classList.toggle('hidden', loggedIn);
  elements.registerButton.classList.toggle('hidden', loggedIn);
  elements.accountButton.classList.toggle('hidden', !loggedIn);
  elements.accountButton.textContent = user ? user.name.split(' ')[0] || 'Profile' : admin ? `${admin.name.split(' ')[0] || 'Admin'} · Admin` : 'Profile';
  elements.balance.textContent = user ? formatCoin(currentBalance(state)) : admin ? 'Admin session' : 'Sign in for SXC';
  document.querySelector<HTMLButtonElement>('[data-view="admin"]')?.classList.toggle('hidden', Boolean(user));

  if (user) renderUserProfile(elements, state, user.name, user.email, user.adminPublicId);
  if (admin) renderAdminProfile(elements, state, admin.name, admin.email, admin.publicId);
}

function renderUserProfile(elements: AppElements, state: AppState, name: string, email: string, adminPublicId: string): void {
  const predictions = currentPredictions(state);
  const transactions = currentWalletTransactions(state);
  const linkedAdmin = state.admins.find(admin => admin.publicId === adminPublicId);
  const won = predictions.filter(prediction => prediction.status === 'won');
  elements.profileName.textContent = name;
  elements.profileMeta.textContent = `${email} · Normal user`;
  elements.userProfileContent.classList.remove('hidden');
  elements.adminProfileContent.classList.add('hidden');
  elements.profileBalance.textContent = formatCoin(currentBalance(state));
  elements.profilePredictionCount.textContent = String(predictions.length);
  elements.profileWonCount.textContent = String(won.length);
  elements.profileEarnings.textContent = formatCoin(won.reduce((total, prediction) => total + prediction.payout, 0));
  elements.linkedAdminLabel.textContent = `Linked admin: ${linkedAdmin?.name ?? 'Unknown'} · ${adminPublicId}`;
  elements.profilePredictions.innerHTML = predictions.length
    ? predictions.map(prediction => `<article class="history-item"><span class="prediction-status ${prediction.status}">${escapeHtml(prediction.status)}</span><strong>${escapeHtml(prediction.label)} @ ${prediction.multiplier.toFixed(2)}×</strong><p>${escapeHtml(prediction.match)}</p><small>Stake ${formatCoin(prediction.stake)} · ${prediction.status === 'won' ? `Earned ${formatCoin(prediction.payout)}` : prediction.status === 'lost' ? 'No return' : `Potential ${formatCoin(prediction.potentialReturn)}`} · ${escapeHtml(formatPlacedTime(prediction.placedAt))}</small></article>`).join('')
    : '<div class="compact-empty">No predictions placed yet.</div>';
  elements.walletActivity.innerHTML = transactions.length
    ? transactions.map(transaction => `<article class="wallet-item"><div><strong>${escapeHtml(TRANSACTION_LABELS[transaction.kind])}</strong><small>${escapeHtml(transaction.note)} · ${escapeHtml(formatPlacedTime(transaction.createdAt))}</small></div><b class="${transaction.amount > 0 ? 'credit' : 'debit'}">${transaction.amount > 0 ? '+' : ''}${formatCoin(transaction.amount)}</b></article>`).join('')
    : '<div class="compact-empty">No wallet activity yet.</div>';
}

function renderAdminProfile(elements: AppElements, state: AppState, name: string, email: string, publicId: string): void {
  const admin = currentAdmin(state);
  const linkedUsers = admin ? usersForAdmin(state, admin) : [];
  elements.profileName.textContent = name;
  elements.profileMeta.textContent = `${email} · Admin account`;
  elements.userProfileContent.classList.add('hidden');
  elements.adminProfileContent.classList.remove('hidden');
  elements.adminProfileContent.innerHTML = `<img src="/scorex-coin.svg" alt="" /><p class="overline">Shareable admin ID</p><strong>${escapeHtml(publicId)}</strong><p>${linkedUsers.length} linked user${linkedUsers.length === 1 ? '' : 's'}. Open Admin Console to manage their wallets and top-up requests.</p>`;
}
