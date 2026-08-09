"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, UtensilsCrossed } from "lucide-react";
import type { MenuItem, ModifierGroup, ModifierOption } from "@/generated/prisma/client";
import { useOrderStore } from "@/lib/store/orderStore";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Card } from "@/components/ui/Card";
import { ModifierSheet } from "@/components/customer/ModifierSheet";

export type MenuItemWithModifiers = MenuItem & {
  modifierGroups: (ModifierGroup & { options: ModifierOption[] })[];
};

export function MenuItemRow({ item }: { item: MenuItemWithModifiers }) {
  const hasModifiers = item.modifierGroups.length > 0;
  const [sheetOpen, setSheetOpen] = useState(false);

  const cartItem = useOrderStore((s) => (hasModifiers ? undefined : s.cart.find((c) => c.id === item.id)));
  const cartQuantity = useOrderStore((s) =>
    hasModifiers
      ? s.cart.filter((c) => c.menuItemId === item.id).reduce((sum, c) => sum + c.quantity, 0)
      : 0
  );
  const addItem = useOrderStore((s) => s.addItem);
  const setItemQuantity = useOrderStore((s) => s.setItemQuantity);
  const { dict } = useDictionary();

  return (
    <>
      <Card className="flex items-center gap-3.5 px-4 py-3.5 sm:px-5">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="size-14 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-300">
            <UtensilsCrossed className="size-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink-900">{item.name}</p>
          {item.description && (
            <p className="mt-0.5 truncate text-xs text-ink-500">{item.description}</p>
          )}
          <p className="mt-1 text-sm font-semibold text-brand-600">${item.price}</p>
        </div>

        {hasModifiers ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setSheetOpen(true)}
            className="relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <Plus className="size-4" />
            {dict.customer.menu.add}
            {cartQuantity > 0 && (
              <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-ink-900 text-[11px] font-semibold text-white">
                {cartQuantity}
              </span>
            )}
          </motion.button>
        ) : cartItem ? (
          <QuantityStepper
            quantity={cartItem.quantity}
            onChange={(next) => setItemQuantity(item.id, next)}
          />
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              addItem({ menuItemId: item.id, name: item.name, price: item.price, quantity: 1, modifiers: [] })
            }
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <Plus className="size-4" />
            {dict.customer.menu.add}
          </motion.button>
        )}
      </Card>

      {hasModifiers && sheetOpen && <ModifierSheet item={item} onClose={() => setSheetOpen(false)} />}
    </>
  );
}
