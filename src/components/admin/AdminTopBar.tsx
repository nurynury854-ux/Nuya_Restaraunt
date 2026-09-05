"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Copy, LogOut } from "lucide-react";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export function AdminTopBar({
  tenantSlug,
  businessName,
  logoUrl,
  email,
  siteUrl,
  branchName,
}: {
  tenantSlug: string;
  businessName: string;
  logoUrl?: string | null;
  email: string;
  /** The tenant's own ordering-site URL (`{origin}/{tenantSlug}`), for the copy-link button. */
  siteUrl: string;
  branchName?: string;
}) {
  const router = useRouter();
  const { dict } = useDictionary();
  const t = dict.adminChrome.topBar;

  const [copied, setCopied] = useState(false);

  const siteUrlDisplay = siteUrl.replace(/^https?:\/\//, "");

  async function handleCopySiteUrl() {
    await navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-ink-100 bg-white/70 px-5 py-3 backdrop-blur sm:px-8">
      <Link href={`/${tenantSlug}/admin`} className="flex items-center gap-2.5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={businessName} className="size-7 rounded-lg object-cover" />
        ) : null}
        <span className="font-[family-name:var(--font-display)] text-base font-bold text-ink-900">
          {businessName}
        </span>
        {branchName && (
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
            {branchName}
          </span>
        )}
      </Link>
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopySiteUrl}
          title={t.copySiteUrl}
          className="hidden max-w-[220px] cursor-pointer items-center gap-1.5 rounded-lg border border-ink-100 bg-white px-2.5 py-1 text-xs text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-600 sm:flex"
        >
          <span className="truncate">{siteUrlDisplay}</span>
          {copied ? (
            <Check className="size-3.5 shrink-0 text-success-600" />
          ) : (
            <Copy className="size-3.5 shrink-0" />
          )}
        </button>
        <span className="hidden text-xs text-ink-400 sm:inline">{email}</span>
        <LanguageSwitcher />
        <button
          onClick={handleLogout}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-ink-500 transition-colors hover:bg-danger-500/10 hover:text-danger-600"
        >
          <LogOut className="size-3.5" />
          {t.logOut}
        </button>
      </div>
    </header>
  );
}
