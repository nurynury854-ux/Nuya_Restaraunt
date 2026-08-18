import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminAuth";
import { getTenantBySlug } from "@/lib/tenant";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { BranchNav } from "@/components/admin/BranchNav";
import { NewOrderNotifier } from "@/components/admin/NewOrderNotifier";
import { EmailVerifyBanner } from "@/components/admin/EmailVerifyBanner";

export default async function BranchPanelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenantSlug: string; branchId: string }>;
}) {
  const { tenantSlug, branchId } = await params;
  const [tenant, branch, session] = await Promise.all([
    getTenantBySlug(tenantSlug),
    prisma.branch.findUnique({ where: { id: branchId } }),
    getAdminSession(),
  ]);

  // The proxy already confirms the session belongs to this tenant slug, but
  // that says nothing about whether `branchId` in the URL is actually one of
  // THIS tenant's branches — someone logged into tenant A could otherwise
  // browse to tenant B's branch id here. Block that explicitly: this is the
  // single choke point every nested page in this panel renders through, so
  // a 404 here protects all of them.
  if (!branch || branch.tenantId !== tenant?.id) notFound();

  const admin = session
    ? await prisma.adminUser.findUnique({
        where: { id: session.sub },
        select: { emailVerified: true },
      })
    : null;

  return (
    <div className="flex flex-1 flex-col">
      <AdminTopBar
        tenantSlug={tenantSlug}
        businessName={tenant.businessName}
        logoUrl={tenant.logoUrl}
        email={session?.email ?? ""}
        branchName={branch.name}
      />
      {admin && !admin.emailVerified && <EmailVerifyBanner email={session!.email} />}
      <BranchNav tenantSlug={tenantSlug} branchId={branchId} />
      <NewOrderNotifier branchId={branchId} />
      <div className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</div>
    </div>
  );
}
