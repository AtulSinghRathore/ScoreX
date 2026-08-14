import {describe, expect, it} from 'vitest';
import {authenticate, createAdminPublicId, createClientUser, hashPassword, registrationValidationError} from '../src/features/auth/auth.service';
import type {AdminUser, ClientUser} from '../src/domain/types';

const PASSWORD = 'ScoreX@2026';

async function fixtures(): Promise<{admins: AdminUser[]; users: ClientUser[]}> {
  const passwordHash = await hashPassword(PASSWORD);
  const admins: AdminUser[] = [{
    id: 1,
    publicId: 'SXA-ATUL-01',
    name: 'Atul Singh',
    email: 'admin@scorex.demo',
    passwordHash,
    upiId: 'scorex.atul@upi',
    role: 'SUPER_ADMIN',
    active: true,
    lastLogin: 'Now'
  }];
  const users: ClientUser[] = [{
    id: 'user-1',
    name: 'Demo User',
    email: 'demo@scorex.demo',
    passwordHash,
    adminPublicId: 'SXA-ATUL-01',
    active: true,
    createdAt: '2026-08-15T00:00:00.000Z'
  }];
  return {admins, users};
}

describe('authentication service', () => {
  it('authenticates user and admin accounts independently', async () => {
    const {admins, users} = await fixtures();
    await expect(authenticate('user', 'DEMO@scorex.demo', PASSWORD, users, admins)).resolves.toEqual({kind: 'user', accountId: 'user-1'});
    await expect(authenticate('admin', 'admin@scorex.demo', PASSWORD, users, admins)).resolves.toEqual({kind: 'admin', accountId: '1'});
    await expect(authenticate('admin', 'admin@scorex.demo', 'wrong-password', users, admins)).resolves.toBeNull();
  });

  it('requires an active shareable admin ID for registration', async () => {
    const {admins, users} = await fixtures();
    expect(registrationValidationError('New User', 'new@scorex.demo', PASSWORD, 'missing', users, admins)).toContain('Admin ID');
    expect(registrationValidationError('New User', 'new@scorex.demo', PASSWORD, ' sxa-atul-01 ', users, admins)).toBe('');
    expect(registrationValidationError('New User', 'DEMO@scorex.demo', PASSWORD, 'SXA-ATUL-01', users, admins)).toContain('already exists');
  });

  it('creates a normalized user link and a non-login admin reference ID', async () => {
    const user = await createClientUser(' New User ', 'NEW@ScoreX.demo', PASSWORD, ' sxa-atul-01 ');
    expect(user.email).toBe('new@scorex.demo');
    expect(user.adminPublicId).toBe('SXA-ATUL-01');
    expect(user.passwordHash).toBe(await hashPassword(PASSWORD));
    expect(createAdminPublicId('Priya Sharma', 28)).toBe('SXA-PRIYAS-0028');
  });
});
