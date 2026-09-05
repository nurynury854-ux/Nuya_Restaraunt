import { headers } from "next/headers";

/**
 * The current request's own origin, read from the `Host`/`X-Forwarded-Proto`
 * headers set by the proxy in front of Next.js (same headers `request.nextUrl.origin`
 * relies on in route handlers) — works in server components, which have no
 * `NextRequest` to read `.nextUrl` from.
 */
export async function getSiteOrigin() {
  const store = await headers();
  const host = store.get("host") ?? "";
  const proto = store.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
