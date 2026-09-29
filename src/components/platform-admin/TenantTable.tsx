"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  ExternalLink,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Banknote,
} from "lucide-react";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { BillingState } from "@/lib/billing";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Textarea } from "@/components/ui/Field";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

interface PlatformTenant {
  id: string;
  slug: string;
  businessName: string;
  isActive: boolean;
  billingState: BillingState;
  siteLive: boolean;
  trialDaysLeft: number;
  paidDaysLeft: number | null;
  approvedAt: string | null;
  /** "YYYY-MM-DD", inclusive. Null = unpaid, or approved with no end date. */
  paidThrough: string | null;
  paymentReference: string | null;
  billingNote: string | null;
  createdAt: string;
  ownerEmail: string | null;
  branchCount: number;
  orderCount: number;
}

export function TenantTable() {
  const { dict, locale } = useDictionary();
  const t = dict.platformAdmin.table;
  const dateLocale = locale === "zh" ? "zh-TW" : "en-US";
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlatformTenant | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<PlatformTenant | null>(null);
  const [filter, setFilter] = useState<"all" | "unpaid">("all");
  const [unpaidCount, setUnpaidCount] = useState(0);

  // Guards against an older in-flight fetch (e.g. a stale page from before a
  // search term settled) overwriting a newer one that resolves first.
  const requestIdRef = useRef(0);

  const load = useCallback(async (q: string, p: number, f: "all" | "unpaid") => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q) params.set("q", q);
      if (f === "unpaid") params.set("filter", "unpaid");
      const res = await fetch(`/api/platform-admin/tenants?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (requestId !== requestIdRef.current) return;
      setTenants(data.tenants);
      setTotal(data.total);
      setUnpaidCount(data.unpaidCount);
      setPageSize(data.pageSize);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError(t.loadError);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [t.loadError]);

  // Debounced search: settles 350ms after typing stops, always resetting
  // back to page 1. The setTimeout defers the state updates to their own
  // task, outside the synchronous effect body (matching the pattern used by
  // usePolling elsewhere in this app), rather than triggering them inline.
  useEffect(() => {
    const timer = setTimeout(
      () => {
        setPage(1);
        load(query, 1, filter);
      },
      query ? 350 : 0
    );
    return () => clearTimeout(timer);
  }, [query, filter, load]);

  // Pagination: reload whenever the page changes. Also deferred via
  // setTimeout for the same reason. A redundant reload of the current page
  // right after the search effect above resets it to 1 is harmless — the
  // requestId guard in `load` ensures only the latest response is applied.
  useEffect(() => {
    const timer = setTimeout(() => load(query, page, filter), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function toggleActive(tenant: PlatformTenant) {
    setPendingToggleId(tenant.id);
    try {
      const res = await fetch(`/api/platform-admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tenant.isActive }),
      });
      if (!res.ok) throw new Error();
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, isActive: !t.isActive } : t))
      );
    } catch {
      setError(t.toggleError);
    } finally {
      setPendingToggleId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/platform-admin/tenants/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setDeleteTarget(null);
      load(query, page, filter);
    } catch {
      setError(t.deleteError);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1.5">
        {(["all", "unpaid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? "bg-ink-900 text-cream-50" : "bg-white text-ink-700 hover:bg-ink-100"
            }`}
          >
            {f === "all" ? t.filterAll : formatMessage(t.filterUnpaid, { count: unpaidCount })}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
          <Input
            className="pl-9"
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="shrink-0 text-sm text-ink-400">
          {formatMessage(t.tenantsCount, { total, plural: total === 1 ? "" : "s" })}
        </span>
      </div>

      {error && <p className="text-sm text-danger-500">{error}</p>}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs text-ink-400">
                <th className="px-4 py-3 font-medium">{t.business}</th>
                <th className="px-4 py-3 font-medium">{t.owner}</th>
                <th className="px-4 py-3 font-medium">{t.locations}</th>
                <th className="px-4 py-3 font-medium">{t.orders}</th>
                <th className="px-4 py-3 font-medium">{t.created}</th>
                <th className="px-4 py-3 font-medium">{t.billing}</th>
                <th className="px-4 py-3 font-medium">{t.active}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-ink-50 last:border-0 hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{t.businessName}</div>
                    <a
                      href={`/${t.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-ink-400 hover:text-brand-600"
                    >
                      /{t.slug}
                      <ExternalLink className="size-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{t.ownerEmail ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-600">{t.branchCount}</td>
                  <td className="px-4 py-3 text-ink-600">{t.orderCount}</td>
                  <td className="px-4 py-3 text-ink-500">
                    {new Date(t.createdAt).toLocaleDateString(dateLocale)}
                  </td>
                  <td className="px-4 py-3">
                    <BillingCell tenant={t} dict={dict} dateLocale={dateLocale} />
                    <button
                      onClick={() => setPaymentTarget(t)}
                      className="mt-1.5 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      {t.approvedAt ? (
                        <Banknote className="size-3.5" />
                      ) : (
                        <BadgeCheck className="size-3.5" />
                      )}
                      {t.approvedAt
                        ? dict.platformAdmin.table.recordPayment
                        : dict.platformAdmin.table.approve}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ToggleSwitch
                        checked={t.isActive}
                        disabled={pendingToggleId === t.id}
                        onChange={() => toggleActive(t)}
                      />
                      {!t.isActive && <Badge tone="danger">{dict.platformAdmin.table.suspended}</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(t)}
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-danger-500/10 hover:text-danger-600"
                      aria-label={formatMessage(dict.platformAdmin.table.deleteAria, { name: t.businessName })}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && tenants.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-ink-400">
                    {t.noTenants}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {loading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-ink-400">
            <Loader2 className="size-4 animate-spin" />
            {t.loading}
          </div>
        )}
      </Card>

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

      <AnimatePresence>
        {paymentTarget && (
          <PaymentModal
            key={paymentTarget.id}
            tenant={paymentTarget}
            dict={dict}
            dateLocale={dateLocale}
            onCancel={() => setPaymentTarget(null)}
            onSaved={() => {
              setPaymentTarget(null);
              load(query, page, filter);
            }}
          />
        )}
        {deleteTarget && (
          <DeleteConfirmModal
            tenant={deleteTarget}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={confirmDelete}
            dict={dict}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DeleteConfirmModal({
  tenant,
  onCancel,
  onConfirm,
  dict,
}: {
  tenant: PlatformTenant;
  onCancel: () => void;
  onConfirm: () => void;
  dict: Dictionary;
}) {
  const t = dict.platformAdmin.table.deleteModal;
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const canDelete = typed.trim() === tenant.slug;

  async function handleConfirm() {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-ink-900/40"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, y: 10, x: "-50%" }}
        animate={{ opacity: 1, y: 0, x: "-50%" }}
        exit={{ opacity: 0, y: 10, x: "-50%" }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-y-1/2 px-4"
      >
        <Card className="p-5">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-danger-600">
            {formatMessage(t.title, { name: tenant.businessName })}
          </h3>
          <p className="mt-2 text-sm text-ink-500">{t.description}</p>
          <p className="mt-3 text-sm text-ink-700">
            {t.typeToConfirmPrefix}
            <span className="font-mono font-semibold">{tenant.slug}</span>
            {t.typeToConfirmSuffix}
          </p>
          <Input
            className="mt-2"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>
              {t.cancel}
            </Button>
            <Button
              variant="danger"
              disabled={!canDelete}
              loading={deleting}
              onClick={handleConfirm}
            >
              {t.deletePermanently}
            </Button>
          </div>
        </Card>
      </motion.div>
    </>
  );
}

const BILLING_TONE = {
  TRIAL: "gold",
  TRIAL_ENDED: "danger",
  PAID: "success",
  EXPIRED: "danger",
} as const satisfies Record<BillingState, "gold" | "success" | "danger">;

/** Plain calendar dates ("YYYY-MM-DD") are formatted in UTC so they can't
 * shift by a day in the viewer's own timezone. */
function formatYmd(ymd: string, dateLocale: string): string {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString(dateLocale, { timeZone: "UTC" });
}

function BillingCell({
  tenant,
  dict,
  dateLocale,
}: {
  tenant: PlatformTenant;
  dict: Dictionary;
  dateLocale: string;
}) {
  const t = dict.platformAdmin.table;

  let detail: string | null = null;
  if (tenant.billingState === "TRIAL") {
    detail =
      tenant.trialDaysLeft <= 1 ? t.lastDay : formatMessage(t.daysLeft, { days: tenant.trialDaysLeft });
  } else if (tenant.billingState === "PAID" || tenant.billingState === "EXPIRED") {
    detail = tenant.paidThrough
      ? formatMessage(t.through, { date: formatYmd(tenant.paidThrough, dateLocale) })
      : t.noEndDate;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Badge tone={BILLING_TONE[tenant.billingState]}>{t.billingState[tenant.billingState]}</Badge>
        {/* A tenant can be suspended by us and still be paid up, so "offline"
            is its own signal rather than something inferable from the
            billing badge alone. */}
        {!tenant.siteLive && <Badge tone="danger">{t.offline}</Badge>}
      </div>
      {detail && <span className="text-xs text-ink-500">{detail}</span>}
      {tenant.paymentReference && (
        <span className="font-mono text-xs text-ink-400">{tenant.paymentReference}</span>
      )}
    </div>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toYmd(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function fromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function addDays(ymd: string, days: number): string {
  const date = fromYmd(ymd);
  date.setUTCDate(date.getUTCDate() + days);
  return toYmd(date);
}

/** Adds calendar months, clamping to the month's end (Jan 31 + 1 → Feb 28). */
function addMonths(ymd: string, months: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  return toYmd(new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDay))));
}

function localTodayYmd(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function PaymentModal({
  tenant,
  dict,
  dateLocale,
  onCancel,
  onSaved,
}: {
  tenant: PlatformTenant;
  dict: Dictionary;
  dateLocale: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = dict.platformAdmin.table.paymentModal;
  const isApproved = Boolean(tenant.approvedAt);
  const [paidThrough, setPaidThrough] = useState(tenant.paidThrough ?? "");
  const [noEndDate, setNoEndDate] = useState(isApproved && !tenant.paidThrough);
  const [note, setNote] = useState(tenant.billingNote ?? "");
  const [saving, setSaving] = useState<"save" | "revoke" | null>(null);
  const [error, setError] = useState("");

  // Quick picks extend a still-running paid period from where it ends, so a
  // renewal doesn't throw away days already paid for; otherwise they start
  // today. A month runs up to the day before the same date next month.
  const today = localTodayYmd();
  const extendsCurrent = tenant.paidThrough !== null && tenant.paidThrough >= today;
  const periodStart = extendsCurrent ? addDays(tenant.paidThrough!, 1) : today;
  const quickPicks = [
    { label: t.plusOneMonth, months: 1 },
    { label: t.plusThreeMonths, months: 3 },
    { label: t.plusOneYear, months: 12 },
  ];

  async function patch(body: object, kind: "save" | "revoke") {
    setSaving(kind);
    setError("");
    try {
      const res = await fetch(`/api/platform-admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t.error);
        return;
      }
      onSaved();
    } catch {
      setError(t.error);
    } finally {
      setSaving(null);
    }
  }

  function save() {
    if (!noEndDate && !paidThrough) {
      setError(t.missingDate);
      return;
    }
    patch(
      {
        payment: {
          paidThrough: noEndDate ? null : paidThrough,
          billingNote: note.trim() || null,
        },
      },
      "save"
    );
  }

  function revoke() {
    if (!window.confirm(t.revokeConfirm)) return;
    patch({ revokeApproval: true }, "revoke");
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-ink-900/40"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, y: 10, x: "-50%" }}
        animate={{ opacity: 1, y: 0, x: "-50%" }}
        exit={{ opacity: 0, y: 10, x: "-50%" }}
        className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-md -translate-y-1/2 overflow-y-auto px-4"
      >
        <Card className="flex flex-col gap-4 p-5">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-ink-900">
              {formatMessage(isApproved ? t.renewTitle : t.approveTitle, {
                name: tenant.businessName,
              })}
            </h3>
            <p className="mt-1 text-sm text-ink-500">{t.checkHint}</p>
          </div>

          {/* The two things to compare against the bank transfer note, big. */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-cream-50 px-3.5 py-2.5">
              <p className="text-xs text-ink-500">{t.businessName}</p>
              <p className="mt-0.5 text-base font-semibold break-words text-ink-900">
                {tenant.businessName}
              </p>
            </div>
            <div className="rounded-xl bg-cream-50 px-3.5 py-2.5">
              <p className="text-xs text-ink-500">{t.reference}</p>
              {tenant.paymentReference ? (
                <p className="mt-0.5 font-mono text-base font-semibold tracking-wide text-ink-900">
                  {tenant.paymentReference}
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-ink-400">{t.noReference}</p>
              )}
            </div>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-ink-500">{t.owner}</dt>
            <dd className="truncate text-ink-900">{tenant.ownerEmail ?? "—"}</dd>
            <dt className="text-ink-500">{t.signedUp}</dt>
            <dd className="text-ink-900">
              {new Date(tenant.createdAt).toLocaleDateString(dateLocale)} · /{tenant.slug}
            </dd>
          </dl>

          <div className="flex flex-col gap-1.5">
            <FieldWrapper label={t.paidThrough} hint={t.paidThroughHint}>
              <Input
                type="date"
                value={paidThrough}
                disabled={noEndDate}
                onChange={(e) => setPaidThrough(e.target.value)}
              />
            </FieldWrapper>
            {!noEndDate && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-ink-500">{t.quickPick}</span>
                {quickPicks.map((pick) => (
                  <button
                    key={pick.months}
                    type="button"
                    onClick={() => setPaidThrough(addDays(addMonths(periodStart, pick.months), -1))}
                    className="cursor-pointer rounded-full border border-ink-100 bg-white px-2.5 py-1 font-medium text-ink-700 hover:border-brand-300 hover:text-brand-600"
                  >
                    {pick.label}
                  </button>
                ))}
              </div>
            )}
            <label className="mt-1 flex cursor-pointer items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={noEndDate}
                onChange={(e) => setNoEndDate(e.target.checked)}
                className="size-4 accent-brand-500"
              />
              {t.noEndDate}
            </label>
          </div>

          <FieldWrapper label={t.note} hint={t.noteHint}>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.notePlaceholder}
              maxLength={500}
              className="min-h-20"
            />
          </FieldWrapper>

          {error && <p className="text-sm text-danger-500">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2">
            {isApproved ? (
              <button
                type="button"
                onClick={revoke}
                disabled={saving !== null}
                className="cursor-pointer text-sm font-medium text-danger-500 hover:text-danger-600 disabled:opacity-50"
              >
                {t.revoke}
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onCancel}>
                {t.cancel}
              </Button>
              <Button loading={saving === "save"} disabled={saving !== null} onClick={save}>
                {isApproved ? t.save : t.approve}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  );
}
