import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { BranchSelector } from "@/components/customer/BranchSelector";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export const dynamic = "force-dynamic";

export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = (await getTenantBySlug(tenantSlug))!;
  const { dict } = await getServerDictionary();
  const t = dict.customer.branchSelect;

  const branches = await prisma.branch.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="flex flex-1 flex-col items-center px-5 py-14 sm:py-20">
      <div className="w-full max-w-4xl">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="flex flex-col items-center text-center gap-3">
          <span className="inline-flex items-center rounded-full bg-brand-100 px-3.5 py-1 text-xs font-semibold tracking-wide text-brand-700">
            {t.orderOnline}
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-ink-900 sm:text-5xl">
            {tenant.businessName}
          </h1>
          <p className="max-w-md text-sm text-ink-500 sm:text-base">{t.chooseLocation}</p>
        </div>

        <BranchSelector tenantSlug={tenantSlug} branches={branches} />

        <div className="mt-10 flex justify-center">
          <Link
            href={`/${tenantSlug}/orders`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600"
          >
            <PackageSearch className="size-4" />
            {t.trackExistingOrder}
          </Link>
        </div>
      </div>
    </main>
  );
}
