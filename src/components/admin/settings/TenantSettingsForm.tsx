"use client";

import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2 } from "lucide-react";
import type { SerializedTenant } from "@/lib/types";
import { useDictionary } from "@/components/i18n/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select } from "@/components/ui/Field";
import { HEX_COLOR_REGEX, contrastRatio } from "@/lib/color";
import {
  BACKGROUND_STYLES,
  CORNER_STYLES,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_BACKGROUND_COLOR,
  HEADING_FONTS,
  HEADING_FONT_STACKS,
  THEME_PRESETS,
  isReadableBackground,
  themePreviewStyle,
  type BackgroundStyle,
  type CornerStyle,
  type HeadingFont,
  type TenantTheme,
  type ThemePreset,
} from "@/lib/theme";
import { ThemePreview } from "./ThemePreview";

const ALL_TIMEZONES: string[] =
  typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"];

// Small swatches for the background-style picker. They use the same theme
// variables as the real backgrounds, just scaled down to fit a tile.
const BACKGROUND_SWATCHES: Record<BackgroundStyle, string> = {
  GLOW: "radial-gradient(circle at 0% 0%, var(--color-brand-200), transparent 65%), radial-gradient(circle at 100% 30%, var(--storefront-glow), transparent 55%), var(--color-cream-100)",
  SOLID: "var(--color-cream-100)",
  DOTS: "radial-gradient(var(--color-cream-300) 1.2px, transparent 1.2px) 0 0 / 8px 8px, var(--color-cream-100)",
};

const CORNER_SAMPLE_RADIUS: Record<CornerStyle, string> = {
  SHARP: "3px",
  SOFT: "7px",
  ROUNDED: "12px",
};

