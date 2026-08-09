"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, Hash, Phone } from "lucide-react";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";

export default function OrderLookupPage() {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { dict } = useDictionary();
  const t = dict.checkout.lookup;
  const [orderNo, setOrderNo] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders/track/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, orderNo, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.notFoundError);
        setLoading(false);
        return;
      }
      router.push(`/${tenantSlug}/orders/${data.orderId}`);
    } catch {
      setError(dict.common.networkError);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mb-4">
        <LanguageSwitcher />
      </div>
      <div className="mb-6 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink-900">
          {t.heading}
        </h1>
        <p className="mt-1 text-sm text-ink-500">{t.subheading}</p>
      </div>

      <Card className="w-full p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldWrapper label={t.orderNumber} required>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
              <Input
                className="pl-9"
                placeholder={t.orderNumberPlaceholder}
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                autoFocus
                required
              />
            </div>
          </FieldWrapper>

          <FieldWrapper label={t.phoneNumber} required>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
              <Input
                className="pl-9"
                type="tel"
                placeholder={t.phoneNumberPlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </FieldWrapper>

          {error && <p className="text-sm text-danger-500">{error}</p>}

          <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
            <Search className="size-4" />
            {t.findMyOrder}
          </Button>
        </form>
      </Card>
    </div>
  );
}
