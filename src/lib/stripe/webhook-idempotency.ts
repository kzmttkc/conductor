/**
 * Process-local Stripe event idempotency.
 * Prevents double-applying the same event in one instance.
 * Call releaseStripeEvent on handler failure so Stripe retries can re-apply.
 *
 * Note: This is in-memory only. Multi-instance / cold starts can still
 * double-apply; durable idempotency should use a DB unique constraint on
 * stripe_event_id when scaling beyond a single process.
 */

const seen = new Map<string, number>();
const TTL_MS = 1000 * 60 * 60 * 24; // 24h

function prune(now: number) {
  for (const [id, at] of seen) {
    if (now - at > TTL_MS) seen.delete(id);
  }
}

export function claimStripeEvent(eventId: string): boolean {
  const now = Date.now();
  prune(now);
  if (seen.has(eventId)) return false;
  seen.set(eventId, now);
  return true;
}

export function releaseStripeEvent(eventId: string) {
  seen.delete(eventId);
}
