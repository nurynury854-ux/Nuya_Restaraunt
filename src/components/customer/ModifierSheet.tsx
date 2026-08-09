"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check } from "lucide-react";
import type { MenuItemWithModifiers } from "@/components/customer/MenuItemRow";
import { useOrderStore, type SelectedModifier } from "@/lib/store/orderStore";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Button } from "@/components/ui/Button";

export function ModifierSheet({
  item,
  onClose,
}: {
  item: MenuItemWithModifiers;
  onClose: () => void;
}) {
  const addItem = useOrderStore((s) => s.addItem);
  const { dict } = useDictionary();
  const t = dict.customer.modifierSheet;
  const [selections, setSelections] = useState<Record<string, Set<string>>>({});
  const [quantity, setQuantity] = useState(1);

  function toggleOption(groupId: string, optionId: string, maxSelect: number | null) {
    setSelections((prev) => {
      const current = new Set(prev[groupId] ?? []);
      const max = maxSelect ?? Infinity;
      if (current.has(optionId)) {
        current.delete(optionId);
      } else {
        if (max === 1) current.clear();
        else if (current.size >= max) return prev;
        current.add(optionId);
      }
      return { ...prev, [groupId]: current };
    });
  }

  const unmetGroups = item.modifierGroups.filter(
    (g) => (selections[g.id]?.size ?? 0) < g.minSelect
  );

  const selectedModifiers: SelectedModifier[] = useMemo(() => {
    const result: SelectedModifier[] = [];
    for (const group of item.modifierGroups) {
      const ids = selections[group.id];
      if (!ids) continue;
      for (const option of group.options) {
        if (ids.has(option.id)) {
          result.push({
            optionId: option.id,
            groupName: group.name,
            name: option.name,
            priceDelta: option.priceDelta,
          });
        }
      }
    }
    return result;
  }, [item.modifierGroups, selections]);

  const unitPrice = item.price + selectedModifiers.reduce((sum, m) => sum + m.priceDelta, 0);

  function confirm() {
    if (unmetGroups.length > 0) return;
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      modifiers: selectedModifiers,
    });
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink-900/40"
      />
      <motion.div
        key="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="pb-safe fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream-50 p-5 shadow-lift"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-ink-900">
              {item.name}
            </h3>
            {item.description && <p className="mt-0.5 text-sm text-ink-500">{item.description}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 cursor-pointer text-ink-400 hover:text-ink-700"
            aria-label={t.close}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {item.modifierGroups.map((group) => {
            const isMulti = group.maxSelect !== 1;
            const selected = selections[group.id] ?? new Set<string>();
            const unmet = selected.size < group.minSelect;
            return (
              <div key={group.id}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900">{group.name}</p>
                  <span className={`text-xs ${unmet ? "text-danger-500" : "text-ink-400"}`}>
                    {group.minSelect > 0
                      ? group.maxSelect && group.maxSelect !== group.minSelect
                        ? formatMessage(t.selectRange, { min: group.minSelect, max: group.maxSelect })
                        : formatMessage(t.selectExact, { count: group.minSelect })
                      : isMulti
                        ? group.maxSelect
                          ? formatMessage(t.selectUpTo, { max: group.maxSelect })
                          : t.optional
                        : t.optional}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {group.options.map((option) => {
                    const isSelected = selected.has(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleOption(group.id, option.id, group.maxSelect)}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${
                          isSelected
                            ? "border-brand-400 bg-brand-50"
                            : "border-ink-100 bg-white hover:border-brand-200"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`flex size-4 shrink-0 items-center justify-center border-ink-300 ${
                              isMulti ? "rounded-md" : "rounded-full"
                            } border ${isSelected ? "border-brand-500 bg-brand-500" : "bg-white"}`}
                          >
                            {isSelected && <Check className="size-3 text-white" />}
                          </span>
                          <span className="text-ink-800">{option.name}</span>
                        </span>
                        {option.priceDelta !== 0 && (
                          <span className="shrink-0 text-ink-500">
                            {option.priceDelta > 0 ? "+" : ""}
                            {option.priceDelta}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
          <QuantityStepper quantity={quantity} onChange={(n) => setQuantity(Math.max(1, n))} />
          <Button onClick={confirm} disabled={unmetGroups.length > 0}>
            {t.add} · ${unitPrice * quantity}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
