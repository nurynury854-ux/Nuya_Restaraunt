import { getDictionary, type Dictionary } from "@/lib/i18n/getDictionary";
import { getLocale } from "@/lib/i18n/getLocale";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Server Components only (getLocale reads the request's cookies via
 * next/headers). Client Components — including LocaleProvider itself — must
 * import getDictionary directly instead, or this pulls a next/headers
 * dependency into the client bundle.
 */
export async function getServerDictionary(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: getDictionary(locale) };
}
