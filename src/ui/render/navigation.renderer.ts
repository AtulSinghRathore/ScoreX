import type {AppState} from '../../domain/types';
import type {AppElements} from '../elements';

export function renderNavigation(elements: AppElements, state: AppState): void {
  const adminView = state.viewMode === 'admin';
  elements.sportsView.classList.toggle('hidden', adminView);
  elements.adminView.classList.toggle('hidden', !adminView);
  elements.liveToggle.checked = state.liveOnly;
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => {
    button.classList.toggle('active', button.dataset.view === state.viewMode);
  });
}
