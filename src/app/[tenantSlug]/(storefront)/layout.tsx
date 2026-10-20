import type { ReactNode } from "react";
import { getTenantBySlug } from "@/lib/tenant";
import { isStorefrontOpen } from "@/lib/billing";
import { StorefrontClosed } from "@/components/customer/StorefrontClosed";
import { storefrontBackgroundCss, storefrontThemeVars, varsToCss } from "@/lib/theme";

/**
 * The paywall.
 *
 * This route group holds every customer-facing page — the location picker,
 * the menu, checkout and order tracking — and nothing else, so one check here
 * closes the whole storefront at once. The admin panel sits outside the group
 * and is deliberately unaffected: a tenant whose subscription lapsed needs to
 * be able to log in and pay.
 *
 * A closed storefront renders a notice rather than a 404. The people who hit
 * this URL are the restaurant's own customers, and telling them the site is
 * temporarily unavailable is far better than a dead end that makes the
 * business look like it never existed. (A tenant suspended by the platform
 * *does* get a 404 — that's handled one level up.)
 *
 * Being the one layout that wraps exactly the customer-facing pages, it's
 * also where the tenant's storefront theme (src/lib/theme.ts) is applied.
 */
export default async function StorefrontLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  // The parent layout already 404s a missing tenant.
  const themeCss = `:root{${varsToCss(storefrontThemeVars(tenant!))}}${storefrontBackgroundCss(tenant!)}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      {isStorefrontOpen(tenant) ? (
        children
      ) : (
        <StorefrontClosed businessName={tenant?.businessName ?? ""} />
      )}
    </>
  );
}
