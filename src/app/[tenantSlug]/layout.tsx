import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getTenantBySlug, isTenantVisible } from "@/lib/tenant";
import { brandThemeVars, varsToCss } from "@/lib/theme";

/**
 * Wraps everything under /{tenantSlug} — the public storefront *and* the
 * tenant's admin panel — so the only gate that belongs here is the one that
 * applies to both: does this tenant exist and is it still allowed on the
 * platform at all.
 *
 * The subscription check is deliberately one level down, in
 * (storefront)/layout.tsx, so a tenant whose billing has lapsed can still
 * reach their admin panel to fix it. Putting it here would lock them out of
 * the page they need in order to pay.
 */
export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!isTenantVisible(tenant)) notFound();

  // The brand scale applies to the admin panel too; background, fonts and
  // corners are storefront-only and applied in (storefront)/layout.tsx.
  const brandVars = brandThemeVars(tenant!.accentColor);

  return (
    <>
      {Object.keys(brandVars).length > 0 && (
        <style dangerouslySetInnerHTML={{ __html: `:root{${varsToCss(brandVars)}}` }} />
      )}
      {children}
    </>
  );
}
