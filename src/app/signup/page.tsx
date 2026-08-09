"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Mail, Lock, Store, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { PLATFORM_NAME } from "@/lib/constants";
import { slugify } from "@/lib/reservedSlugs";

type SlugStatus = "idle" | "checking" | "available" | "unavailable";

export default function SignupPage() {
  const router = useRouter();
  const { dict } = useDictionary();
  const t = dict.auth.signup;

  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugReason, setSlugReason] = useState("");
  const [branchName, setBranchName] = useState("Main Location");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-derive the URL slug from the business name until the user edits it
  // directly. Deferred so the setState isn't synchronous within the effect body.
  useEffect(() => {
    if (slugEdited) return;
    const id = setTimeout(() => setSlug(slugify(businessName)), 0);
    return () => clearTimeout(id);
  }, [businessName, slugEdited]);

  useEffect(() => {
    // The whole body is deferred one tick for the same reason — both
    // setSlugStatus("idle") and setSlugStatus("checking") below would
    // otherwise run synchronously within the effect. Cleanup has to clear
    // both this scheduling timeout and the debounce timer it may have set.
    const scheduleId = setTimeout(() => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
      if (!slug || slug.length < 3) {
        setSlugStatus("idle");
        return;
      }
      setSlugStatus("checking");
      checkTimer.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/auth/check-slug", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          });
          const data = await res.json();
          setSlugStatus(data.available ? "available" : "unavailable");
          setSlugReason(data.reason ?? "");
        } catch {
          setSlugStatus("idle");
        }
      }, 400);
    }, 0);
    return () => {
      clearTimeout(scheduleId);
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, businessName, slug, branchName, timezone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.genericError);
        setLoading(false);
        return;
      }
      router.push(`/${data.tenantSlug}/admin`);
    } catch {
      setError(dict.common.networkError);
      setLoading(false);
    }
  }

  const canSubmit =
    businessName.trim() &&
    branchName.trim() &&
    email.trim() &&
    password.length >= 8 &&
    slugStatus === "available";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-14">
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

      <Card className="w-full max-w-md p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldWrapper label={t.businessName} required>
            <div className="relative">
              <Store className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
              <Input
                className="pl-9"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={t.businessNamePlaceholder}
                autoFocus
                required
              />
            </div>
          </FieldWrapper>

          <FieldWrapper
            label={t.siteUrl}
            required
            hint={slugStatus === "unavailable" ? undefined : t.siteUrlHint}
            error={slugStatus === "unavailable" ? slugReason || t.siteUrlTaken : undefined}
          >
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-sm text-ink-400">yourplatform.com/</span>
              <div className="relative flex-1">
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setSlug(slugify(e.target.value));
                  }}
                  error={slugStatus === "unavailable"}
                  required
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  {slugStatus === "checking" && (
                    <Loader2 className="size-4 animate-spin text-ink-300" />
                  )}
                  {slugStatus === "available" && (
                    <Check className="size-4 text-success-500" />
                  )}
                  {slugStatus === "unavailable" && <X className="size-4 text-danger-500" />}
                </span>
              </div>
            </div>
          </FieldWrapper>

          <FieldWrapper label={t.firstLocationName} required hint={t.firstLocationHint}>
            <Input
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder={t.firstLocationPlaceholder}
              required
            />
          </FieldWrapper>

          <div className="my-1 border-t border-ink-100" />

          <FieldWrapper label={t.email} required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
              <Input
                className="pl-9"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </FieldWrapper>

          <FieldWrapper label={t.password} required hint={t.passwordHint}>
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

          <Button type="submit" fullWidth size="lg" loading={loading} disabled={!canSubmit} className="mt-2">
            {t.submit}
          </Button>
        </form>
      </Card>

      <p className="mt-5 text-sm text-ink-500">
        {t.alreadyHaveSite}{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          {t.logIn}
        </Link>
      </p>
    </div>
  );
}
