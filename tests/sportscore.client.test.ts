import {afterEach, describe, expect, it, vi} from 'vitest';
import {SportScoreClient} from '../src/services/sportscore.client';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SportScore client', () => {
  it('keeps healthy sport feeds when one provider request fails', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      const sport = url.searchParams.get('sport');
      if (sport === 'basketball') return new Response(null, {status: 503});

      return Response.json({
        updated: '2026-08-15T12:00:00Z',
        matches: [{
          home: `${sport} home`,
          away: `${sport} away`,
          status: 'live',
          url: `/${sport}/match/1`
        }]
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await new SportScoreClient().fetchAll(new AbortController().signal);

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(result.failedSports).toEqual(['Basketball']);
    expect(result.successfulSports).toEqual(['Cricket', 'Football', 'Tennis']);
    expect(result.events).toHaveLength(3);
    expect(result.updatedAt?.toISOString()).toBe('2026-08-15T12:00:00.000Z');
  });
});
