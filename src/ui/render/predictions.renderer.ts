import {combinedMultiplier, potentialReturn, stakeValidationMessage} from '../../features/predictions/prediction.service';
import {currentBalance, currentPredictions, currentUser} from '../../domain/account-selectors';
import {formatCoin, formatPlacedTime} from '../../shared/format';
import {escapeHtml} from '../../shared/security';
import type {AppState} from '../../domain/types';
import type {AppElements} from '../elements';

export function renderPredictionSlip(elements: AppElements, state: AppState): void {
  const stake = Number(elements.stake.value || 0);
  const user = currentUser(state);
  const balance = currentBalance(state);
  elements.slipCount.textContent = String(state.selections.length);
  elements.potentialReturn.textContent = formatCoin(potentialReturn(state.selections, stake));
  elements.combinedMultiplier.textContent = state.selections.length ? `${combinedMultiplier(state.selections).toFixed(2)}×` : '—';
  const validationMessage = user
    ? stakeValidationMessage(state.selections, stake, balance)
    : 'Log in as a normal user to create an SXC prediction.';
  elements.stakeHelp.textContent = validationMessage;
  elements.stakeHelp.classList.toggle('error', Boolean(state.selections.length && validationMessage !== 'Ready to place this virtual prediction.'));
  elements.emptySlip.classList.toggle('hidden', state.selections.length > 0);
  elements.slipItems.innerHTML = state.selections.map(selection => `<div class="slip-item">
    <button class="remove" data-action="remove-pick" data-selection-id="${escapeHtml(selection.id)}" aria-label="Remove ${escapeHtml(selection.label)} from prediction slip">×</button>
    <small>${escapeHtml(selection.market)}</small><strong>${escapeHtml(selection.label)}</strong>
    <p>${escapeHtml(selection.match)}</p><b>${selection.multiplier.toFixed(2)}×</b>
  </div>`).join('');
  elements.stake.disabled = !user;
  document.querySelectorAll<HTMLButtonElement>('[data-stake-add], [data-stake-max]').forEach(button => button.disabled = !user);
  elements.placePrediction.disabled = Boolean(user) && validationMessage !== 'Ready to place this virtual prediction.';
  elements.placePrediction.textContent = user ? 'Place SXC prediction' : 'Log in to predict';
}

export function renderOpenPredictions(elements: AppElements, state: AppState): void {
  const user = currentUser(state);
  const predictions = currentPredictions(state).filter(prediction => prediction.status === 'open');
  elements.openCount.textContent = String(predictions.length);
  elements.openPredictions.innerHTML = !user
    ? '<div class="empty"><div>↪</div><h3>Login required</h3><p>Sign in as a normal user to view prediction history.</p></div>'
    : predictions.length
      ? predictions.map(prediction => `<article class="open-bet"><span>OPEN · SXC</span><strong>${escapeHtml(prediction.label)} @ ${prediction.multiplier.toFixed(2)}×</strong><p>${escapeHtml(prediction.match)}</p><small>Stake ${formatCoin(prediction.stake)} · Potential ${formatCoin(prediction.potentialReturn)}</small><time datetime="${escapeHtml(prediction.placedAt)}">Placed ${escapeHtml(formatPlacedTime(prediction.placedAt))}</time></article>`).join('')
      : '<div class="empty"><div>⌁</div><h3>No open predictions</h3><p>Accepted SXC predictions appear here.</p></div>';
}
