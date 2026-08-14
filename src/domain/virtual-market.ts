import type {Sport, SportEvent} from './types';
import {hashString} from '../shared/hash';

export function createVirtualMultipliers(sport: Sport, key: string): readonly [number, number, number] {
  const seed = hashString(`${sport}:${key}`);
  const home = Number((1.55 + (seed % 135) / 100).toFixed(2));
  const away = Number((1.55 + ((seed >>> 8) % 135) / 100).toFixed(2));
  const draw = sport === 'Football' || sport === 'Cricket'
    ? Number((3.10 + ((seed >>> 16) % 220) / 100).toFixed(2))
    : 0;
  return [home, draw, away];
}

export function marketLabels(event: SportEvent): readonly [string, string, string] {
  if (event.sport === 'Football') return [event.home, 'Draw', event.away];
  if (event.sport === 'Cricket') return [event.home, 'Tie / draw', event.away];
  return [event.home, '', event.away];
}

export function columnLabels(sport: Sport): readonly [string, string, string] {
  return sport === 'Football' || sport === 'Cricket' ? ['1', 'X', '2'] : ['1', '—', '2'];
}
