"use client";

import { useMemo, useRef, useState } from "react";
import { UtensilsCrossed, ShoppingBag, Bike } from "lucide-react";
import type { SerializedOrder } from "@/lib/types";
import { DINING_METHODS, type DiningMethod } from "@/lib/constants";
import { groupOrdersByDate } from "@/lib/orderGrouping";
import { usePolling } from "@/lib/hooks/usePolling";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import { OrderCard } from "@/components/admin/orders/OrderCard";

const METHOD_ICON: Record<DiningMethod, typeof UtensilsCrossed> = {
  DINE_IN: UtensilsCrossed,
  PICKUP: ShoppingBag,
  DELIVERY: Bike,
};

const POLL_INTERVAL_MS = 4000;

export function OrdersBoard({
  mode,
  branchId,
  initialOrders,
}: {
  mode: "pending" | "completed";
  branchId: string;
  initialOrders: SerializedOrder[];
}) {
  const { dict } = useDictionary();
  const t = dict.adminOrders.board;
  const [orders, setOrders] = useState(initialOrders);
  const [activeMethod, setActiveMethod] = useState<DiningMethod>("DINE_IN");
  const [busyId, setBusyId] = useState<string | null>(null);
  // IDs the acting admin just moved out of this board optimistically; ignore
  // them on the next poll or two so they don't briefly reappear before the DB
  // read catches up.
  const removedIdsRef = useRef<Set<string>>(new Set());

  usePolling(async () => {
    try {
      const res = await fetch(`/api/orders?branchId=${branchId}&bucket=${mode}`);
      if (!res.ok) return;
      const data: { orders: SerializedOrder[] } = await res.json();
      const fresh = (data.orders ?? []).filter((o) => !removedIdsRef.current.has(o.id));
      // Once the server no longer returns a removed id in *this* bucket, we can
      // stop suppressing it.
      const freshIds = new Set(fresh.map((o) => o.id));
      removedIdsRef.current.forEach((id) => {
        if (!freshIds.has(id)) removedIdsRef.current.delete(id);
      });
      setOrders(fresh);
    } catch {
      // ignore transient network errors
    }
  }, POLL_INTERVAL_MS);

  async function updateStatus(orderId: string, status: "COMPLETED" | "CANCELLED") {
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok && mode === "pending") {
        // Update immediately for the admin who took the action; other open
        // tabs/devices pick up the same change on their next poll.
        removedIdsRef.current.add(orderId);
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } finally {
      setBusyId(null);
    }
  }

  const methodOrders = useMemo(
    () => orders.filter((o) => o.diningMethod === activeMethod),
    [orders, activeMethod]
  );

  const groups = useMemo(
    () => groupOrdersByDate(methodOrders, mode === "pending" ? "oldest-first" : "newest-first"),
    [methodOrders, mode]
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {DINING_METHODS.map((method) => {
          const Icon = METHOD_ICON[method];
          const count = orders.filter((o) => o.diningMethod === method).length;
          return (
            <button
              key={method}
              onClick={() => setActiveMethod(method)}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeMethod === method
                  ? "bg-brand-500 text-white"
                  : "border border-ink-100 bg-white text-ink-600 hover:border-brand-300"
              }`}
            >
              <Icon className="size-4" />
              {dict.constants.diningMethod[method]}
              <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {groups.length === 0 && (
        <div className="rounded-2xl bg-white p-10 text-center text-ink-400 shadow-soft">
          {formatMessage(mode === "pending" ? t.noPendingOrders : t.noCompletedOrders, {
            method: dict.constants.diningMethod[activeMethod].toLowerCase(),
          })}
        </div>
      )}

      {groups.map((group) => (
        <div key={group.dateKey} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-ink-500">{group.label}</h3>
          <div className="flex flex-col gap-3">
            {group.orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                busy={busyId === order.id}
                onComplete={
                  mode === "pending" ? () => updateStatus(order.id, "COMPLETED") : undefined
                }
                onCancel={
                  mode === "pending" ? () => updateStatus(order.id, "CANCELLED") : undefined
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
