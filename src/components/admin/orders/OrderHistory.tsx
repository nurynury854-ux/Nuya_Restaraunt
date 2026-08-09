"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { SerializedOrder } from "@/lib/types";
import { DINING_METHODS, ORDER_STATUSES } from "@/lib/constants";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import { Card } from "@/components/ui/Card";
import { Input, Select, FieldWrapper } from "@/components/ui/Field";
import { OrderCard } from "@/components/admin/orders/OrderCard";

export function OrderHistory({ branchId }: { branchId: string }) {
  const { dict } = useDictionary();
  const t = dict.adminOrders.history;
  const [orderNo, setOrderNo] = useState("");
  const [phone, setPhone] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");
  const [diningMethod, setDiningMethod] = useState("");
  const [page, setPage] = useState(1);

  const [orders, setOrders] = useState<SerializedOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const requestIdRef = useRef(0);

  const load = useCallback(
    async (p: number) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError("");
      try {
        const qs = new URLSearchParams({ branchId, page: String(p) });
        if (orderNo) qs.set("orderNo", orderNo);
        if (phone) qs.set("phone", phone);
        if (dateFrom) qs.set("dateFrom", dateFrom);
        if (dateTo) qs.set("dateTo", dateTo);
        if (status) qs.set("status", status);
        if (diningMethod) qs.set("diningMethod", diningMethod);

        const res = await fetch(`/api/orders?${qs}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (requestId !== requestIdRef.current) return;
        setOrders(data.orders);
        setTotal(data.total);
        setPageSize(data.pageSize);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setError(t.loadError);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [branchId, orderNo, phone, dateFrom, dateTo, status, diningMethod, t.loadError]
  );

  // Any filter change resets to page 1 and reloads, debounced so free-text
  // fields don't fire a request per keystroke. Deferred via setTimeout (not
  // called synchronously in the effect body) to keep this compliant with the
  // same lint rule handled the same way in TenantTable.
  useEffect(() => {
    const timer = setTimeout(
      () => {
        setPage(1);
        load(1);
      },
      orderNo || phone ? 350 : 0
    );
    return () => clearTimeout(timer);
  }, [orderNo, phone, dateFrom, dateTo, status, diningMethod, load]);

  useEffect(() => {
    const timer = setTimeout(() => load(page), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FieldWrapper label={t.orderNo}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
              <Input
                className="pl-9"
                placeholder={t.orderNoPlaceholder}
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
              />
            </div>
          </FieldWrapper>
          <FieldWrapper label={t.customerPhone}>
            <Input
              placeholder={t.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FieldWrapper>
          <FieldWrapper label={t.status}>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">{t.allStatuses}</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {dict.constants.orderStatus[s]}
                </option>
              ))}
            </Select>
          </FieldWrapper>
          <FieldWrapper label={t.fromDate}>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </FieldWrapper>
          <FieldWrapper label={t.toDate}>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </FieldWrapper>
          <FieldWrapper label={t.diningMethod}>
            <Select value={diningMethod} onChange={(e) => setDiningMethod(e.target.value)}>
              <option value="">{t.allMethods}</option>
              {DINING_METHODS.map((m) => (
                <option key={m} value={m}>
                  {dict.constants.diningMethod[m]}
                </option>
              ))}
            </Select>
          </FieldWrapper>
        </div>
      </Card>

      {error && <p className="text-sm text-danger-500">{error}</p>}

      <p className="text-sm text-ink-400">
        {formatMessage(t.resultsFound, { total, plural: total === 1 ? "" : "s" })}
      </p>

      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
        {!loading && orders.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-ink-400 shadow-soft">
            {t.noResults}
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-ink-400">
            <Loader2 className="size-4 animate-spin" />
            {t.loading}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm text-ink-500">
            {formatMessage(t.pageOf, { page, totalPages })}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
