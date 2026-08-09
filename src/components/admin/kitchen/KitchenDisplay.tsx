"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { SerializedOrder } from "@/lib/types";
import { usePolling } from "@/lib/hooks/usePolling";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/getDictionary";

const POLL_INTERVAL_MS = 4000;

export function KitchenDisplay({
  tenantSlug,
  branchId,
  branchName,
}: {
  tenantSlug: string;
  branchId: string;
  branchName: string;
}) {
  const { dict } = useDictionary();
  const t = dict.adminKitchen.display;
  const [orders, setOrders] = useState<SerializedOrder[]>([]);
  // "Now", as of the last poll — read from state rather than calling
  // Date.now() during render, which React treats as an impure read.
  // Tickets only ever render once the first poll has populated `orders`,
  // so this and `orders` are always set together and never out of sync.
  const [now, setNow] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  usePolling(async () => {
    try {
      const res = await fetch(`/api/orders?branchId=${branchId}&bucket=pending`);
      if (!res.ok) return;
      const data: { orders: SerializedOrder[] } = await res.json();
      setOrders(data.orders ?? []);
      setNow(Date.now());
    } catch {
      // ignore transient network errors — the next poll will retry
    }
  }, POLL_INTERVAL_MS);

  const sorted = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  async function complete(orderId: string) {
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-900 text-cream-50">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-lg font-bold">{branchName}</p>
          <p className="text-sm text-white/50">
            {formatMessage(t.subtitle, { count: sorted.length })}
          </p>
        </div>
        <Link
          href={`/${tenantSlug}/admin/${branchId}/orders/pending`}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
          {t.exit}
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {sorted.length === 0 ? (
          <div className="flex h-full items-center justify-center text-lg text-white/40">
            {t.noPendingOrders}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((order) => (
              <KitchenTicket
                key={order.id}
                order={order}
                now={now}
                busy={busyId === order.id}
                onComplete={() => complete(order.id)}
                dict={dict}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KitchenTicket({
  order,
  now,
  busy,
  onComplete,
  dict,
}: {
  order: SerializedOrder;
  now: number;
  busy: boolean;
  onComplete: () => void;
  dict: Dictionary;
}) {
  const t = dict.adminKitchen.display;
  const elapsedMin = Math.max(0, Math.floor((now - new Date(order.createdAt).getTime()) / 60000));
  const urgency = elapsedMin >= 20 ? "urgent" : elapsedMin >= 10 ? "warning" : "normal";

  const ringClass = {
    normal: "border-white/10",
    warning: "border-gold-400/70",
    urgent: "border-danger-500",
  }[urgency];
  const badgeClass = {
    normal: "bg-white/10 text-white/70",
    warning: "bg-gold-400/20 text-gold-400",
    urgent: "bg-danger-500/20 text-danger-500",
  }[urgency];

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border-2 bg-white/5 p-4 ${ringClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xl font-bold">{order.orderNo}</p>
          <p className="text-sm text-white/60">
            {dict.constants.diningMethod[order.diningMethod as keyof typeof dict.constants.diningMethod]}
            {order.tableNumber && formatMessage(t.tableSuffix, { tableNumber: order.tableNumber })}
            {order.timeSlot && ` · ${order.timeSlot.label}`}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
          {elapsedMin}m
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {order.items.map((item) => (
          <div key={item.id}>
            <p className="text-lg font-semibold leading-tight">
              <span className="text-brand-400">{item.quantity}x</span> {item.nameSnapshot}
            </p>
            {item.modifiers.length > 0 && (
              <p className="pl-5 text-sm text-white/60">
                {item.modifiers.map((m) => m.nameSnapshot).join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>

      {order.notes && (
        <p className="rounded-lg bg-gold-400/10 px-3 py-2 text-sm font-medium text-gold-400">
          {order.notes}
        </p>
      )}

      <button
        type="button"
        onClick={onComplete}
        disabled={busy}
        className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-success-500 py-3 text-base font-semibold text-white transition-colors hover:bg-success-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "..." : t.markComplete}
      </button>
    </div>
  );
}
