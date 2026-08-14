import {marketLabels} from '../../domain/virtual-market';
import type {OpenPrediction, PredictionSelection, SportEvent} from '../../domain/types';

export function toggleSelection(
  current: readonly PredictionSelection[],
  event: SportEvent,
  outcomeIndex: number
): PredictionSelection[] {
  const multiplier = event.multipliers[outcomeIndex];
  if (!multiplier || event.status === 'finished' || event.suspended) return [...current];
  const id = `${event.id}::${outcomeIndex}`;
  if (current.some(selection => selection.id === id)) {
    return current.filter(selection => selection.id !== id);
  }
  const labels = marketLabels(event);
  return [
    ...current.filter(selection => selection.eventId !== event.id),
    {
      id,
      eventId: event.id,
      match: `${event.home} v ${event.away}`,
      label: labels[outcomeIndex] || '',
      market: 'ScoreX match prediction',
      multiplier
    }
  ];
}

export function combinedMultiplier(selections: readonly PredictionSelection[]): number {
  return selections.reduce((total, selection) => total * selection.multiplier, 1);
}

export function potentialReturn(selections: readonly PredictionSelection[], stake: number): number {
  return selections.length ? stake * combinedMultiplier(selections) : 0;
}

export function createOpenPrediction(
  selections: readonly PredictionSelection[],
  stake: number
): OpenPrediction {
  const first = selections[0];
  if (!first) throw new Error('At least one selection is required');
  const multiplier = combinedMultiplier(selections);
  return {
    ...first,
    label: selections.length > 1 ? `${selections.length}-fold accumulator` : first.label,
    multiplier,
    stake,
    potentialReturn: stake * multiplier,
    placedAt: new Date().toISOString()
  };
}
