"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDictionary } from "@/components/i18n/LocaleProvider";

/**
 * The confirm step for an email-verification link. The redemption happens on
 * a POST from here rather than while this page renders, so link scanners and
 * previewers — which only ever issue GETs — can't spend the single-use token
 * before its owner arrives. See the route handler for the full reasoning.
 */
export function VerifyEmailConfirm({ token }: { token: string }) {
  const { dict } = useDictionary();
  const t = dict.auth.verifyEmail;
  const [state, setState] = useState<"idle" | "working" | "done" | "failed">(
    token ? "idle" : "failed"
  );
  const [tenantSlug, setTenantSlug] = useState("");
  const [error, setError] = useState(token ? "" : t.missingToken);

  async function handleVerify() {
    setState("working");
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(dict.auth.errors[data.code] ?? data.error ?? t.invalidToken);
        setState("failed");
        return;
      }
      setTenantSlug(data.tenantSlug);
      setState("done");
    } catch {
      setError(dict.common.networkError);
      setState("failed");
    }
  }

  if (state === "done") {
    return (
      <>
        <CheckCircle2 className="mb-3 size-12 text-success-500" strokeWidth={1.5} />
        <p className="mb-6 text-ink-700">{t.success}</p>
        <Link
          href={`/${tenantSlug}/admin`}
          className="inline-flex h-11 items-center rounded-xl bg-brand-500 px-6 text-sm font-medium text-white hover:bg-brand-600"
        >
          {t.continueToAdmin}
        </Link>
      </>
    );
  }

  if (state === "failed") {
    return (
      <>
        <XCircle className="mb-3 size-12 text-danger-500" strokeWidth={1.5} />
        <p className="text-ink-700">{error || t.invalidToken}</p>
      </>
    );
  }

  return (
    <>
      <MailCheck className="mb-3 size-12 text-brand-500" strokeWidth={1.5} />
      <p className="mb-6 max-w-sm text-ink-700">{t.confirmPrompt}</p>
      <Button size="lg" loading={state === "working"} onClick={handleVerify}>
        {state === "working" ? t.verifying : t.confirmButton}
      </Button>
    </>
  );
}
