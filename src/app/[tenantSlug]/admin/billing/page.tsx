import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";
import { getTenantBySlug } from "@/lib/tenant";
import {
  formatCalendarDate,
  getBillingState,
  isStorefrontOpen,
  trialDaysRemaining,
} from "@/lib/billing";
import { ensurePaymentReference } from "@/lib/paymentReference";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { getSiteOrigin } from "@/lib/siteOrigin";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { BillingPanel, type BillingView } from "@/components/admin/billing/BillingPanel";

export const dynamic = "force-dynamic";

/**
 * Lives under /admin, outside the (storefront) route group, so it stays
 * reachable precisely when it's needed most — a tenant whose site has gone
 * offline can still get here to see how to pay.
 */
export default async function BillingPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const [tenant, session, { dict }, origin] = await Promise.all([
    getTenantBySlug(tenantSlug),
    getAdminSession(),
    getServerDictionary(),
    getSiteOrigin(),
  ]);
  if (!tenant) notFound();

  const view: BillingView = {
    state: getBillingState(tenant),
    // Asked of the same function the paywall uses, rather than re-derived
    // here — two implementations of "is this site live" would eventually
    // disagree, and this page would be the one telling a comfortable lie.
    siteLive: isStorefrontOpen(tenant),
    trialDaysLeft: trialDaysRemaining(tenant.trialEndsAt),
    paidThrough: tenant.paidThrough ? formatCalendarDate(tenant.paidThrough) : null,
    businessName: tenant.businessName,
    paymentReference: await ensurePaymentReference(tenant),
    paymentInstructions: process.env.PAYMENT_INSTRUCTIONS?.trim() || null,
  };

  return (
    <div className="flex flex-1 flex-col">
      <AdminTopBar
        tenantSlug={tenantSlug}
        businessName={tenant.businessName}
        logoUrl={tenant.logoUrl}
        email={session?.email ?? ""}
        siteUrl={`${origin}/${tenantSlug}`}
      />
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="mb-5 font-[family-name:var(--font-display)] text-2xl font-bold text-ink-900">
          {dict.billing.heading}
        </h1>
        <BillingPanel view={view} />
      </div>
    </div>
  );
}
