"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock3,
  CheckCircle2,
  XCircle,
  User,
  Phone,
  MapPin,
  Clock,
  StickyNote,
  Wallet,
} from "lucide-react";
import type { SerializedOrder } from "@/lib/types";
import { type DiningMethod } from "@/lib/constants";
import { formatOrderTime } from "@/lib/format";
import { usePolling } from "@/lib/hooks/usePolling";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import { Card } from "@/components/ui/Card";

type TrackedOrder = SerializedOrder & {
  tenant: { businessName: string; logoUrl: string | null };
};

const POLL_INTERVAL_MS = 5000;

function statusInfo(
  status: string,
  diningMethod: string,
  t: Dictionary["checkout"]["tracking"]["status"]
) {
  const method = diningMethod as DiningMethod;
  switch (status) {
    case "COMPLETED":
      return {
        icon: CheckCircle2,
        tone: "text-success-600 bg-success-500/10",
        label: t.completedLabel,
        description:
          method === "PICKUP"
            ? t.completedPickup
            : method === "DELIVERY"
              ? t.completedDelivery
              : t.completedDineIn,
      };
    case "CANCELLED":
      return {
        icon: XCircle,
        tone: "text-danger-600 bg-danger-500/10",
        label: t.cancelledLabel,
        description: t.cancelledDescription,
      };
    default:
      return {
        icon: Clock3,
        tone: "text-brand-600 bg-brand-500/10",
        label: t.pendingLabel,
        description:
          method === "PICKUP"
            ? t.pendingPickup
            : method === "DELIVERY"
              ? t.pendingDelivery
              : t.pendingDineIn,
      };
  }
}

export function OrderStatusView({
  tenantSlug,
  orderId,
  initialOrder,
}: {
  tenantSlug: string;
  orderId: string;
  initialOrder: TrackedOrder;
}) {
  const [order, setOrder] = useState(initialOrder);
  const { dict } = useDictionary();
  const t = dict.checkout.tracking;

  usePolling(() => {
    fetch(`/api/orders/track/${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { order: TrackedOrder } | null) => {
        if (data?.order) setOrder(data.order);
      })
      .catch(() => null);
  }, POLL_INTERVAL_MS);

  const status = statusInfo(order.status, order.diningMethod, t.status);
  const StatusIcon = status.icon;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-8 sm:py-12">
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>
      <div className="text-center">
        {order.tenant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={order.tenant.logoUrl}
            alt={order.tenant.businessName}
            className="mx-auto size-12 rounded-xl object-cover"
          />
        ) : null}
        <p className="mt-2 font-[family-name:var(--font-display)] text-lg font-bold text-ink-900">
          {order.tenant.businessName}
        </p>
        <p className="text-sm text-ink-500">{order.branch.name}</p>
      </div>

      <Card className="flex flex-col items-center gap-2 p-6 text-center">
        <motion.div
          key={status.label}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className={`flex size-16 items-center justify-center rounded-full ${status.tone}`}
        >
          <StatusIcon className="size-9" strokeWidth={1.5} />
        </motion.div>
        <p className="mt-1 text-lg font-bold text-ink-900">{status.label}</p>
        <p className="text-sm text-ink-500">{status.description}</p>
        <p className="mt-2 rounded-full bg-cream-100 px-3.5 py-1 text-xs font-semibold text-ink-600">
          {formatMessage(t.orderNumber, { orderNo: order.orderNo })}
        </p>
        <p className="text-xs text-ink-400">
          {formatMessage(t.placed, { time: formatOrderTime(order.createdAt, dict.common.today) })}
        </p>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold text-ink-900">{t.orderDetails}</h2>

        <div className="flex items-center gap-2.5 text-sm text-ink-700">
          <User className="size-4 shrink-0 text-brand-500" />
          <span>{order.customerName}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-ink-700">
          <Phone className="size-4 shrink-0 text-brand-500" />
          <span>{order.customerPhone}</span>
        </div>
        {order.tableNumber && (
          <div className="flex items-center gap-2.5 text-sm text-ink-700">
            <MapPin className="size-4 shrink-0 text-brand-500" />
            <span>{formatMessage(t.table, { tableNumber: order.tableNumber })}</span>
          </div>
        )}
        {order.timeSlot && (
          <div className="flex items-center gap-2.5 text-sm text-ink-700">
            <Clock className="size-4 shrink-0 text-brand-500" />
            <span>{formatMessage(t.time, { label: order.timeSlot.label })}</span>
          </div>
        )}
        {order.deliveryAddress && (
          <div className="flex items-center gap-2.5 text-sm text-ink-700">
            <MapPin className="size-4 shrink-0 text-brand-500" />
            <span>{formatMessage(t.deliveryTo, { address: order.deliveryAddress })}</span>
          </div>
        )}
        {order.notes && (
          <div className="flex items-start gap-2.5 text-sm text-ink-700">
            <StickyNote className="mt-0.5 size-4 shrink-0 text-brand-500" />
            <span>{formatMessage(t.notes, { notes: order.notes })}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 text-sm text-ink-700">
          <Wallet className="size-4 shrink-0 text-brand-500" />
          <span>
            {dict.constants.diningMethod[order.diningMethod as DiningMethod]} ·{" "}
            {dict.constants.paymentMethod[
              order.paymentMethod as keyof typeof dict.constants.paymentMethod
            ]}
          </span>
        </div>

        <div className="mt-1 flex flex-col gap-2 border-t border-ink-100 pt-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="text-ink-700">
                  {item.nameSnapshot} <span className="text-ink-400">x{item.quantity}</span>
                </span>
                {item.modifiers.length > 0 && (
                  <p className="text-xs text-ink-400">
                    {item.modifiers.map((m) => m.nameSnapshot).join(", ")}
                  </p>
                )}
              </div>
              <span className="font-medium text-ink-900">${item.subtotal}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-ink-100 pt-3 text-base font-semibold text-ink-900">
          <span>{t.total}</span>
          <span className="text-brand-600">${order.totalAmount}</span>
        </div>
      </Card>

      <Link
        href={`/${tenantSlug}`}
        className="mx-auto text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        {formatMessage(t.backTo, { businessName: order.tenant.businessName })}
      </Link>
    </div>
  );
}
