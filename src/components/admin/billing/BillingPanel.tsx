"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import { LOCALE_HTML_LANG } from "@/lib/i18n/locale";
import { PLATFORM_NAME } from "@/lib/constants";
import type { BillingState } from "@/lib/billing";
import { Badge } from "@/components/ui/Badge";

export interface BillingView {
  state: BillingState;
  /** Whether the storefront is currently open — the same answer the paywall gives. */
  siteLive: boolean;
  trialDaysLeft: number;
  /** "YYYY-MM-DD" — the last paid day, or null for none / no end date. */
  paidThrough: string | null;
  businessName: string;
  paymentReference: string;
  /** Free text from the PAYMENT_INSTRUCTIONS env var (bank, account, amount). */
  paymentInstructions: string | null;
}

const STATE_TONE = {
  TRIAL: "gold",
  TRIAL_ENDED: "danger",
  PAID: "success",
  EXPIRED: "danger",
} as const satisfies Record<BillingState, "gold" | "success" | "danger">;

const STATE_KEY = {
  TRIAL: "trial",
  TRIAL_ENDED: "trialEnded",
  PAID: "paid",
  EXPIRED: "expired",
} as const satisfies Record<BillingState, string>;

export function BillingPanel({ view }: { view: BillingView }) {
  const { dict, locale } = useDictionary();
  const t = dict.billing;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-ink-500">{t.status.label}</span>
            <Badge tone={STATE_TONE[view.state]}>{t.status[STATE_KEY[view.state]]}</Badge>
          </div>
          <Badge tone={view.siteLive ? "success" : "danger"}>
            {view.siteLive ? t.siteLive : t.siteOffline}
          </Badge>
        </div>

        <p className="text-sm text-ink-700">{explain(view, t, locale)}</p>

        {!view.siteLive && <p className="text-sm text-ink-500">{t.adminStillOpen}</p>}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold text-ink-900">{t.howToPay.heading}</h2>
        <p className="text-sm text-ink-700">{t.howToPay.intro}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <CopyField label={t.howToPay.reference} value={view.paymentReference} mono />
          <CopyField label={t.howToPay.businessName} value={view.businessName} />
        </div>

        <div className="rounded-xl bg-cream-50 px-4 py-3">
          <p className="text-xs font-medium text-ink-500">{t.howToPay.transferDetails}</p>
          <p className="mt-1 text-sm whitespace-pre-line text-ink-900">
            {view.paymentInstructions ?? t.howToPay.noInstructions}
          </p>
        </div>

        <p className="text-sm text-ink-500">{t.howToPay.afterPaying}</p>
      </div>

      <p className="px-1 text-xs text-ink-400">
        {formatMessage(t.subheading, { platform: PLATFORM_NAME })}
      </p>
    </div>
  );
}

function CopyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const { dict } = useDictionary();
  const t = dict.billing.howToPay;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the value
      // is on screen to copy by hand either way.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-ink-500">{label}</p>
        <p
          className={`truncate text-base font-semibold text-ink-900 ${mono ? "font-mono tracking-wide" : ""}`}
        >
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? t.copied : t.copy}
      </button>
    </div>
  );
}

/** The one line telling a tenant what their status means for their site. */
function explain(
  view: BillingView,
  t: ReturnType<typeof useDictionary>["dict"]["billing"],
  locale: keyof typeof LOCALE_HTML_LANG
): string {
  switch (view.state) {
    case "TRIAL":
      return view.trialDaysLeft <= 1
        ? t.state.trialLastDay
        : formatMessage(t.state.trial, { days: view.trialDaysLeft });
    case "TRIAL_ENDED":
      return t.state.trialEnded;
    case "PAID":
      return view.paidThrough
        ? formatMessage(t.state.paidThrough, { date: formatDate(view.paidThrough, locale) })
        : t.state.paidNoEnd;
    case "EXPIRED":
      return formatMessage(t.state.expired, { date: formatDate(view.paidThrough, locale) });
  }
}

function formatDate(ymd: string | null, locale: keyof typeof LOCALE_HTML_LANG): string {
  if (!ymd) return "—";
  // A plain calendar date — format it in UTC so it can't shift a day in the
  // viewer's own timezone.
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString(LOCALE_HTML_LANG[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
