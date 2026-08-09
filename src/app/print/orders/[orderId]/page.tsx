import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminAuth";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { formatMessage } from "@/lib/i18n/format";
import { AutoPrint } from "@/components/print/AutoPrint";
import { formatOrderTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PrintOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const [session, { dict }] = await Promise.all([getAdminSession(), getServerDictionary()]);
  const t = dict.adminKitchen.print;

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center text-ink-500">
        <p>{t.loginPrompt}</p>
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          {t.logIn}
        </Link>
      </div>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { modifiers: true } }, branch: true, timeSlot: true, tenant: true },
  });

  // Same NotFoundError-not-Forbidden philosophy as the rest of the admin
  // panel: a mismatched tenant looks identical to a nonexistent order.
  if (!order || order.tenantId !== session.tenantId) notFound();

  return (
    <div className="flex min-h-screen flex-col items-center bg-ink-100 px-4 py-8 print:bg-white print:p-0">
      <div className="w-full max-w-[320px] bg-white p-5 font-mono text-sm text-ink-900 shadow-soft print:max-w-none print:p-4 print:shadow-none">
        <div className="text-center">
          <p className="text-base font-bold">{order.tenant.businessName}</p>
          <p className="text-xs text-ink-500">{order.branch.name}</p>
        </div>

        <div className="my-3 border-t border-dashed border-ink-300" />

        <div className="text-center">
          <p className="text-2xl font-bold">{order.orderNo}</p>
          <p className="text-xs text-ink-500">
            {formatOrderTime(order.createdAt.toISOString(), dict.common.today)}
          </p>
        </div>

        <div className="my-3 border-t border-dashed border-ink-300" />

        <div className="flex flex-col gap-1">
          <p className="font-bold">
            {dict.constants.diningMethod[order.diningMethod as keyof typeof dict.constants.diningMethod]}
            {order.tableNumber && formatMessage(t.tableSuffix, { tableNumber: order.tableNumber })}
            {order.timeSlot && ` · ${order.timeSlot.label}`}
          </p>
          <p>
            {order.customerName} · {order.customerPhone}
          </p>
          {order.deliveryAddress && <p>{formatMessage(t.deliverTo, { address: order.deliveryAddress })}</p>}
        </div>

        <div className="my-3 border-t border-dashed border-ink-300" />

        <div className="flex flex-col gap-2">
          {order.items.map((item) => (
            <div key={item.id}>
              <p className="text-base font-semibold">
                {item.quantity}x {item.nameSnapshot}
              </p>
              {item.modifiers.map((m) => (
                <p key={m.id} className="pl-4 text-sm">
                  – {m.nameSnapshot}
                </p>
              ))}
            </div>
          ))}
        </div>

        {order.notes && (
          <>
            <div className="my-3 border-t border-dashed border-ink-300" />
            <p className="font-bold">{formatMessage(t.notes, { notes: order.notes })}</p>
          </>
        )}

        <div className="my-3 border-t border-dashed border-ink-300" />

        <div className="flex justify-between">
          <span>
            {dict.constants.paymentMethod[order.paymentMethod as keyof typeof dict.constants.paymentMethod]}
          </span>
          <span className="font-bold">${order.totalAmount}</span>
        </div>
      </div>

      <AutoPrint label={t.printButton} />
    </div>
  );
}
