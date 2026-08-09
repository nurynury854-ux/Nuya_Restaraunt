"use client";

import { useOrderStore, cartTotal, cartLineUnitPrice } from "@/lib/store/orderStore";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { Card } from "@/components/ui/Card";

export function OrderSummary() {
  const { dict } = useDictionary();
  const t = dict.checkout.summary;
  const branchName = useOrderStore((s) => s.branchName);
  const diningMethod = useOrderStore((s) => s.diningMethod);
  const cart = useOrderStore((s) => s.cart);
  const total = cartTotal(cart);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink-900">{t.orderSummary}</h2>
        <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
          {branchName} · {diningMethod ? dict.constants.diningMethod[diningMethod] : ""}
        </span>
      </div>

      <ul className="flex flex-col gap-2.5">
        {cart.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-ink-700">
              {item.name}{" "}
              <span className="text-ink-400">x{item.quantity}</span>
              {item.modifiers.length > 0 && (
                <span className="block text-xs text-ink-400">
                  {item.modifiers.map((m) => m.name).join(", ")}
                </span>
              )}
            </span>
            <span className="font-medium text-ink-900">
              ${cartLineUnitPrice(item) * item.quantity}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-ink-100 pt-3 text-base font-semibold text-ink-900">
        <span>{t.total}</span>
        <span className="text-brand-600">${total}</span>
      </div>
    </Card>
  );
}
