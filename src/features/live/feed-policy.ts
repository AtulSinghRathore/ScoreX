export function refreshCooldownRemainingMs(
  lastRequestAt: Date | null,
  cooldownMs: number,
  now = new Date()
): number {
  if (!lastRequestAt || Number.isNaN(lastRequestAt.getTime())) return 0;
  return Math.max(0, cooldownMs - (now.getTime() - lastRequestAt.getTime()));
}