export function TenantSettingsForm({ tenant }: { tenant: SerializedTenant }) {
  const router = useRouter();
  const { dict } = useDictionary();
  const t = dict.adminSettings.tenantSettings;
  const [businessName, setBusinessName] = useState(tenant.businessName);
  const [tagline, setTagline] = useState(tenant.tagline ?? "");
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl ?? "");
  const [accentColor, setAccentColor] = useState(tenant.accentColor ?? DEFAULT_ACCENT_COLOR);
  const [backgroundColor, setBackgroundColor] = useState(
    tenant.backgroundColor ?? DEFAULT_BACKGROUND_COLOR,
  );
  const [backgroundStyle, setBackgroundStyle] = useState(tenant.backgroundStyle);
  const [headingFont, setHeadingFont] = useState(tenant.headingFont);
  const [cornerStyle, setCornerStyle] = useState(tenant.cornerStyle);
  const [timezone, setTimezone] = useState(tenant.timezone);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectedTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const accentValid = HEX_COLOR_REGEX.test(accentColor);
  const backgroundValid = HEX_COLOR_REGEX.test(backgroundColor);
  const backgroundTooDark = backgroundValid && !isReadableBackground(backgroundColor);
  const lowAccentContrast = accentValid && contrastRatio("#ffffff", accentColor) < 3;

  // Half-typed hex values fall back to the defaults so the preview never
  // flickers into something broken while the user is typing.
  const theme: TenantTheme = {
    accentColor: accentValid ? accentColor : null,
    backgroundColor: backgroundValid && !backgroundTooDark ? backgroundColor : null,
    backgroundStyle,
    headingFont,
    cornerStyle,
  };

  function applyPreset(preset: ThemePreset) {
    setAccentColor(preset.accentColor);
    setBackgroundColor(preset.backgroundColor);
    setBackgroundStyle(preset.backgroundStyle);
    setHeadingFont(preset.headingFont);
    setCornerStyle(preset.cornerStyle);
  }

  function isPresetActive(preset: ThemePreset) {
    return (
      preset.accentColor === accentColor.toLowerCase() &&
      preset.backgroundColor === backgroundColor.toLowerCase() &&
      preset.backgroundStyle === backgroundStyle &&
      preset.headingFont === headingFont &&
      preset.cornerStyle === cornerStyle
    );
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "logo");
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.uploadFailed);
        return;
      }
      setLogoUrl(data.url);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          tagline: tagline.trim() || null,
          logoUrl: logoUrl || null,
          accentColor,
          backgroundColor,
          backgroundStyle,
          headingFont,
          cornerStyle,
          timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.saveError);
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-base font-semibold text-ink-900">{t.businessDetails}</h2>

        <div className="flex max-w-lg flex-col gap-4">
          <FieldWrapper label={t.businessName} required>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </FieldWrapper>

          <FieldWrapper label={t.tagline} hint={t.taglineHint}>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder={t.taglinePlaceholder}
              maxLength={120}
            />
          </FieldWrapper>

          <FieldWrapper label={t.logo} hint={t.logoHint}>
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={t.logo}
                    className="size-14 rounded-xl border border-ink-100 object-cover"
                  />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-xl border border-dashed border-ink-200 text-ink-300">
                    <Upload className="size-5" />
                  </div>
                )}
                {logoUrl && !uploading && (
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-success-500 text-white shadow-soft">
                    <CheckCircle2 className="size-3.5" />
                  </span>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoUrl ? t.replaceLogo : t.uploadLogo}
                </Button>
              </div>
            </div>
          </FieldWrapper>

          <FieldWrapper label={t.timezone} hint={t.timezoneHint}>
            <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {!ALL_TIMEZONES.includes(timezone) && <option value={timezone}>{timezone}</option>}
              {ALL_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
            {detectedTimezone !== timezone && (
              <button
                type="button"
                onClick={() => setTimezone(detectedTimezone)}
                className="mt-1 cursor-pointer text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                {formatMessage(t.useDetectedTimezone, { tz: detectedTimezone })}
              </button>
            )}
          </FieldWrapper>
        </div>
      </Card>

      <Card className="flex flex-col gap-5 p-5">
        <div>
          <h2 className="text-base font-semibold text-ink-900">{t.appearance}</h2>
          <p className="mt-0.5 text-sm text-ink-500">{t.appearanceHint}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-5">
            <OptionGroup label={t.presetsLabel}>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-3">
                {THEME_PRESETS.map((preset) => (
                  <OptionTile
                    key={preset.id}
                    selected={isPresetActive(preset)}
                    onClick={() => applyPreset(preset)}
                  >
                    <span className="flex">
                      <span
                        className="size-5 rounded-full border border-ink-100"
                        style={{ background: preset.backgroundColor }}
                      />
                      <span
                        className="-ml-1.5 size-5 rounded-full border-2 border-white"
                        style={{ background: preset.accentColor }}
                      />
                    </span>
                    {t.presets[preset.id as keyof typeof t.presets]}
                  </OptionTile>
                ))}
              </div>
            </OptionGroup>

            <ColorField
              label={t.brandColor}
              hint={t.brandColorHint}
              value={accentColor}
              onChange={setAccentColor}
              warning={lowAccentContrast ? t.brandContrastWarning : undefined}
            />

            <ColorField
              label={t.backgroundColor}
              hint={t.backgroundColorHint}
              value={backgroundColor}
              onChange={setBackgroundColor}
              error={backgroundTooDark ? t.backgroundTooDark : undefined}
            />

            <OptionGroup label={t.backgroundStyle}>
              <div className="grid grid-cols-3 gap-2">
                {BACKGROUND_STYLES.map((style) => (
                  <OptionTile
                    key={style}
                    selected={backgroundStyle === style}
                    onClick={() => setBackgroundStyle(style)}
                  >
                    <span
                      className="h-7 w-full rounded-lg border border-ink-100"
                      style={
                        {
                          ...themePreviewStyle(theme),
                          background: BACKGROUND_SWATCHES[style],
                        } as CSSProperties
                      }
                    />
                    {t.backgroundStyles[style]}
                  </OptionTile>
                ))}
              </div>
            </OptionGroup>

            <OptionGroup label={t.headingFont}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
                {HEADING_FONTS.map((font: HeadingFont) => (
                  <OptionTile
                    key={font}
                    selected={headingFont === font}
                    onClick={() => setHeadingFont(font)}
                  >
                    <span
                      className="text-xl leading-none font-bold"
                      style={{ fontFamily: HEADING_FONT_STACKS[font] }}
                    >
                      Aa
                    </span>
                    {t.headingFonts[font]}
                  </OptionTile>
                ))}
              </div>
            </OptionGroup>

            <OptionGroup label={t.cornerStyle}>
              <div className="grid grid-cols-3 gap-2">
                {CORNER_STYLES.map((corner) => (
                  <OptionTile
                    key={corner}
                    selected={cornerStyle === corner}
                    onClick={() => setCornerStyle(corner)}
                  >
                    <span
                      className="size-6 border-t-2 border-r-2 border-current"
                      style={{ borderTopRightRadius: CORNER_SAMPLE_RADIUS[corner] }}
                    />
                    {t.cornerStyles[corner]}
                  </OptionTile>
                ))}
              </div>
            </OptionGroup>
          </div>

          <div className="min-w-0 md:sticky md:top-6 md:self-start">
            <p className="mb-1.5 text-sm font-medium text-ink-700">{t.preview}</p>
            <ThemePreview
              theme={theme}
              businessName={businessName}
              tagline={tagline.trim()}
              logoUrl={logoUrl}
            />
          </div>
        </div>
      </Card>

      {error && <p className="text-sm text-danger-500">{error}</p>}

      <Button
        size="sm"
        loading={saving}
        disabled={uploading || backgroundTooDark}
        onClick={save}
        className="self-start"
      >
        {t.saveChanges}
      </Button>
    </div>
  );
}

function OptionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium text-ink-700">{label}</legend>
      {children}
    </fieldset>
  );
}

function OptionTile({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-w-0 cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors ${
        selected
          ? "border-brand-400 bg-brand-50 text-brand-700 ring-2 ring-brand-200"
          : "border-ink-100 bg-white text-ink-700 hover:border-ink-300"
      }`}
    >
      {children}
    </button>
  );
}

function ColorField({
  label,
  hint,
  value,
  onChange,
  warning,
  error,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  warning?: string;
  error?: string;
}) {
  return (
    <FieldWrapper label={label} hint={hint} error={error}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={HEX_COLOR_REGEX.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="size-11 shrink-0 cursor-pointer rounded-lg border border-ink-100 bg-transparent p-1"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          maxLength={7}
          className="w-32"
        />
      </div>
      {warning && !error && <span className="text-xs text-gold-600">{warning}</span>}
    </FieldWrapper>
  );
}
