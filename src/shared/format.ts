export function formatCoin(value: number): string {
  return `${Math.round(value).toLocaleString()} SXC`;
}

export function formatStartTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time TBC';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatRelativeTime(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return 'Waiting for first update';
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Updated just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  return `Updated ${Math.floor(minutes / 60)}h ago`;
}
