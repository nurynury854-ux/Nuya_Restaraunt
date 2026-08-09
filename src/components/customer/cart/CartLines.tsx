"use client";

import { X } from "lucide-react";
import { useOrderStore, cartLineUnitPrice, type CartItem } from "@/lib/store/orderStore";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { QuantityStepper } from "@/components/ui/QuantityStepper";

export function CartLines({ items }: { items: CartItem[] }) {
  const setItemQuantity = useOrderStore((s) => s.setItemQuantity);
  const removeItem = useOrderStore((s) => s.removeItem);
  const { dict } = useDictionary();
  const t = dict.customer.cart;

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-400">{t.empty}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-900">{item.name}</p>
            {item.modifiers.length > 0 && (
              <p className="truncate text-xs text-ink-500">
                {item.modifiers.map((m) => m.name).join(", ")}
              </p>
            )}
            <p className="text-xs text-ink-500">
              ${cartLineUnitPrice(item)}
              {t.each}
            </p>
          </div>
          <QuantityStepper
            size="sm"
            quantity={item.quantity}
            onChange={(next) => setItemQuantity(item.id, next)}
          />
          <button
            onClick={() => removeItem(item.id)}
            className="cursor-pointer text-ink-300 transition-colors hover:text-danger-500"
            aria-label={t.removeItem}
          >
            <X className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
