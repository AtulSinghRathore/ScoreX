import {potentialReturn} from '../../features/predictions/prediction.service';
import {formatCoin} from '../../shared/format';
import {escapeHtml} from '../../shared/security';
import type {AppState} from '../../domain/types';
import type {AppElements} from '../elements';

export function renderPredictionSlip(elements: AppElements, state: AppState): void {
  const stake = Number(elements.stake.value || 0);
  elements.balance.textContent = formatCoin(state.balance);
  elements.slipCount.textContent = String(state.selections.length);
  elements.potentialReturn.textContent = formatCoin(potentialReturn(state.selections, stake));
  elements.emptySlip.classList.toggle('hidden', state.selections.length > 0);
  elements.slipItems.innerHTML = state.selections.map(selection => `<div class="slip-item">
    <button class="remove" data-action="remove-pick" data-selection-id="${escapeHtml(selection.id)}">×</button>
    <small>${escapeHtml(selection.market)}</small><strong>${escapeHtml(selection.label)}</strong>
    <p>${escapeHtml(selection.match)}</p><b>${selection.multiplier.toFixed(2)}×</b>
  </div>`).join('');
  elements.placePrediction.disabled = !state.selections.length || stake <= 0 || stake > state.balance;
}

export function renderOpenPredictions(elements: AppElements, state: AppState): void {
  elements.openCount.textContent = String(state.openPredictions.length);
  elements.openPredictions.innerHTML = state.openPredictions.length
    ? state.openPredictions.map(prediction => `<article class="open-bet"><span>OPEN · VIRTUAL</span><strong>${escapeHtml(prediction.label)} @ ${prediction.multiplier.toFixed(2)}×</strong><p>${escapeHtml(prediction.match)}</p><small>Stake ${formatCoin(prediction.stake)} · Potential ${formatCoin(prediction.potentialReturn)}</small></article>`).join('')
    : '<div class="empty"><div>⌁</div><h3>No open predictions</h3><p>Accepted SXC predictions appear here.</p></div>';
}
