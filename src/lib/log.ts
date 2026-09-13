/**
 * Structured logging convention. Workers Logs (free: 200k events/day,
 * 3-day retention, no card) captures stdout automatically.
 * Use `sampleRate` < 1 for hot paths so logs don't eat the daily budget.
 */

export function log(event: string, data?: Record<string, unknown>, sampleRate = 1): void {
  if (sampleRate < 1 && Math.random() >= sampleRate) return;
  try {
    console.log(JSON.stringify({ t: new Date().toISOString(), event, ...data }));
  } catch {
    console.log(event);
  }
}

export function logError(event: string, err: unknown, data?: Record<string, unknown>): void {
  log(event, { ...data, error: err instanceof Error ? err.message : String(err) });
}
