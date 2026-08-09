"use client";

import Link from "next/link";
import { User, Phone, MapPin, Clock, StickyNote, Wallet, Printer } from "lucide-react";
import type { SerializedOrder } from "@/lib/types";
import { type OrderStatus } from "@/lib/constants";
import { formatOrderTime } from "@/lib/format";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function OrderCard({
  order,
  onComplete,
  onCancel,
  busy,
}: {
  order: SerializedOrder;
  onComplete?: () => void;
  onCancel?: () => void;
  busy?: boolean;
}) {
  const { dict } = useDictionary();
  const t = dict.adminOrders.card;
  const isCancelled = order.status === "CANCELLED";

  return (
    <Card className={`flex flex-col gap-3 p-4 sm:p-5 ${isCancelled ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink-900">{order.orderNo}</p>
            <Badge tone="brand">{dict.constants.diningMethod[order.diningMethod as keyof typeof dict.constants.diningMethod]}</Badge>
            {order.status !== "PENDING" && (
              <Badge tone={isCancelled ? "danger" : "success"}>
                {dict.constants.orderStatus[order.status as OrderStatus]}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-400">
            {formatMessage(t.placed, { time: formatOrderTime(order.createdAt, dict.common.today) })}
            {order.status === "COMPLETED" && (
              <>
                {formatMessage(t.completedAt, {
                  time: formatOrderTime(order.updatedAt, dict.common.today),
                })}
              </>
            )}
            {order.status === "CANCELLED" && (
              <>
                {formatMessage(t.cancelledAt, {
                  time: formatOrderTime(order.updatedAt, dict.common.today),
                })}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-brand-600">${order.totalAmount}</p>
          <Link
            href={`/print/orders/${order.id}`}
            target="_blank"
            aria-label={formatMessage(t.printAriaLabel, { orderNo: order.orderNo })}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-brand-600"
          >
            <Printer className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-1.5 text-sm text-ink-700 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <User className="size-3.5 shrink-0 text-brand-500" />
          <span>{order.customerName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="size-3.5 shrink-0 text-brand-500" />
          <span>{order.customerPhone}</span>
        </div>
        {order.tableNumber && (
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0 text-brand-500" />
            <span>{formatMessage(t.table, { tableNumber: order.tableNumber })}</span>
          </div>
        )}
        {order.timeSlot && (
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 shrink-0 text-brand-500" />
            <span>{formatMessage(t.time, { label: order.timeSlot.label })}</span>
          </div>
        )}
        {order.deliveryAddress && (
          <div className="flex items-center gap-2 sm:col-span-2">
            <MapPin className="size-3.5 shrink-0 text-brand-500" />
            <span>{formatMessage(t.deliveryTo, { address: order.deliveryAddress })}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Wallet className="size-3.5 shrink-0 text-brand-500" />
          <span>{dict.constants.paymentMethod[order.paymentMethod as keyof typeof dict.constants.paymentMethod]}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl bg-cream-50 px-3.5 py-2.5 text-sm text-ink-700">
        {order.items.map((i) => (
          <div key={i.id}>
            <span>
              {i.nameSnapshot} x{i.quantity}
            </span>
            {i.modifiers.length > 0 && (
              <span className="block text-xs text-ink-500">
                {i.modifiers.map((m) => m.nameSnapshot).join(", ")}
              </span>
            )}
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="flex items-start gap-2 text-sm text-ink-700">
          <StickyNote className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
          <span>{formatMessage(t.notes, { notes: order.notes })}</span>
        </div>
      )}

      {(onComplete || onCancel) && (
        <div className="flex justify-end gap-2 border-t border-ink-100 pt-3">
          {onCancel && (
            <Button variant="ghost" size="sm" disabled={busy} onClick={onCancel}>
              {t.cancelOrder}
            </Button>
          )}
          {onComplete && (
            <Button size="sm" loading={busy} onClick={onComplete}>
              {t.markComplete}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
