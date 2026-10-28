import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminAuth";
import { getTenantBySlug } from "@/lib/tenant";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { getSiteOrigin } from "@/lib/siteOrigin";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { SmsSettingsForm } from "@/components/admin/settings/SmsSettingsForm";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
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

  // Deliberately selected rather than passing the raw tenant down — never
  // ship smsPasswordEnc (even encrypted) to the client when nothing needs it.
  const smsConfig = await prisma.tenant.findUnique({
    where: { id: tenant.id },
    select: { smsUsername: true, smsPasswordEnc: true },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AdminTopBar
        tenantSlug={tenantSlug}
        businessName={tenant.businessName}
        logoUrl={tenant.logoUrl}
        email={session?.email ?? ""}
        siteUrl={`${origin}/${tenantSlug}`}
      />
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl font-bold text-ink-900">
          {dict.notifications.heading}
        </h1>
        <p className="mb-5 text-sm text-ink-500">{dict.notifications.subheading}</p>
        <SmsSettingsForm
          smsConfigured={!!(smsConfig?.smsUsername && smsConfig?.smsPasswordEnc)}
          smsUsername={smsConfig?.smsUsername ?? null}
        />
      </div>
    </div>
  );
}
