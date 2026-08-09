import { prisma } from "@/lib/prisma";
import { COMPLETED_STATUSES } from "@/lib/constants";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { OrdersBoard } from "@/components/admin/orders/OrdersBoard";

export const dynamic = "force-dynamic";

export default async function CompletedOrdersPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; branchId: string }>;
}) {
  const { branchId } = await params;
  const [orders, { dict }] = await Promise.all([
    prisma.order.findMany({
      where: { branchId, status: { in: COMPLETED_STATUSES } },
      include: { items: { include: { modifiers: true } }, branch: true, timeSlot: true },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    getServerDictionary(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-5 font-[family-name:var(--font-display)] text-2xl font-bold text-ink-900">
        {dict.adminOrders.completedTitle}
      </h1>
      <OrdersBoard mode="completed" branchId={branchId} initialOrders={JSON.parse(JSON.stringify(orders))} />
    </div>
  );
}
