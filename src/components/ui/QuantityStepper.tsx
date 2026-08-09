"use client";

import { Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useDictionary } from "@/components/i18n/LocaleProvider";

export function QuantityStepper({
  quantity,
  onChange,
  size = "md",
}: {
  quantity: number;
  onChange: (next: number) => void;
  size?: "sm" | "md";
}) {
  const { dict } = useDictionary();
  const dims = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  return (
    <div className="inline-flex items-center gap-2.5">
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={() => onChange(quantity - 1)}
        className={`flex ${dims} items-center justify-center rounded-full border border-ink-100 bg-white text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-600 cursor-pointer`}
        aria-label={dict.customer.quantityStepper.decrease}
      >
        <Minus className="size-3.5" />
      </motion.button>
      <span className="w-5 text-center text-sm font-semibold text-ink-900 tabular-nums">
        {quantity}
      </span>
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={() => onChange(quantity + 1)}
        className={`flex ${dims} items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600 cursor-pointer`}
        aria-label={dict.customer.quantityStepper.increase}
      >
        <Plus className="size-3.5" />
      </motion.button>
    </div>
  );
}
