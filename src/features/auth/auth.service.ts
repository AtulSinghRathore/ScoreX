import type {AccountKind, AdminUser, AuthSession, ClientUser} from '../../domain/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function authenticate(
  kind: AccountKind,
  email: string,
  password: string,
  users: readonly ClientUser[],
  admins: readonly AdminUser[]
): Promise<AuthSession | null> {
  const passwordHash = await hashPassword(password);
  const normalizedEmail = email.trim().toLowerCase();
  if (kind === 'admin') {
    const admin = admins.find(item => item.email.toLowerCase() === normalizedEmail && item.active && item.passwordHash === passwordHash);
    return admin ? {kind, accountId: String(admin.id)} : null;
  }
  const user = users.find(item => item.email.toLowerCase() === normalizedEmail && item.active && item.passwordHash === passwordHash);
  return user ? {kind, accountId: user.id} : null;
}

export function registrationValidationError(
  name: string,
  email: string,
  password: string,
  adminPublicId: string,
  users: readonly ClientUser[],
  admins: readonly AdminUser[]
): string {
  if (name.trim().length < 2) return 'Enter a name with at least 2 characters.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address.';
  if (password.length < 8) return 'Password must contain at least 8 characters.';
  if (users.some(user => user.email.toLowerCase() === email.trim().toLowerCase())) return 'A user with this email already exists.';
  const linkedAdmin = admins.find(admin => admin.publicId === normalizeAdminPublicId(adminPublicId) && admin.active);
  if (!linkedAdmin) return 'Admin ID was not found. Ask your admin for their shareable ID.';
  return '';
}

export async function createClientUser(
  name: string,
  email: string,
  password: string,
  adminPublicId: string
): Promise<ClientUser> {
  return {
    id: createId('user'),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: await hashPassword(password),
    adminPublicId: normalizeAdminPublicId(adminPublicId),
    active: true,
    createdAt: new Date().toISOString()
  };
}

export function createAdminPublicId(name: string, id: number): string {
  const stem = name.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase() || 'ADMIN';
  return `SXA-${stem}-${String(id).slice(-4).padStart(4, '0')}`;
}

export function normalizeAdminPublicId(value: string): string {
  return value.trim().toUpperCase();
}

export function createId(prefix: string): string {
  const random = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}
