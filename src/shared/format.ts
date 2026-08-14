export function formatCoin(value: number): string {
  return `${Math.round(value).toLocaleString()} SXC`;
}

export function formatStartTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time TBC';
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(date);
}

export function formatCompactDate(value: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(timeZone ? {timeZone} : {})
  }).format(value);
}

export function formatClockTime(value: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    ...(timeZone ? {timeZone} : {})
  }).format(value);
}

export function localDateKey(value: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(timeZone ? {timeZone} : {})
  }).formatToParts(value);
  const getPart = (type: 'year' | 'month' | 'day') => parts.find(part => part.type === type)?.value ?? '';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}

export function teamInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  const letters = words.length === 1
    ? words[0]?.slice(0, 2)
    : `${words[0]?.[0] ?? ''}${words.at(-1)?.[0] ?? ''}`;
  return (letters || '?').toUpperCase();
}

export function formatPlacedTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
  }).format(date);
}

export function localTimeZoneName(now = new Date()): string {
  return new Intl.DateTimeFormat('en-IN', {timeZoneName: 'short'})
    .formatToParts(now)
    .find(part => part.type === 'timeZoneName')?.value || 'local time';
}

export function formatRelativeTime(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return 'Waiting for first update';
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Updated just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  return `Updated ${Math.floor(minutes / 60)}h ago`;
}
