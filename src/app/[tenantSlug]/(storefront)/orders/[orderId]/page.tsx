import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { isStorefrontOpen } from "@/lib/billing";
import { OrderStatusView } from "@/components/customer/OrderStatusView";

export const dynamic = "force-dynamic";

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; orderId: string }>;
}) {
  const { tenantSlug, orderId } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!isStorefrontOpen(tenant)) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { modifiers: true } },
      branch: true,
      timeSlot: true,
      tenant: { select: { businessName: true, logoUrl: true } },
    },
  });

  // Same NotFoundError-not-Forbidden philosophy used everywhere else in this
  // app: an order that exists but belongs to a different tenant than the
  // slug in the URL looks identical to one that doesn't exist at all.
  if (!order || order.tenantId !== tenant!.id) notFound();

  return (
    <OrderStatusView tenantSlug={tenantSlug} orderId={orderId} initialOrder={JSON.parse(JSON.stringify(order))} />
  );
}
