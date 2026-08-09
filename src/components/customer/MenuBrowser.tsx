"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CalendarOff } from "lucide-react";
import type { MenuCategory } from "@/generated/prisma/client";
import { useOrderStore } from "@/lib/store/orderStore";
import { usePolling } from "@/lib/hooks/usePolling";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { formatMessage } from "@/lib/i18n/format";
import { MenuItemRow, type MenuItemWithModifiers } from "@/components/customer/MenuItemRow";
import { CartWidget } from "@/components/customer/cart/CartWidget";

type CategoryWithItems = MenuCategory & { items: MenuItemWithModifiers[] };

const MENU_POLL_INTERVAL_MS = 8000;

export function MenuBrowser({
  tenantSlug,
  categories: initialCategories,
}: {
  tenantSlug: string;
  categories: CategoryWithItems[];
}) {
  const router = useRouter();
  const branchName = useOrderStore((s) => s.branchName);
  const diningMethod = useOrderStore((s) => s.diningMethod);
  const branchId = useOrderStore((s) => s.branchId);
  const { dict } = useDictionary();
  const t = dict.customer.menu;

  const [categories, setCategories] = useState(initialCategories);
  const [ready, setReady] = useState(false);
  const [activeCategory, setActiveCategory] = useState(initialCategories[0]?.id ?? "");
  const [closedToday, setClosedToday] = useState(false);
  const [closedReason, setClosedReason] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  function refreshMenu() {
    if (!branchId) return;
    fetch(`/api/menu/public?tenant=${tenantSlug}&branchId=${branchId}`)
      .then((res) => res.json())
      .then(
        (data: {
          categories: CategoryWithItems[];
          closedToday: boolean;
          closedReason: string | null;
        }) => {
          setCategories(data.categories);
          setClosedToday(data.closedToday);
          setClosedReason(data.closedReason);
        }
      )
      .catch(() => null);
  }

  // Menu availability toggles (and closed-today status) from the admin
  // backend show up here automatically: re-read the public menu every few
  // seconds so a change reflects without the customer refreshing.
  usePolling(refreshMenu, MENU_POLL_INTERVAL_MS);

  useEffect(() => {
    // See useCheckoutGuard for why rehydration is triggered manually here
    // instead of relying on the pre-rehydration selector values above.
    useOrderStore.persist.rehydrate();
    const state = useOrderStore.getState();
    if (state.tenantSlug !== tenantSlug || !state.branchId || !state.diningMethod) {
      router.replace(`/${tenantSlug}`);
      return;
    }
    // Deferred so the setState isn't synchronous within the effect body.
    const id = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(id);
  }, [router, tenantSlug]);

  useEffect(() => {
    if (ready) refreshMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveCategory(visible[0].target.id.replace("cat-", ""));
        }
      },
      { rootMargin: "-140px 0px -60% 0px", threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [ready, categories]);

  function scrollToCategory(id: string) {
    const el = sectionRefs.current[id];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 116;
      window.scrollTo({ top, behavior: "smooth" });
      setActiveCategory(id);
    }
  }

  const methodLabel = diningMethod ? dict.constants.diningMethod[diningMethod] : "";

  const totalItemCount = useMemo(
    () => categories.reduce((sum, c) => sum + c.items.length, 0),
    [categories]
  );

  if (!ready) {
    return <div className="flex flex-1 items-center justify-center text-ink-400">{dict.common.loading}</div>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => router.push(`/${tenantSlug}`)}
            className="flex cursor-pointer items-center gap-1 text-sm text-ink-500 transition-colors hover:text-brand-600"
          >
            <ChevronLeft className="size-4" />
            {t.change}
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-ink-900">{branchName}</p>
            <p className="text-xs text-ink-500">{methodLabel}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {closedToday && (
        <div className="flex items-center justify-center gap-2 bg-danger-500/10 px-4 py-2.5 text-center text-sm font-medium text-danger-600">
          <CalendarOff className="size-4 shrink-0" />
          {closedReason
            ? formatMessage(t.closedTodayWithReason, { reason: closedReason })
            : t.closedTodayGeneric}
        </div>
      )}

      {/* Mobile category rail — full-width horizontal scroller, phones only.
          Kept OUTSIDE the flex row below so it lays out as a top bar rather
          than a vertical column beside the menu. */}
      <div className="sticky top-[57px] z-20 flex gap-2 overflow-x-auto border-b border-ink-100 bg-cream-50/95 px-4 py-2.5 backdrop-blur lg:hidden">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => scrollToCategory(cat.id)}
            className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? "bg-brand-500 text-white"
                : "bg-white text-ink-600 border border-ink-100"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:gap-8">
        {/* Desktop category rail */}
        <nav className="sticky top-[76px] hidden h-fit w-44 shrink-0 flex-col gap-1 lg:flex">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`cursor-pointer rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-brand-500 text-white shadow-soft"
                  : "text-ink-600 hover:bg-brand-50 hover:text-brand-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          {totalItemCount === 0 && (
            <p className="py-16 text-center text-ink-400">{t.noItemsAvailable}</p>
          )}
          <div className="flex flex-col gap-10 pb-32 lg:pb-6">
            {categories.map((cat) => (
              <section
                key={cat.id}
                id={`cat-${cat.id}`}
                ref={(el) => {
                  sectionRefs.current[cat.id] = el;
                }}
                className="scroll-mt-32"
              >
                <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl font-bold text-ink-900">
                  {cat.name}
                </h2>
                <div className="flex flex-col gap-2.5">
                  {cat.items.map((item) => (
                    <MenuItemRow key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>

        {/* Desktop cart sidebar */}
        <aside className="sticky top-[76px] hidden h-fit w-80 shrink-0 lg:block">
          <CartWidget variant="sidebar" tenantSlug={tenantSlug} disabled={closedToday} />
        </aside>
      </div>

      {/* Mobile floating cart */}
      <div className="lg:hidden">
        <CartWidget variant="mobile" tenantSlug={tenantSlug} disabled={closedToday} />
      </div>
    </div>
  );
}
