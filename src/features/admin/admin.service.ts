import type {AdminRole, AdminUser, AuditEntry, SportEvent} from '../../domain/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Administrator',
  MARKET_MANAGER: 'Market manager',
  SUPPORT_AGENT: 'Support agent',
  VIEWER: 'Viewer'
};

export function adminValidationError(
  name: string,
  email: string,
  role: AdminRole,
  admins: readonly AdminUser[]
): string {
  if (name.trim().length < 2) return 'Enter a name with at least 2 characters.';
  if (name.trim().length > 60) return 'Name must be 60 characters or fewer.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address.';
  if (admins.some(admin => admin.email.toLowerCase() === email.trim().toLowerCase())) {
    return 'An admin with this email already exists.';
  }
  if (!Object.hasOwn(ADMIN_ROLE_LABELS, role)) return 'Choose a valid admin role.';
  return '';
}

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

export function suspendedEventIds(events: readonly SportEvent[]): string[] {
  return events.filter(event => event.suspended && event.status !== 'finished').map(event => event.id);
}

export function applyMarketSuspensions(events: readonly SportEvent[], ids: readonly string[]): SportEvent[] {
  const suspended = new Set(ids);
  return events.map(event => event.status === 'finished'
    ? {...event, suspended: false}
    : {...event, suspended: suspended.has(event.id)}
  );
}

export function auditEntry(action: string): AuditEntry {
  return {action, time: 'Just now'};
}
