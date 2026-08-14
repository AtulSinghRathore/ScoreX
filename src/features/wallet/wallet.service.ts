import * as QRCode from 'qrcode';
import {APP_CONFIG} from '../../config/app';
import {createId} from '../auth/auth.service';
import type {AdminUser, ClientUser, TopUpRequest, WalletAccount, WalletTransaction, WalletTransactionKind} from '../../domain/types';

export interface WalletChange {
  wallets: WalletAccount[];
  transaction: WalletTransaction;
}

export function applyWalletChange(
  wallets: readonly WalletAccount[],
  userId: string,
  amount: number,
  adminPublicId: string,
  kind: WalletTransactionKind,
  note: string
): WalletChange | null {
  if (!Number.isFinite(amount) || amount === 0) return null;
  const current = wallets.find(wallet => wallet.userId === userId)?.balance ?? 0;
  const next = Math.floor(current + amount);
  if (next < 0) return null;
  const transaction: WalletTransaction = {
    id: createId('txn'),
    userId,
    adminPublicId,
    kind,
    amount: Math.floor(amount),
    balanceAfter: next,
    note: note.trim() || 'SXC wallet adjustment',
    createdAt: new Date().toISOString()
  };
  const hasWallet = wallets.some(wallet => wallet.userId === userId);
  return {
    wallets: hasWallet
      ? wallets.map(wallet => wallet.userId === userId ? {...wallet, balance: next} : wallet)
      : [...wallets, {userId, balance: next}],
    transaction
  };
}

export function createTopUpRequest(user: ClientUser, admin: AdminUser, sxcAmount: number): TopUpRequest | null {
  const normalized = Math.floor(sxcAmount);
  if (!Number.isFinite(normalized) || normalized < 500 || normalized % 100 !== 0) return null;
  const now = new Date().toISOString();
  return {
    id: createId('topup'),
    userId: user.id,
    adminPublicId: admin.publicId,
    sxcAmount: normalized,
    paymentAmount: Number((normalized / APP_CONFIG.sxcPerRupee).toFixed(2)),
    upiId: admin.upiId,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  };
}

export function topUpQrPayload(request: TopUpRequest, admin: AdminUser): string {
  const params = new URLSearchParams({
    pa: request.upiId,
    pn: `${admin.name} · ScoreX demo`,
    am: request.paymentAmount.toFixed(2),
    cu: 'INR',
    tn: `ScoreX ${request.sxcAmount} SXC · ${request.id}`
  });
  return `upi://pay?${params.toString()}`;
}

export function createTopUpQrDataUrl(request: TopUpRequest, admin: AdminUser): Promise<string> {
  return QRCode.toDataURL(topUpQrPayload(request, admin), {
    width: 260,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {dark: '#063e2d', light: '#ffffff'}
  });
}

export function resolveTopUpRequest(
  requests: readonly TopUpRequest[],
  requestId: string,
  status: 'credited' | 'declined'
): TopUpRequest[] {
  const updatedAt = new Date().toISOString();
  return requests.map(request => request.id === requestId && request.status === 'pending'
    ? {...request, status, updatedAt}
    : request
  );
}
