import type {AdminRole, AdminUser, AuditEntry, SportEvent} from '../../domain/types';

export function createAdmin(name: string, email: string, role: AdminRole): AdminUser {
  return {
    id: Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role,
    active: true,
    lastLogin: 'Never'
  };
}

export function toggleAdmin(admins: readonly AdminUser[], id: number): AdminUser[] {
  return admins.map(admin => admin.id === id && admin.role !== 'SUPER_ADMIN'
    ? {...admin, active: !admin.active}
    : admin
  );
}

export function toggleMarket(events: readonly SportEvent[], eventId: string): SportEvent[] {
  return events.map(event => event.id === eventId && event.status !== 'finished'
    ? {...event, suspended: !event.suspended}
    : event
  );
}

export function auditEntry(action: string): AuditEntry {
  return {action, time: 'Just now'};
}
