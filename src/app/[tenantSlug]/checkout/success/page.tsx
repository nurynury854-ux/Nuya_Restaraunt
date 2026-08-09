"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, PackageSearch } from "lucide-react";
import { useOrderStore } from "@/lib/store/orderStore";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import { Button } from "@/components/ui/Button";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { dict } = useDictionary();
  const t = dict.checkout.success;
  const lastOrderNo = useOrderStore((s) => s.lastOrderNo);
  const lastOrderId = useOrderStore((s) => s.lastOrderId);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    useOrderStore.persist.rehydrate();
    if (!useOrderStore.getState().lastOrderNo) {
      router.replace(`/${tenantSlug}`);
      return;
    }
    // Deferred so the setState isn't synchronous within the effect body.
    // resetOrder() clears branchId/diningMethod/cart/paymentMethod — it
    // happens here, once we're safely on the success page, rather than on
    // the review page before navigating away. Clearing it there raced the
    // navigation: if the review (or payment) page got a chance to re-render
    // with the now-empty state before the route change fully took over, its
    // own checkout guard saw no branch/dining-method selected and redirected
    // to the tenant home page, hijacking the success page entirely.
    const id = setTimeout(() => {
      useOrderStore.getState().resetOrder();
      setReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, [router, tenantSlug]);

  if (!ready) return null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="flex size-24 items-center justify-center rounded-full bg-success-500/10"
      >
        <CheckCircle2 className="size-14 text-success-500" strokeWidth={1.5} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mt-6 flex flex-col items-center gap-2"
      >
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink-900 sm:text-3xl">
          {t.orderPlaced}
        </h1>
        <p className="text-ink-500">{t.thanksMessage}</p>
        <p className="mt-3 rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700">
          {formatMessage(t.orderNumber, { orderNo: lastOrderNo ?? "" })}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="mt-10 flex flex-col items-center gap-3"
      >
        {lastOrderId && (
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push(`/${tenantSlug}/orders/${lastOrderId}`)}
          >
            <PackageSearch className="size-4" />
            {t.trackYourOrder}
          </Button>
        )}
        <Button
          size="lg"
          variant={lastOrderId ? "ghost" : "primary"}
          onClick={() => router.push(`/${tenantSlug}`)}
        >
          {t.backToHome}
        </Button>
      </motion.div>
    </div>
  );
}
