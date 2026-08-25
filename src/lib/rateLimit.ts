import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight, zero-dependency request guards: a fixed-window rate limiter and
 * a request body-size cap. Both are cheap "reject early" defenses meant to run
 * at the very top of a route handler, before any bcrypt hashing or DB work, so
 * an attacker can't turn a flood of requests into CPU/DB load.
 *
 * IMPORTANT (serverless): the rate-limit store lives in this process's memory.
 * On Vercel each serverless instance keeps its own map, so limits are enforced
 * per-instance, not globally across the whole deployment. That still bounds the
 * damage any single instance will do and stops naive single-source floods with
 * no extra infrastructure. For strict global limits (e.g. a distributed
 * credential-stuffing attack), back this with a shared store such as Upstash
 * Redis and swap out `checkRateLimit` — the call sites won't need to change.
 */

interface Bucket {
  count: number;
  resetAt: number; // epoch ms when the window rolls over
}

// key ("bucket:ip", or an account-scoped key) -> counter. Module-level so it
// survives across requests within a warm instance.
const store = new Map<string, Bucket>();

// Opportunistic cleanup. Without this the map would grow one entry per unique
// IP forever — an unbounded map is itself a slow memory-exhaustion DoS. We
// sweep expired entries at most once a minute, piggybacking on real traffic.
let lastSweepAt = 0;
function sweepExpired(now: number): void {
  if (now - lastSweepAt < 60_000) return;
  lastSweepAt = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitRule {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

/**
 * Preset limits per protected endpoint. Tuned to be generous for real humans
 * but tight enough to blunt automated abuse. Adjust here in one place.
 */
export const RATE_LIMITS = {
  // Password guessing against one account. Keyed per email (see the login
  // route), not per IP: several testers on one office NAT — or any deployment
  // where no forwarded-IP header reaches us and everyone lands in the shared
  // "unknown" bucket — would otherwise burn each other's budget and get
  // locked out by someone else's typo. A successful login clears the counter,
  // so in practice only unbroken runs of failures accumulate.
  login: { limit: 10, windowMs: 60_000 },
  // The flood guard the per-email limit can't provide: caps how much bcrypt
  // and DB work one source can trigger regardless of which accounts it aims
  // at. Also bounds how many per-email buckets a single IP can create, which
  // keeps the store from growing without limit.
  loginIp: { limit: 30, windowMs: 60_000 },
  // Each signup creates a tenant + branch + admin. Keep mass creation slow.
  signup: { limit: 5, windowMs: 60 * 60_000 },
  // Slug availability probing / enumeration. Called live while typing, so
  // allow a healthy burst but cap sustained scraping.
  checkSlug: { limit: 40, windowMs: 60_000 },
  // Public, unauthenticated order creation — the main order-spam vector.
  orderCreate: { limit: 20, windowMs: 60_000 },
  // Authenticated, but uploads hit paid blob storage, so still worth capping.
  upload: { limit: 30, windowMs: 60_000 },
  // Public order lookup by order number + phone — no login, so this is the
  // main brute-force surface (guessing phone numbers against a known order
  // number, or vice versa). Generous enough for a customer fumbling digits.
  orderLookup: { limit: 15, windowMs: 60_000 },
  // Authenticated, but each call sends an email — keep it from being used to
  // spam an inbox (or burn through Resend's send quota).
  resendVerification: { limit: 3, windowMs: 5 * 60_000 },
  // Public, unauthenticated — the enumeration/spam surface for "forgot
  // password". Deliberately tight; a real user rarely needs more than a
  // couple of tries in five minutes.
  forgotPassword: { limit: 3, windowMs: 5 * 60_000 },
  // Public, unauthenticated — guarding the token itself (128 bits, so brute
  // force isn't realistic) more than rate-limiting a legitimate retry.
  resetPassword: { limit: 10, windowMs: 60_000 },
  // Same shape as resetPassword: a 128-bit single-use token, so this is about
  // capping retries rather than stopping a guess.
  verifyEmail: { limit: 10, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitRule>;

export function checkRateLimit(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  sweepExpired(now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + rule.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      ok: true,
      limit: rule.limit,
      remaining: rule.limit - 1,
      resetAt,
      retryAfterSec: Math.ceil(rule.windowMs / 1000),
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, rule.limit - existing.count);
  return {
    ok: existing.count <= rule.limit,
    limit: rule.limit,
    remaining,
    resetAt: existing.resetAt,
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/**
 * Forgets a bucket. Used to retire a failure counter once the user proves
 * they're legitimate (a successful login), so an earlier run of typos never
 * counts against someone who has since got it right.
 */
export function clearRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Best-effort client IP. Behind Vercel/most proxies the platform sets
 * `x-real-ip` to the true client and prepends it to `x-forwarded-for`; the
 * leftmost XFF entry is the original client. `NextRequest.ip` was removed in
 * recent Next, so we read headers directly. Falls back to a shared "unknown"
 * bucket if no header is present (can't happen behind Vercel's proxy).
 */
export function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();

  return "unknown";
}

/**
 * Applies a rate-limit rule to a request. Returns a ready-to-send `429`
 * response when the caller is over the limit, or `null` to continue. Use as:
 *
 *   const limited = rateLimit(request, "login", RATE_LIMITS.login);
 *   if (limited) return limited;
 */
export function rateLimit(
  request: NextRequest,
  bucket: string,
  rule: RateLimitRule
): NextResponse | null {
  const ip = getClientIp(request);
  return rateLimitByKey(`${bucket}:${ip}`, rule);
}

/**
 * Same as `rateLimit`, but for buckets keyed by something other than the
 * caller's IP — an account identifier, say. Callers build the whole key.
 */
export function rateLimitByKey(key: string, rule: RateLimitRule): NextResponse | null {
  const result = checkRateLimit(key, rule);
  if (result.ok) return null;

  const response = NextResponse.json(
    {
      error: "Too many requests. Please slow down and try again shortly.",
      // Stable identifier so the client can show this in the user's own
      // language; `error` stays as the fallback for any caller that doesn't
      // recognise the code.
      code: "rate_limited",
    },
    { status: 429 }
  );
  response.headers.set("Retry-After", String(result.retryAfterSec));
  response.headers.set("RateLimit-Limit", String(result.limit));
  response.headers.set("RateLimit-Remaining", String(result.remaining));
  response.headers.set(
    "RateLimit-Reset",
    String(Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000)))
  );
  return response;
}

/**
 * Rejects a request whose declared body is larger than `maxBytes` before we
 * ever buffer or parse it, so a giant payload can't exhaust memory/CPU. Returns
 * a `413` response to send, or `null` to continue. `Content-Length` can be
 * absent (chunked uploads) or spoofed, so this is defense-in-depth layered on
 * top of per-field validation limits — not the only guard.
 */
export function enforceBodyLimit(
  request: NextRequest,
  maxBytes: number
): NextResponse | null {
  const header = request.headers.get("content-length");
  if (!header) return null;

  const declared = Number(header);
  if (Number.isFinite(declared) && declared > maxBytes) {
    return NextResponse.json(
      { error: "Request payload is too large." },
      { status: 413 }
    );
  }
  return null;
}

/** Sensible body-size caps (bytes) for the JSON endpoints. */
export const BODY_LIMITS = {
  /** Auth + slug checks carry tiny JSON payloads. */
  json: 16 * 1024, // 16KB
  /** Orders can hold up to ~100 line items; still small. */
  order: 128 * 1024, // 128KB
} as const;
