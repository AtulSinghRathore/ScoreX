import {describe, expect, it} from 'vitest';
import {applyWalletChange, createTopUpRequest, resolveTopUpRequest, topUpQrPayload} from '../src/features/wallet/wallet.service';
import type {AdminUser, ClientUser, WalletAccount} from '../src/domain/types';

const admin: AdminUser = {
  id: 1,
  publicId: 'SXA-ATUL-01',
  name: 'Atul Singh',
  email: 'admin@scorex.demo',
  passwordHash: 'hash',
  upiId: 'scorex.atul@upi',
  role: 'SUPER_ADMIN',
  active: true,
  lastLogin: 'Now'
};

const user: ClientUser = {
  id: 'user-1',
  name: 'Demo User',
  email: 'demo@scorex.demo',
  passwordHash: 'hash',
  adminPublicId: admin.publicId,
  active: true,
  createdAt: '2026-08-15T00:00:00.000Z'
};

describe('wallet service', () => {
  it('records credits and debits without permitting a negative balance', () => {
    const wallets: WalletAccount[] = [{userId: user.id, balance: 1_000}];
    const credit = applyWalletChange(wallets, user.id, 500, admin.publicId, 'admin_credit', 'Payment confirmed');
    expect(credit?.wallets[0]?.balance).toBe(1_500);
    expect(credit?.transaction.balanceAfter).toBe(1_500);
    expect(applyWalletChange(wallets, user.id, -1_001, admin.publicId, 'admin_debit', 'Correction')).toBeNull();
  });

  it('creates a fixed-amount request for the linked admin', () => {
    const request = createTopUpRequest(user, admin, 1_000);
    expect(request).not.toBeNull();
    expect(request?.paymentAmount).toBe(100);
    expect(request?.status).toBe('pending');
    const payload = topUpQrPayload(request!, admin);
    expect(payload).toContain('pa=scorex.atul%40upi');
    expect(payload).toContain('am=100.00');
    expect(payload).toContain('cu=INR');
  });

  it('rejects malformed amounts and resolves a pending request once', () => {
    expect(createTopUpRequest(user, admin, 550)).toBeNull();
    const request = createTopUpRequest(user, admin, 1_000)!;
    const credited = resolveTopUpRequest([request], request.id, 'credited');
    expect(credited[0]?.status).toBe('credited');
    expect(resolveTopUpRequest(credited, request.id, 'declined')[0]?.status).toBe('credited');
  });
});
