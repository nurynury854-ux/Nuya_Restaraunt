"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { PLATFORM_NAME } from "@/lib/constants";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { dict } = useDictionary();
  const t = dict.auth.resetPassword;
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(dict.auth.errors[data.code] ?? data.error ?? t.invalidToken);
        setLoading(false);
        return;
      }
      setDone(true);
      setTimeout(() => router.replace(`/${data.tenantSlug}/admin`), 1200);
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
        {done ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="size-10 text-success-500" strokeWidth={1.5} />
            <p className="text-sm text-ink-700">{t.success}</p>
          </div>
        ) : !token ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-danger-500">{t.invalidToken}</p>
            <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              {t.requestNewLink}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldWrapper label={t.newPassword} hint={t.passwordHint} required>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
                <Input
                  className="pl-9"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                  minLength={8}
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

      {!done && (
        <p className="mt-5 text-sm text-ink-500">
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            {dict.auth.forgotPassword.backToLogin}
          </Link>
        </p>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
