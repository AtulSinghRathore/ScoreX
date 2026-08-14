export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[character] ?? character);
}

export function safeHttpsUrl(value: unknown, baseUrl = 'https://sportscore.com'): string {
  try {
    const url = new URL(String(value ?? ''), baseUrl);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}
