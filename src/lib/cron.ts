/**
 * Shared auth for /api/cron/* routes.
 * The OpenNext worker cannot host `scheduled` handlers, so crons arrive as
 * HTTP calls carrying a Bearer secret — from cron-job.org (free, no card)
 * or from workers/companion's scheduled relay.
 */

export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    return req.headers.get("authorization") === `Bearer ${secret}`;
  }
  // No secret configured: allow only outside production (local dev).
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}
