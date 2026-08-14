import {escapeHtml} from '../../shared/security';
import {ADMIN_ROLE_LABELS} from '../../features/admin/admin.service';
import type {AppState} from '../../domain/types';
import type {AppElements} from '../elements';

export function renderAdmin(elements: AppElements, state: AppState): void {
  elements.adminCount.textContent = String(state.admins.length);
  elements.liveCount.textContent = String(state.events.filter(event => event.status === 'live').length);
  elements.activeMarketCount.textContent = String(state.events
    .filter(event => event.status !== 'finished' && !event.suspended)
    .reduce((total, event) => total + event.marketCount, 0));
  elements.suspendedCount.textContent = String(state.events.filter(event => event.suspended && event.status !== 'finished').length);
  elements.adminList.innerHTML = state.admins.map(admin => `<div class="admin-row">
    <div class="admin-avatar">${escapeHtml(admin.name.split(' ').map(part => part[0]).join('').slice(0, 2))}</div>
    <div><strong>${escapeHtml(admin.name)}</strong><small>${escapeHtml(admin.email)} · Last login ${escapeHtml(admin.lastLogin)}</small></div>
    <span class="badge ${admin.active ? '' : 'off'}">${admin.active ? escapeHtml(ADMIN_ROLE_LABELS[admin.role]) : 'Deactivated'}</span>
    ${admin.role !== 'SUPER_ADMIN' ? `<button class="deactivate" data-action="toggle-admin" data-admin-id="${admin.id}">${admin.active ? 'Deactivate' : 'Reactivate'}</button>` : ''}
  </div>`).join('');
  elements.auditLog.innerHTML = state.audit.length
    ? state.audit.slice(0, 8).map(entry => `<div class="audit-item">${escapeHtml(entry.action)}<small>${escapeHtml(entry.time)}</small></div>`).join('')
    : '<div class="feed-empty compact"><p>No admin activity yet.</p></div>';
  const controllableEvents = state.events.filter(event => event.status !== 'finished');
  elements.marketControls.innerHTML = controllableEvents.length
    ? controllableEvents.slice(0, 20).map(event => `<div class="market-row"><div><strong>${escapeHtml(event.home)} v ${escapeHtml(event.away)}</strong><small>${escapeHtml(event.sport)} · ${escapeHtml(event.league)} · ${event.status === 'live' ? 'Live' : 'Upcoming'}</small></div><span class="badge ${event.suspended ? 'off' : ''}">${event.suspended ? 'SUSPENDED' : 'ACTIVE'}</span><button class="suspend" data-action="toggle-market" data-event-id="${escapeHtml(event.id)}">${event.suspended ? 'Resume' : 'Suspend'}</button></div>`).join('')
    : '<div class="feed-empty compact"><p>No live events are available for market control.</p></div>';
}
