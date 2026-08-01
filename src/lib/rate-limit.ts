import { NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter (per-process).
 * For production with multiple instances, swap with Redis/Upstash.
 *
 * Usage:
 *   const limited = rateLimit(req, { key: "login", limit: 5, windowSec: 60 });
 *   if (limited) return limited.response;
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Periodically clean expired buckets to avoid memory growth
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.resetAt < now) store.delete(k);
  }
}, 60_000).unref?.();

export interface RateLimitOptions {
  /** unique bucket name, e.g. "login", "post", "report" */
  key: string;
  /** max requests allowed in the window */
  limit: number;
  /** window size in seconds */
  windowSec: number;
}

export interface RateLimitResult {
  limited: boolean;
  response?: NextResponse;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  req: Request,
  opts: RateLimitOptions
): RateLimitResult {
  // Identify the client by IP (via x-forwarded-for) or fallback to a generic key
  const xff = req.headers.get("x-forwarded-for");
  const ip = xff ? xff.split(",")[0].trim() : "local";
  const bucketKey = `${opts.key}:${ip}`;

  const now = Date.now();
  const windowMs = opts.windowSec * 1000;
  let bucket = store.get(bucketKey);

  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(bucketKey, bucket);
  }

  bucket.count += 1;

  if (bucket.count > opts.limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return {
      limited: true,
      remaining: 0,
      resetAt: bucket.resetAt,
      response: NextResponse.json(
        {
          error: `Too many requests. Try again in ${retryAfter}s.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(opts.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.floor(bucket.resetAt / 1000)),
          },
        }
      ),
    };
  }

  return {
    limited: false,
    remaining: opts.limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}
