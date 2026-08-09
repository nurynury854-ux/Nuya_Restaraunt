import Link from "next/link";
import { Tv } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PENDING_STATUSES } from "@/lib/constants";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { OrdersBoard } from "@/components/admin/orders/OrdersBoard";

export const dynamic = "force-dynamic";

export default async function PendingOrdersPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; branchId: string }>;
}) {
  const { tenantSlug, branchId } = await params;
  const [orders, { dict }] = await Promise.all([
    prisma.order.findMany({
      where: { branchId, status: { in: PENDING_STATUSES } },
      include: { items: { include: { modifiers: true } }, branch: true, timeSlot: true },
      orderBy: { createdAt: "asc" },
    }),
    getServerDictionary(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink-900">
          {dict.adminOrders.pendingTitle}
        </h1>
        <Link
          href={`/${tenantSlug}/admin/${branchId}/kitchen`}
          target="_blank"
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-ink-100 bg-white px-3.5 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-600"
        >
          <Tv className="size-4" />
          {dict.adminOrders.kitchenDisplay}
        </Link>
      </div>
      <OrdersBoard mode="pending" branchId={branchId} initialOrders={JSON.parse(JSON.stringify(orders))} />
    </div>
  );
}
