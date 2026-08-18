"use client";

import { useState } from "react";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";

export function EmailVerifyBanner({ email }: { email: string }) {
  const { dict } = useDictionary();
  const t = dict.adminChrome.emailVerifyBanner;
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResend() {
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-gold-400/15 px-4 py-2 text-sm text-ink-700 sm:px-8">
      <span>{formatMessage(t.message, { email })}</span>
      <button
        type="button"
        onClick={handleResend}
        disabled={status === "sending" || status === "sent"}
        className="shrink-0 cursor-pointer font-medium text-brand-600 hover:text-brand-700 disabled:cursor-default disabled:text-ink-400"
      >
        {status === "sending" && t.sending}
        {status === "sent" && t.sent}
        {status === "error" && t.error}
        {status === "idle" && t.resend}
      </button>
    </div>
  );
}
