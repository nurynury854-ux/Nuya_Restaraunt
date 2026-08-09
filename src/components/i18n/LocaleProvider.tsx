"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getDictionary, type Dictionary } from "@/lib/i18n/getDictionary";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/locale";

interface LocaleContextValue {
  locale: Locale;
  dict: Dictionary;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dict: getDictionary(locale),
      setLocale: (next) => {
        // One year — a display-language preference, not a session; no reason
        // to expire it on any particular schedule.
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
        setLocaleState(next);
        // Server Components (most pages) read the locale cookie directly, so
        // they need a refresh to pick up the change — client components
        // update immediately from the state change above.
        router.refresh();
      },
    }),
    [locale, router]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useDictionary(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useDictionary must be used within a LocaleProvider");
  return ctx;
}
