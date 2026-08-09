import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAdminSession } from "@/lib/adminAuth";
import { getTenantBySlug } from "@/lib/tenant";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { NewBranchForm } from "@/components/admin/branches/NewBranchForm";

export const dynamic = "force-dynamic";

export default async function NewBranchPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const [tenant, session, { dict }] = await Promise.all([
    getTenantBySlug(tenantSlug),
    getAdminSession(),
    getServerDictionary(),
  ]);
  const t = dict.adminSettings.newBranch;

  return (
    <div className="flex flex-1 flex-col">
      <AdminTopBar
        tenantSlug={tenantSlug}
        businessName={tenant!.businessName}
        logoUrl={tenant!.logoUrl}
        email={session?.email ?? ""}
      />
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href={`/${tenantSlug}/admin`}
          className="mb-4 flex w-fit items-center gap-1 text-sm text-ink-500 hover:text-brand-600"
        >
          <ChevronLeft className="size-4" />
          {t.locations}
        </Link>
        <h1 className="mb-5 font-[family-name:var(--font-display)] text-2xl font-bold text-ink-900">
          {t.heading}
        </h1>
        <NewBranchForm tenantSlug={tenantSlug} />
      </div>
    </div>
  );
}
