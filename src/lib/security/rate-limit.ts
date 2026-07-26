/**
 * In-memory sliding-window rate limiter (per process).
 * Good enough for Demo + single-region Vercel; soft protection vs abuse.
 */

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < opts.windowMs);
  if (bucket.timestamps.length >= opts.limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((opts.windowMs - (now - oldest)) / 1000));
    buckets.set(key, bucket);
    return { ok: false, retryAfterSec };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { ok: true };
}

export function clientKey(request: Request, userId?: string | null) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || request.headers.get('x-real-ip') || 'unknown';
  return userId ? `user:${userId}` : `ip:${ip}`;
}
