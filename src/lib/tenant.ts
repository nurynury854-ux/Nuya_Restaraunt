import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Resolves a tenant by its URL slug. Wrapped in React's `cache()` so multiple
 * Server Components rendering within the same request (e.g. a layout and its
 * nested pages) share one DB call instead of each re-querying.
 */
export const getTenantBySlug = cache(async (slug: string) => {
  return prisma.tenant.findUnique({ where: { slug } });
});

/**
 * Whether this tenant is on the platform at all — i.e. exists and hasn't been
 * suspended by a platform admin. Anything false here is shown as a 404: a
 * suspended tenant should be indistinguishable from a slug nobody registered.
 *
 * This is NOT the paywall. A tenant can be perfectly visible and still have a
 * closed storefront because their subscription lapsed — that case gets a
 * "temporarily unavailable" notice rather than a 404, and the tenant keeps
 * their admin panel. See `isStorefrontOpen` in src/lib/billing.ts, which is
 * the check every public page and public API route should be using.
 */
export function isTenantVisible(tenant: { isActive: boolean } | null): boolean {
  return !!tenant && tenant.isActive;
}
