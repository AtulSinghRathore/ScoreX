import {describe, expect, it} from 'vitest';
import {createVirtualMultipliers} from '../src/domain/virtual-market';

describe('virtual market multipliers', () => {
  it('is deterministic for a given event', () => {
    expect(createVirtualMultipliers('Football', 'match-1'))
      .toEqual(createVirtualMultipliers('Football', 'match-1'));
  });

  it('uses three outcomes for draw-capable sports', () => {
    expect(createVirtualMultipliers('Football', 'match-1')[1]).toBeGreaterThan(0);
    expect(createVirtualMultipliers('Cricket', 'match-1')[1]).toBeGreaterThan(0);
  });

  it('uses two outcomes for tennis and basketball', () => {
    expect(createVirtualMultipliers('Tennis', 'match-1')[1]).toBe(0);
    expect(createVirtualMultipliers('Basketball', 'match-1')[1]).toBe(0);
  });
});
