export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];

// Traditional Chinese first, per the platform's target market — English is
// an explicit opt-in via the switcher, not the other way around.
export const DEFAULT_LOCALE: Locale = "zh";

export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export const LOCALE_LABEL: Record<Locale, string> = {
  zh: "繁體中文",
  en: "English",
};

/** BCP 47 tag for <html lang>. */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  zh: "zh-Hant",
  en: "en",
};
