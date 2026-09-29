"use client";

import Link from "next/link";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import type { SubscriptionNotice } from "@/lib/billing";

/**
 * The nudge that carries a tenant from "my site works" to "I should pay for
 * this". Rendered on the admin landing page in the same slot as the email
 * verification banner.
 *
 * Deliberately quiet most of the time — a banner shown every day stops being
 * read by the time it matters. It appears when a trial or paid period is
 * about to run out, and stays up once the site is offline. Which notice to
 * show is decided server-side by `subscriptionNoticeFor` in src/lib/billing.ts
 * — it can't live in this file, since a "use client" module's exports can't
 * be called from a server component.
 */
export function SubscriptionBanner({
  notice,
  daysLeft,
  tenantSlug,
}: {
  notice: SubscriptionNotice;
  daysLeft: number;
  tenantSlug: string;
}) {
  const { dict } = useDictionary();
  const t = dict.billing.banner;

  const message = {
    TRIAL_ENDING:
      daysLeft <= 1 ? t.trialEndingToday : formatMessage(t.trialEnding, { days: daysLeft }),
    TRIAL_ENDED: t.trialEnded,
    PAID_ENDING:
      daysLeft <= 1 ? t.paidEndingToday : formatMessage(t.paidEnding, { days: daysLeft }),
    EXPIRED: t.expired,
  }[notice];

  // A site that's already offline is a stronger signal than time running
  // out, and should read that way.
  const urgent = notice === "TRIAL_ENDED" || notice === "EXPIRED";

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm text-ink-700 sm:px-8 ${
        urgent ? "bg-danger-500/10" : "bg-gold-400/15"
      }`}
    >
      <span>{message}</span>
      <Link
        href={`/${tenantSlug}/admin/billing`}
        className="shrink-0 font-medium text-brand-600 hover:text-brand-700"
      >
        {t.action}
      </Link>
    </div>
  );
}
