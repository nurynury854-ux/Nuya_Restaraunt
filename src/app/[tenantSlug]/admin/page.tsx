import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminAuth";
import { getTenantBySlug } from "@/lib/tenant";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { AdminBranchCards } from "@/components/admin/AdminBranchCards";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import Link from "next/link";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBranchSelectPage({
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
  const t = dict.adminChrome.branchSelect;

  const branches = await prisma.branch.findMany({
    where: { tenantId: tenant!.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AdminTopBar
        tenantSlug={tenantSlug}
        businessName={tenant!.businessName}
        logoUrl={tenant!.logoUrl}
        email={session?.email ?? ""}
      />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-5 py-14">
        <div className="text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink-900">
            {tenant!.businessName}
          </p>
          <p className="mt-1 text-sm text-ink-500">{t.chooseLocation}</p>
          <Link
            href={`/${tenantSlug}/admin/settings`}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl border border-ink-100 bg-white px-5 text-sm font-medium text-ink-700 shadow-soft transition-colors hover:border-brand-300 hover:text-brand-600"
          >
            <Settings className="size-4" />
            {t.siteSettings}
          </Link>
        </div>
        <AdminBranchCards
          tenantSlug={tenantSlug}
          branches={JSON.parse(JSON.stringify(branches))}
        />
      </main>
    </div>
  );
}
