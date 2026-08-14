import {describe, expect, it} from 'vitest';
import {refreshCooldownRemainingMs} from '../src/features/live/feed-policy';

describe('feed refresh policy', () => {
  it('protects the provider during the manual refresh cooldown', () => {
    const lastRequest = new Date('2026-08-15T10:00:00Z');
    expect(refreshCooldownRemainingMs(lastRequest, 60_000, new Date('2026-08-15T10:00:45Z'))).toBe(15_000);
    expect(refreshCooldownRemainingMs(lastRequest, 60_000, new Date('2026-08-15T10:01:01Z'))).toBe(0);
  });
});
