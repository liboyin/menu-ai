import { NextRequest } from 'next/server';
import Redis from 'ioredis';
import {
  IRateLimiterOptions,
  IRateLimiterStoreOptions,
  RateLimiterMemory,
  RateLimiterRedis,
  RateLimiterRes,
} from 'rate-limiter-flexible';

const POINTS = 10;
const DURATION_SECONDS = 60 * 60;
const KEY_PREFIX = 'menuai_rl';

type Limiter = RateLimiterMemory | RateLimiterRedis;

/**
 * Result of consuming a rate-limit point.
 *
 * Properties:
 *   allowed: True if the request is under the limit.
 *   limit: Configured maximum points per window.
 *   remaining: Remaining points in the current window (0 when blocked).
 *   retryAfterMs: Milliseconds until the next point becomes available
 *     (0 when allowed).
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Builds a fresh rate limiter, preferring Redis when REDIS_URL is set and
 * falling back to an in-process Memory limiter otherwise.
 *
 * The Memory backend is per-instance and resets on cold start, so deployments
 * with more than one process (e.g. Vercel serverless, multi-container
 * self-hosts) should always set REDIS_URL to share state across instances.
 *
 * Returns:
 *   A RateLimiterRedis when REDIS_URL is set, otherwise a RateLimiterMemory.
 */
export function createLimiter(): Limiter {
  const baseOptions: IRateLimiterOptions = {
    points: POINTS,
    duration: DURATION_SECONDS,
    keyPrefix: KEY_PREFIX,
  };

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const client = new Redis(redisUrl, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    client.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    const redisOptions: IRateLimiterStoreOptions = {
      ...baseOptions,
      storeClient: client,
    };
    return new RateLimiterRedis(redisOptions);
  }

  return new RateLimiterMemory(baseOptions);
}

let cachedLimiter: Limiter | null = null;

/**
 * Returns a process-wide rate limiter instance, constructing it lazily on
 * first use so importing this module does not open a Redis connection.
 *
 * Returns:
 *   The shared Limiter for this Node process.
 */
function getLimiter(): Limiter {
  if (!cachedLimiter) {
    cachedLimiter = createLimiter();
  }
  return cachedLimiter;
}

/**
 * For tests: clears the cached limiter so the next getLimiter() call rebuilds
 * one (e.g. after toggling REDIS_URL or swapping in a spy).
 */
export function resetLimiterForTests(): void {
  cachedLimiter = null;
}

/**
 * For tests: installs a specific Limiter as the cached instance so subsequent
 * checkRateLimit() calls go through it. Pair with resetLimiterForTests() in
 * afterEach to avoid leaking state between tests.
 *
 * Args:
 *   limiter: A Limiter (or fake) to use until reset.
 */
export function setLimiterForTests(limiter: Limiter): void {
  cachedLimiter = limiter;
}

/**
 * Extracts the client IP for rate-limit keying.
 *
 * Prefers x-forwarded-for (set by Vercel and most reverse proxies), falling
 * back to x-real-ip, and finally a shared "unknown" bucket so misconfigured
 * deployments still rate-limit (conservatively, by lumping callers together)
 * rather than silently disabling the limit.
 *
 * Args:
 *   request: The incoming Next.js request.
 *
 * Returns:
 *   A string suitable for use as a rate-limit key.
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

/**
 * Consumes one rate-limit point for the given key and reports the outcome.
 *
 * Fails open: if the limiter throws something that is not a RateLimiterRes
 * (e.g. Redis is unreachable), the request is allowed and the error logged.
 * This keeps the app usable when shared state is degraded, at the cost of
 * temporarily losing the protection — acceptable here because the limit
 * exists to cap third-party API spend, not to enforce correctness.
 *
 * Args:
 *   key: The bucket key, typically a client IP from getClientIp().
 *
 * Returns:
 *   A RateLimitResult describing whether the request is allowed and, if not,
 *   how long until the next retry.
 */
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  try {
    const res = await getLimiter().consume(key);
    return {
      allowed: true,
      limit: POINTS,
      remaining: res.remainingPoints,
      retryAfterMs: 0,
    };
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      return {
        allowed: false,
        limit: POINTS,
        remaining: 0,
        retryAfterMs: err.msBeforeNext,
      };
    }
    console.error('Rate limiter backend error, failing open:', err);
    return {
      allowed: true,
      limit: POINTS,
      remaining: POINTS,
      retryAfterMs: 0,
    };
  }
}
