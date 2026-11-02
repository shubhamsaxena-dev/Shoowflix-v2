import "server-only";
import { jsonError, clientIp } from "./http";

/**
 * Rate-limit-lite: fixed-window counter held in module memory.
 * Per server instance only (not distributed) — good enough to blunt
 * accidental hammering and casual abuse of /api/register and /api/ai/*.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export function rateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_KEYS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
      if (buckets.size >= MAX_KEYS) buckets.clear();
    }
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Returns a 429 response when the caller is over the limit, otherwise null. */
export function limitRequest(req: Request, scope: string, opts: { limit: number; windowMs: number }) {
  const result = rateLimit(`${scope}:${clientIp(req)}`, opts);
  if (result.ok) return null;
  const res = jsonError(429, "Too many requests. Wait a moment and try again.");
  res.headers.set("Retry-After", String(result.retryAfter));
  return res;
}
