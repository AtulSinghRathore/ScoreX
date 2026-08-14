import {marketHeading, visibleEvents} from '../../domain/selectors';
import {columnLabels} from '../../domain/virtual-market';
import {formatStartTime} from '../../shared/format';
import {escapeHtml} from '../../shared/security';
import {SUPPORTED_SPORTS, type AppState, type Sport, type SportEvent} from '../../domain/types';
import type {AppElements} from '../elements';

function teamRow(name: string, logo: string, score: string): string {
  const logoMarkup = logo
    ? `<img class="team-logo" src="${escapeHtml(logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" />`
    : '<span class="team-logo fallback">•</span>';
  return `<div><span class="team-name">${logoMarkup}<strong>${escapeHtml(name)}</strong></span><b>${escapeHtml(score)}</b></div>`;
}

function eventTime(event: SportEvent): string {
  return event.status === 'live' ? event.statusText : formatStartTime(event.startTime);
}

function eventCard(event: SportEvent, selectedIds: ReadonlySet<string>): string {
  const statusLabel = event.status === 'live'
    ? '<b class="live-label">● LIVE</b>'
    : event.status === 'finished'
      ? '<b class="live-label finished-label">FINAL</b>'
      : '';
  const labels = columnLabels(event.sport);
  const priceButtons = event.multipliers.map((multiplier, outcomeIndex) => {
    if (!multiplier) return '<button class="price" disabled><small>—</small>—</button>';
    const pickId = `${event.id}::${outcomeIndex}`;
    const disabled = event.suspended || event.status === 'finished';
    return `<button class="price ${selectedIds.has(pickId) ? 'selected' : ''}" ${disabled ? 'disabled' : ''} data-action="select-pick" data-event-id="${escapeHtml(event.id)}" data-outcome-index="${outcomeIndex}"><small>${labels[outcomeIndex]}</small>${disabled ? 'Closed' : `${multiplier.toFixed(2)}×`}</button>`;
  }).join('');
  const details = event.sourceUrl
    ? `<a class="market-count" href="${escapeHtml(event.sourceUrl)}" target="_blank" rel="noopener"><span>Match</span><small>details ↗</small></a>`
    : `<span class="market-count"><span>${event.marketCount}</span><small>SXC picks</small></span>`;
  return `<article class="event">
    <div>
      <div class="league"><span>${escapeHtml(event.sport)}</span>${escapeHtml(event.league)}${statusLabel}</div>
      <div class="teams">${teamRow(event.home, event.homeLogo, event.homeScore)}${teamRow(event.away, event.awayLogo, event.awayScore)}</div>
      <div class="meta">${escapeHtml(eventTime(event))} · ${event.status === 'live' ? 'Score supplied by SportScore' : escapeHtml(event.statusText)}</div>
    </div>
    ${priceButtons}${details}
  </article>`;
}

export function renderEvents(elements: AppElements, state: AppState): void {
  elements.marketTitle.textContent = marketHeading(state);
  if (state.feed.loading && !state.events.length) {
    elements.eventList.innerHTML = '<div class="feed-empty"><span class="loading-ring"></span><h3>Connecting to live sports</h3><p>Loading real match data from SportScore.</p></div>';
    return;
  }
  const events = visibleEvents(state);
  if (!events.length) {
    const message = state.feed.error && !state.events.length
      ? 'The live-score provider could not be reached. Try refreshing shortly.'
      : 'There are no matching live events in the current feed.';
    elements.eventList.innerHTML = `<div class="feed-empty"><div>⌁</div><h3>No events to show</h3><p>${escapeHtml(message)}</p><button data-action="retry-feed">Try again</button></div>`;
    return;
  }
  const selectedIds = new Set(state.selections.map(selection => selection.id));
  elements.eventList.innerHTML = events.map(event => eventCard(event, selectedIds)).join('');
}

export function renderSportFilters(state: AppState): void {
  document.querySelectorAll<HTMLElement>('[data-sport-count]').forEach(node => {
    const sport = node.dataset.sportCount as Sport | 'All' | undefined;
    if (!sport) return;
    node.textContent = String(sport === 'All'
      ? state.events.filter(event => event.status !== 'finished').length
      : state.events.filter(event => event.sport === sport && event.status !== 'finished').length);
  });
  document.querySelectorAll<HTMLButtonElement>('.sport-filter').forEach(button => {
    button.classList.toggle('selected', button.dataset.sport === state.selectedSport);
  });
}

export function isSupportedSport(value: string | undefined): value is Sport {
  return SUPPORTED_SPORTS.includes(value as Sport);
}
