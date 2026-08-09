import Link from "next/link";
import { ArrowRight, UtensilsCrossed, Clock3, ImageIcon, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { PLATFORM_NAME } from "@/lib/constants";

export default async function MarketingHomePage() {
  const { dict } = await getServerDictionary();
  const m = dict.marketing;

  const FEATURES = [
    { icon: UtensilsCrossed, ...m.features.menu },
    { icon: Store, ...m.features.locations },
    { icon: Clock3, ...m.features.liveOrders },
    { icon: ImageIcon, ...m.features.branding },
  ];

  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <span className="font-[family-name:var(--font-display)] text-xl font-bold text-ink-900">
          {PLATFORM_NAME}
        </span>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="text-sm font-medium text-ink-600 transition-colors hover:text-brand-600"
          >
            {m.logIn}
          </Link>
          <Link href="/signup">
            <Button size="sm">{m.getStarted}</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-5 py-16 text-center sm:py-24">
        <span className="inline-flex items-center rounded-full bg-brand-100 px-3.5 py-1 text-xs font-semibold tracking-wide text-brand-700">
          {m.eyebrow}
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-bold leading-tight text-ink-900 sm:text-5xl">
          {m.heading}
        </h1>
        <p className="mt-4 max-w-xl text-base text-ink-500 sm:text-lg">{m.subheading}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" fullWidth>
              {m.createYourSite}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" fullWidth>
              {m.alreadyHaveSite}
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="flex items-start gap-4 p-6">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink-900">{feature.title}</h3>
                  <p className="mt-1 text-sm text-ink-500">{feature.body}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
