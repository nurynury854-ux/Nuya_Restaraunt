"use client";

import { useEffect, useState } from "react";
import { CalendarOff, Plus, X } from "lucide-react";
import type { SerializedBranchClosure } from "@/lib/types";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, FieldWrapper } from "@/components/ui/Field";

function formatClosureDate(iso: string, locale: string): string {
  // Split on the date part directly rather than `new Date(iso)` — the
  // stored value is local midnight, and parsing an ISO string with no
  // timezone offset as UTC can roll it back a day in a negative-UTC-offset
  // browser.
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BranchClosures({ branchId }: { branchId: string }) {
  const { locale, dict } = useDictionary();
  const t = dict.adminSettings.closures;
  const dateLocale = locale === "zh" ? "zh-TW" : "en-US";
  const [closures, setClosures] = useState<SerializedBranchClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch(`/api/branches/${branchId}/closures`)
      .then((res) => res.json())
      .then((data: { closures: SerializedBranchClosure[] }) => setClosures(data.closures ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }

  useEffect(load, [branchId]);

  async function addClosure() {
    if (!date) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/branches/${branchId}/closures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.addError);
        return;
      }
      setDate("");
      setReason("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function removeClosure(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/closures/${id}`, { method: "DELETE" });
      load();
    } finally {
      setBusy(false);
    }
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
  const upcoming = closures.filter((c) => c.date.slice(0, 10) >= todayStr);

  return (
    <Card className="flex max-w-lg flex-col gap-3.5 p-5">
      <div className="flex items-center gap-2">
        <CalendarOff className="size-4 text-brand-500" />
        <h2 className="font-semibold text-ink-900">{t.heading}</h2>
      </div>
      <p className="text-xs text-ink-400">{t.description}</p>

      {!loading && upcoming.length === 0 && (
        <p className="text-sm text-ink-400">{t.noUpcoming}</p>
      )}

      {upcoming.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {upcoming.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-cream-50 px-3.5 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink-900">{formatClosureDate(c.date, dateLocale)}</p>
                {c.reason && <p className="truncate text-xs text-ink-500">{c.reason}</p>}
              </div>
              <button
                onClick={() => removeClosure(c.id)}
                disabled={busy}
                className="shrink-0 cursor-pointer text-ink-300 transition-colors hover:text-danger-500"
                aria-label={t.removeAria}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2.5 rounded-xl border border-dashed border-ink-200 p-3.5">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <FieldWrapper label={t.date}>
            <Input type="date" value={date} min={todayStr} onChange={(e) => setDate(e.target.value)} />
          </FieldWrapper>
          <FieldWrapper label={t.reasonOptional}>
            <Input
              placeholder={t.reasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FieldWrapper>
        </div>
        {error && <p className="text-xs text-danger-500">{error}</p>}
        <Button size="sm" loading={busy} disabled={!date} onClick={addClosure} className="self-start">
          <Plus className="size-4" />
          {t.addClosedDate}
        </Button>
      </div>
    </Card>
  );
}
