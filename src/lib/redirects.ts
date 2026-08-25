/**
 * Rules for the `?next=` hand-off between the proxy and the login page.
 *
 * The proxy records where an unauthenticated visitor was headed so login can
 * send them back there afterwards. That parameter arrives from the URL bar,
 * so it is attacker-controlled and must be validated on the way out — see
 * `resolvePostLoginPath`.
 */

/** Matches /{tenantSlug}/admin and everything under it. */
export const ADMIN_PATH = /^\/([^/]+)\/admin(?:\/.*)?$/;

/**
 * True only for a path that stays on this origin. `router.replace()` happily
 * follows an absolute URL off-site, and browsers resolve both `//evil.com`
 * and `/\evil.com` as protocol-relative, so a leading "/" alone isn't enough.
 */
function isSameOriginPath(next: string): boolean {
  return (
    next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
  );
}

/**
 * Decides where to land after a successful admin login.
 *
 * Falls back to the admin's own panel unless `next` is a path we're confident
 * they can actually reach. Sending them somewhere the proxy will only bounce
 * is worse than ignoring `next`: the bounce re-attaches the same `next`, so
 * the tester lands back on the login form with no error — login looks broken
 * even though it succeeded. The two ways that happens:
 *
 *   - `next` points at a *different* tenant's admin panel (a shared link, a
 *     stale bookmark, or a second account of their own).
 *   - `next` points into /platform-admin, which an admin session never
 *     satisfies.
 */
export function resolvePostLoginPath(
  next: string | null | undefined,
  tenantSlug: string
): string {
  const ownPanel = `/${tenantSlug}/admin`;
  if (!next || !isSameOriginPath(next)) return ownPanel;

  if (next === "/platform-admin" || next.startsWith("/platform-admin/")) {
    return ownPanel;
  }

  const match = next.match(ADMIN_PATH);
  if (match && match[1] !== tenantSlug) return ownPanel;

  return next;
}
