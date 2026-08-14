import {escapeHtml} from '../../shared/security';
import {ADMIN_ROLE_LABELS} from '../../features/admin/admin.service';
import {currentAdmin, usersForAdmin} from '../../domain/account-selectors';
import {formatCoin, formatPlacedTime} from '../../shared/format';
import type {AppState} from '../../domain/types';
import type {AppElements} from '../elements';

export function renderAdmin(elements: AppElements, state: AppState): void {
  const signedInAdmin = currentAdmin(state);
  const linkedUsers = signedInAdmin ? usersForAdmin(state, signedInAdmin) : [];
  const linkedUserIds = new Set(linkedUsers.map(user => user.id));
  const requests = state.topUpRequests.filter(request => linkedUserIds.has(request.userId));
  elements.linkedUserCount.textContent = String(linkedUsers.length);
  elements.pendingTopUpCount.textContent = String(requests.filter(request => request.status === 'pending').length);
  elements.adminPublicId.textContent = signedInAdmin?.publicId ?? 'Login required';
  elements.copyAdminId.disabled = !signedInAdmin;
  elements.liveCount.textContent = String(state.events.filter(event => event.status === 'live').length);
  elements.suspendedCount.textContent = String(state.events.filter(event => event.suspended && event.status !== 'finished').length);
  elements.adminList.innerHTML = state.admins.map(admin => `<div class="admin-row">
    <div class="admin-avatar">${escapeHtml(admin.name.split(' ').map(part => part[0]).join('').slice(0, 2))}</div>
    <div><strong>${escapeHtml(admin.name)}</strong><small>${escapeHtml(admin.email)} · ${escapeHtml(admin.publicId)} · Last login ${escapeHtml(admin.lastLogin)}</small></div>
    <span class="badge ${admin.active ? '' : 'off'}">${admin.active ? escapeHtml(ADMIN_ROLE_LABELS[admin.role]) : 'Deactivated'}</span>
    ${admin.role !== 'SUPER_ADMIN' ? `<button class="deactivate" data-action="toggle-admin" data-admin-id="${admin.id}">${admin.active ? 'Deactivate' : 'Reactivate'}</button>` : ''}
  </div>`).join('');
  const newAdminButton = document.getElementById('newAdminButton');
  newAdminButton?.classList.toggle('hidden', signedInAdmin?.role !== 'SUPER_ADMIN');
  elements.linkedUserList.innerHTML = linkedUsers.length
    ? linkedUsers.map(user => {
      const balance = state.wallets.find(wallet => wallet.userId === user.id)?.balance ?? 0;
      const pending = requests.filter(request => request.userId === user.id && request.status === 'pending').length;
      return `<div class="client-row"><div class="admin-avatar">${escapeHtml(user.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase())}</div><div><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.email)} · ${pending} pending request${pending === 1 ? '' : 's'}</small></div><b>${formatCoin(balance)}</b><button data-action="adjust-wallet" data-user-id="${escapeHtml(user.id)}">Adjust</button></div>`;
    }).join('')
    : '<div class="feed-empty compact"><p>No users are linked to this admin ID yet.</p></div>';
  elements.topUpRequestList.innerHTML = requests.length
    ? requests.slice().reverse().map(request => {
      const user = state.users.find(item => item.id === request.userId);
      return `<div class="topup-row"><div><strong>${escapeHtml(user?.name ?? 'Unknown user')} · ${formatCoin(request.sxcAmount)}</strong><small>₹${request.paymentAmount.toFixed(2)} · ${escapeHtml(request.upiId)} · ${escapeHtml(formatPlacedTime(request.createdAt))}</small></div><span class="badge ${request.status === 'pending' ? 'pending' : request.status === 'declined' ? 'off' : ''}">${escapeHtml(request.status)}</span>${request.status === 'pending' ? `<button data-action="credit-topup" data-request-id="${escapeHtml(request.id)}">Credit</button><button class="deactivate" data-action="decline-topup" data-request-id="${escapeHtml(request.id)}">Decline</button>` : ''}</div>`;
    }).join('')
    : '<div class="feed-empty compact"><p>No top-up requests for linked users.</p></div>';
  elements.auditLog.innerHTML = state.audit.length
    ? state.audit.slice(0, 8).map(entry => `<div class="audit-item">${escapeHtml(entry.action)}<small>${escapeHtml(entry.time)}</small></div>`).join('')
    : '<div class="feed-empty compact"><p>No admin activity yet.</p></div>';
  const controllableEvents = state.events.filter(event => event.status !== 'finished');
  elements.marketControls.innerHTML = controllableEvents.length
    ? controllableEvents.slice(0, 20).map(event => `<div class="market-row"><div><strong>${escapeHtml(event.home)} v ${escapeHtml(event.away)}</strong><small>${escapeHtml(event.sport)} · ${escapeHtml(event.league)} · ${event.status === 'live' ? 'Live' : 'Upcoming'}</small></div><span class="badge ${event.suspended ? 'off' : ''}">${event.suspended ? 'SUSPENDED' : 'ACTIVE'}</span><button class="suspend" data-action="toggle-market" data-event-id="${escapeHtml(event.id)}">${event.suspended ? 'Resume' : 'Suspend'}</button></div>`).join('')
    : '<div class="feed-empty compact"><p>No live events are available for market control.</p></div>';
}
