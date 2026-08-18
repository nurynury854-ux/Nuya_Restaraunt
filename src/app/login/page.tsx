"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { PLATFORM_NAME } from "@/lib/constants";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dict } = useDictionary();
  const t = dict.auth.login;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.loginFailed);
        setLoading(false);
        return;
      }
      const next = searchParams.get("next") || `/${data.tenantSlug}/admin`;
      router.replace(next);
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
          <FieldWrapper label={t.password} required>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
              <Input
                className="pl-9"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </FieldWrapper>

          <Link
            href="/forgot-password"
            className="-mt-2 self-end text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            {t.forgotPassword}
          </Link>

          {error && <p className="text-sm text-danger-500">{error}</p>}

          <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
            {t.submit}
          </Button>
        </form>
      </Card>

      <p className="mt-5 text-sm text-ink-500">
        {t.noSiteYet}{" "}
        <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
          {t.createOne}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
