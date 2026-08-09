import { en, type Dictionary } from "@/lib/i18n/dictionaries/en";
import { zh } from "@/lib/i18n/dictionaries/zh";
import type { Locale } from "@/lib/i18n/locale";

export type { Dictionary };

const DICTIONARIES: Record<Locale, Dictionary> = { en, zh };

/** Client-safe: no dependency on next/headers, usable from Client Components. */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
