"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Card } from "@/components/ui/Card";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function PlatformAdminLoginPage() {
  const router = useRouter();
  const { dict } = useDictionary();
  const t = dict.platformAdmin.login;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/platform-admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(dict.auth.errors[data.code] ?? data.error ?? t.loginFailed);
        setLoading(false);
        return;
      }
      router.replace("/platform-admin");
    } catch {
      setError(dict.common.networkError);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <LanguageSwitcher className="mb-6" />
      <div className="mb-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-1.5 text-ink-900">
          <ShieldCheck className="size-5" />
          <span className="font-[family-name:var(--font-display)] text-2xl font-bold">
            {t.title}
          </span>
        </div>
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

          {error && <p className="text-sm text-danger-500">{error}</p>}

          <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
            {t.logIn}
          </Button>
        </form>
      </Card>
    </div>
  );
}
