import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { BranchSettingsForm } from "@/components/admin/branches/BranchSettingsForm";
import { BranchClosures } from "@/components/admin/branches/BranchClosures";

export const dynamic = "force-dynamic";

export default async function BranchSettingsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; branchId: string }>;
}) {
  const { tenantSlug, branchId } = await params;
  const [tenant, branch, { dict }] = await Promise.all([
    getTenantBySlug(tenantSlug),
    prisma.branch.findUnique({ where: { id: branchId } }),
    getServerDictionary(),
  ]);
  if (!branch || branch.tenantId !== tenant?.id) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-5 font-[family-name:var(--font-display)] text-2xl font-bold text-ink-900">
        {dict.adminSettings.branchSettings.heading}
      </h1>
      <div className="flex flex-col gap-6">
        <BranchSettingsForm branch={JSON.parse(JSON.stringify(branch))} />
        <BranchClosures branchId={branchId} />
      </div>
    </div>
  );
}
