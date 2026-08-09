"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ExternalLink, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

interface PlatformTenant {
  id: string;
  slug: string;
  businessName: string;
  isActive: boolean;
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

  // Guards against an older in-flight fetch (e.g. a stale page from before a
  // search term settled) overwriting a newer one that resolves first.
  const requestIdRef = useRef(0);

  const load = useCallback(async (q: string, p: number) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q) params.set("q", q);
      const res = await fetch(`/api/platform-admin/tenants?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (requestId !== requestIdRef.current) return;
      setTenants(data.tenants);
      setTotal(data.total);
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
        load(query, 1);
      },
      query ? 350 : 0
    );
    return () => clearTimeout(timer);
  }, [query, load]);

  // Pagination: reload whenever the page changes. Also deferred via
  // setTimeout for the same reason. A redundant reload of the current page
  // right after the search effect above resets it to 1 is harmless — the
  // requestId guard in `load` ensures only the latest response is applied.
  useEffect(() => {
    const timer = setTimeout(() => load(query, page), 0);
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
      load(query, page);
    } catch {
      setError(t.deleteError);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4">
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
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-400">
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
