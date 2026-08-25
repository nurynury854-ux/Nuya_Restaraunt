"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { PLATFORM_NAME } from "@/lib/constants";

export default function ForgotPasswordPage() {
  const { dict } = useDictionary();
  const t = dict.auth.forgotPassword;
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [mailDeliverable, setMailDeliverable] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(dict.auth.errors[data.code] ?? data.error ?? dict.common.somethingWentWrong);
        setLoading(false);
        return;
      }
      setMailDeliverable(data.mailDeliverable !== false);
      setSent(true);
    } catch {
      setError(dict.common.networkError);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mb-4 flex justify-center">
        <LanguageSwitcher />
      </div>
      <div className="mb-6 text-center">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink-900"
        >
          {PLATFORM_NAME}
        </Link>
        <p className="mt-1 text-sm text-ink-500">{t.subtitle}</p>
      </div>

      <Card className="w-full max-w-sm p-6">
        {sent ? (
          <div className="flex flex-col items-center gap-3 text-center">
            {mailDeliverable ? (
              <>
                <CheckCircle2 className="size-10 text-success-500" strokeWidth={1.5} />
                <p className="text-sm text-ink-700">{t.genericSuccess}</p>
              </>
            ) : (
              <>
                <AlertTriangle className="size-10 text-gold-400" strokeWidth={1.5} />
                <p className="text-sm text-ink-700">{t.mailNotConfigured}</p>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldWrapper label={t.email} required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
                <Input
                  className="pl-9"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </FieldWrapper>

            {error && <p className="text-sm text-danger-500">{error}</p>}

            <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
              {t.submit}
            </Button>
          </form>
        )}
      </Card>

      <p className="mt-5 text-sm text-ink-500">
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          {t.backToLogin}
        </Link>
      </p>
    </div>
  );
}
