import {describe, expect, it} from 'vitest';
import {adminValidationError, applyMarketSuspensions, suspendedEventIds} from '../src/features/admin/admin.service';
import type {AdminUser, SportEvent} from '../src/domain/types';

const event: SportEvent = {
  id: 'match-1', sport: 'Football', league: 'League', status: 'upcoming', statusText: 'Scheduled',
  startTime: '2026-08-16T10:00:00Z', home: 'A', away: 'B', homeLogo: '', awayLogo: '',
  homeScore: '—', awayScore: '—', marketCount: 3, multipliers: [2, 3, 4], suspended: false, sourceUrl: ''
};
const admins: AdminUser[] = [{
  id: 1,
  publicId: 'SXA-ATUL-01',
  name: 'Atul Singh',
  email: 'admin@scorex.demo',
  passwordHash: 'demo-hash',
  upiId: 'scorex.atul@upi',
  role: 'SUPER_ADMIN',
  active: true,
  lastLogin: 'Now'
}];

describe('admin service', () => {
  it('validates email and rejects duplicate accounts', () => {
    expect(adminValidationError('A', 'wrong', 'ADMIN', admins)).toContain('name');
    expect(adminValidationError('New Admin', 'wrong', 'ADMIN', admins)).toContain('valid email');
    expect(adminValidationError('New Admin', 'ADMIN@scorex.demo', 'ADMIN', admins)).toContain('already exists');
    expect(adminValidationError('New Admin', 'new@scorex.demo', 'ADMIN', admins)).toBe('');
  });

  it('reapplies persisted market suspensions after a feed refresh', () => {
    const applied = applyMarketSuspensions([event], ['match-1']);
    expect(applied[0]?.suspended).toBe(true);
    expect(suspendedEventIds(applied)).toEqual(['match-1']);
  });
});
