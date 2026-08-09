"use client";

import { useDictionary } from "@/components/i18n/LocaleProvider";
import { LOCALES } from "@/lib/i18n/locale";

const SHORT_LABEL: Record<(typeof LOCALES)[number], string> = {
  zh: "中文",
  en: "EN",
};

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useDictionary();

  return (
    <div
      className={`inline-flex shrink-0 items-center rounded-full border border-ink-100 bg-white p-0.5 text-xs font-medium ${className}`}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`cursor-pointer rounded-full px-2.5 py-1 transition-colors ${
            locale === l ? "bg-brand-500 text-white" : "text-ink-500 hover:text-brand-600"
          }`}
        >
          {SHORT_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
