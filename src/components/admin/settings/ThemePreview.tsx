"use client";

import { useDictionary } from "@/components/i18n/LocaleProvider";
import { themePreviewStyle, type TenantTheme } from "@/lib/theme";

/**
 * A miniature storefront rendered with the theme being edited. The theme is
 * applied as CSS variables on the wrapper, so the ordinary Tailwind classes
 * inside pick it up exactly as the real storefront pages would.
 */
export function ThemePreview({
  theme,
  businessName,
  tagline,
  logoUrl,
}: {
  theme: TenantTheme;
  businessName: string;
  tagline: string;
  logoUrl: string;
}) {
  const { dict } = useDictionary();
  const t = dict.adminSettings.tenantSettings;
  const c = dict.customer.branchSelect;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-ink-100 shadow-soft"
      style={themePreviewStyle(theme)}
      aria-hidden
    >
      <div className="flex flex-col items-center gap-2 px-5 pb-5 pt-7 text-center">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="size-10 rounded-xl object-cover" />
        )}
        <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-0.5 text-[11px] font-semibold tracking-wide text-brand-700">
          {c.orderOnline}
        </span>
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold break-words text-ink-900">
          {businessName}
        </p>
        {tagline && <p className="text-sm text-ink-700">{tagline}</p>}
        <p className="text-xs text-ink-500">{c.chooseLocation}</p>
      </div>

      <div className="px-4 pb-5">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
          <div className="size-12 shrink-0 rounded-xl bg-brand-100" />
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold text-ink-900">{t.previewItemName}</p>
            <p className="truncate text-xs text-ink-500">{t.previewItemDescription}</p>
          </div>
          <span className="rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white">
            {t.previewAdd}
          </span>
        </div>
      </div>
    </div>
  );
}
