"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ShoppingBag, ChevronUp, X } from "lucide-react";
import { useOrderStore, cartTotal, cartCount } from "@/lib/store/orderStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CartLines } from "@/components/customer/cart/CartLines";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";

export function CartWidget({
  variant,
  tenantSlug,
  disabled,
}: {
  variant: "sidebar" | "mobile";
  tenantSlug: string;
  disabled?: boolean;
}) {
  const cart = useOrderStore((s) => s.cart);
  const router = useRouter();
  const total = cartTotal(cart);
  const count = cartCount(cart);
  const [expanded, setExpanded] = useState(false);
  const { dict } = useDictionary();
  const t = dict.customer.cart;
  const plural = count === 1 ? "" : "s";

  function goCheckout() {
    if (disabled) return;
    setExpanded(false);
    router.push(`/${tenantSlug}/checkout/details`);
  }

  if (variant === "sidebar") {
    return (
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-5 text-brand-500" />
          <h3 className="font-semibold text-ink-900">{t.yourCart}</h3>
        </div>
        <CartLines items={cart} />
        {cart.length > 0 && (
          <>
            <div className="border-t border-ink-100 pt-3">
              <div className="flex items-center justify-between text-base font-semibold text-ink-900">
                <span>{t.total}</span>
                <span className="text-brand-600">${total}</span>
              </div>
            </div>
            <Button fullWidth size="lg" disabled={disabled} onClick={goCheckout}>
              {disabled ? t.locationClosed : formatMessage(t.checkoutWithCount, { count, plural })}
            </Button>
          </>
        )}
      </Card>
    );
  }

  return (
    <>
      <AnimatePresence>
        {cart.length > 0 && !expanded && (
          <motion.button
            key="bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setExpanded(true)}
            className="bottom-safe fixed inset-x-4 z-40 flex cursor-pointer items-center justify-between rounded-2xl bg-ink-900 px-5 py-4 text-white shadow-lift"
          >
            <span className="flex items-center gap-2 text-sm">
              <ShoppingBag className="size-4" />
              {formatMessage(t.itemCount, { count, plural })}
              <ChevronUp className="size-4" />
            </span>
            <span className="font-semibold">${total}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="fixed inset-0 z-40 bg-ink-900/40"
            />
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="pb-safe fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-cream-50 p-5 shadow-lift"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-ink-900">{t.yourCart}</h3>
                <button
                  onClick={() => setExpanded(false)}
                  className="cursor-pointer text-ink-400 hover:text-ink-700"
                >
                  <X className="size-5" />
                </button>
              </div>
              <CartLines items={cart} />
              {cart.length > 0 && (
                <div className="mt-4 border-t border-ink-100 pt-3">
                  <div className="mb-3 flex items-center justify-between text-base font-semibold text-ink-900">
                    <span>{t.total}</span>
                    <span className="text-brand-600">${total}</span>
                  </div>
                  <Button fullWidth size="lg" disabled={disabled} onClick={goCheckout}>
                    {disabled ? t.locationClosed : t.checkout}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
