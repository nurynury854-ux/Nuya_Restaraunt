"use client";

import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, Monitor, Smartphone } from "lucide-react";
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
import { ImageCropModal } from "@/components/admin/ImageCropModal";

// Each crop is shaped for the screen it will actually fill — a 16:9 "desktop"
// crop stretched or cover-cropped onto a phone (or a 9:16 "mobile" one onto a
// wide screen) is exactly the mismatch this feature exists to avoid.
const DESKTOP_BG_ASPECT = 16 / 9;
const DESKTOP_BG_OUTPUT = { width: 1600, height: 900 };
const MOBILE_BG_ASPECT = 9 / 16;
const MOBILE_BG_OUTPUT = { width: 900, height: 1600 };

const ALL_TIMEZONES: string[] =
  typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"];

// Small swatches for the background-style picker. They use the same theme
// variables as the real backgrounds, just scaled down to fit a tile.
const BACKGROUND_SWATCHES: Record<BackgroundStyle, string> = {
  GLOW: "radial-gradient(circle at 0% 0%, var(--color-brand-200), transparent 65%), radial-gradient(circle at 100% 30%, var(--storefront-glow), transparent 55%), var(--color-cream-100)",
  SOLID: "var(--color-cream-100)",
  DOTS: "radial-gradient(var(--color-cream-300) 1.2px, transparent 1.2px) 0 0 / 8px 8px, var(--color-cream-100)",
  // Neutral placeholder until the tenant uploads a photo — overridden with an
  // actual thumbnail inline wherever an image is already set.
  IMAGE: "linear-gradient(135deg, var(--color-ink-100), var(--color-cream-100))",
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
  const [backgroundImageDesktopUrl, setBackgroundImageDesktopUrl] = useState(
    tenant.backgroundImageDesktopUrl ?? "",
  );
  const [backgroundImageMobileUrl, setBackgroundImageMobileUrl] = useState(
    tenant.backgroundImageMobileUrl ?? "",
  );
  const [backgroundOverlayOpacity, setBackgroundOverlayOpacity] = useState(
    tenant.backgroundOverlayOpacity,
  );
  const [headingFont, setHeadingFont] = useState(tenant.headingFont);
  const [cornerStyle, setCornerStyle] = useState(tenant.cornerStyle);
  const [timezone, setTimezone] = useState(tenant.timezone);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cropTarget, setCropTarget] = useState<"desktop" | "mobile" | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [bgError, setBgError] = useState("");
  const desktopBgInputRef = useRef<HTMLInputElement>(null);
  const mobileBgInputRef = useRef<HTMLInputElement>(null);

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
    backgroundImageDesktopUrl: backgroundImageDesktopUrl || null,
    backgroundImageMobileUrl: backgroundImageMobileUrl || null,
    backgroundOverlayOpacity,
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

  function handleBgFileChange(target: "desktop" | "mobile", e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCropTarget(target);
    setCropSrc(URL.createObjectURL(file));
  }

  function closeCropModal() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropTarget(null);
    setCropSrc(null);
  }

  async function handleCropConfirm(blob: Blob) {
    const target = cropTarget;
    if (!target) return;
    setUploadingBg(true);
    setBgError("");
    try {
      const form = new FormData();
      form.append("file", new File([blob], `background-${target}.jpg`, { type: "image/jpeg" }));
      form.append("kind", target === "desktop" ? "bg-desktop" : "bg-mobile");
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setBgError(data.error ?? t.uploadFailed);
        return;
      }
      if (target === "desktop") setBackgroundImageDesktopUrl(data.url);
      else setBackgroundImageMobileUrl(data.url);
      closeCropModal();
    } finally {
      setUploadingBg(false);
    }
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
          backgroundImageDesktopUrl: backgroundImageDesktopUrl || null,
          backgroundImageMobileUrl: backgroundImageMobileUrl || null,
          backgroundOverlayOpacity,
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
                {BACKGROUND_STYLES.map((style) => {
                  const thumbnail =
                    style === "IMAGE" ? backgroundImageDesktopUrl || backgroundImageMobileUrl : "";
                  return (
                    <OptionTile
                      key={style}
                      selected={backgroundStyle === style}
                      onClick={() => setBackgroundStyle(style)}
                    >
                      <span
                        className="h-7 w-full rounded-lg border border-ink-100 bg-cover bg-center"
                        style={
                          {
                            ...themePreviewStyle(theme),
                            background: thumbnail ? undefined : BACKGROUND_SWATCHES[style],
                            backgroundImage: thumbnail ? `url(${thumbnail})` : undefined,
                          } as CSSProperties
                        }
                      />
                      {t.backgroundStyles[style]}
                    </OptionTile>
                  );
                })}
              </div>
            </OptionGroup>

            {backgroundStyle === "IMAGE" && (
              <div className="flex flex-col gap-4 rounded-xl border border-ink-100 bg-cream-50 p-3.5">
                <BackgroundImageField
                  icon={<Monitor className="size-4" />}
                  label={t.desktopBackground}
                  hint={t.desktopBackgroundHint}
                  imageUrl={backgroundImageDesktopUrl}
                  uploadLabel={t.uploadBackground}
                  replaceLabel={t.replaceBackground}
                  removeLabel={t.removeBackground}
                  inputRef={desktopBgInputRef}
                  onChange={(e) => handleBgFileChange("desktop", e)}
                  onRemove={() => setBackgroundImageDesktopUrl("")}
                />
                <BackgroundImageField
                  icon={<Smartphone className="size-4" />}
                  label={t.mobileBackground}
                  hint={t.mobileBackgroundHint}
                  imageUrl={backgroundImageMobileUrl}
                  uploadLabel={t.uploadBackground}
                  replaceLabel={t.replaceBackground}
                  removeLabel={t.removeBackground}
                  inputRef={mobileBgInputRef}
                  onChange={(e) => handleBgFileChange("mobile", e)}
                  onRemove={() => setBackgroundImageMobileUrl("")}
                />
                <FieldWrapper label={t.overlayOpacity} hint={t.overlayOpacityHint}>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={backgroundOverlayOpacity}
                      onChange={(e) => setBackgroundOverlayOpacity(Number(e.target.value))}
                      className="w-full accent-brand-500"
                    />
                    <span className="w-10 shrink-0 text-right text-sm text-ink-500">
                      {backgroundOverlayOpacity}%
                    </span>
                  </div>
                </FieldWrapper>
                {bgError && <p className="text-xs text-danger-500">{bgError}</p>}
              </div>
            )}

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
        disabled={uploading || uploadingBg || backgroundTooDark}
        onClick={save}
        className="self-start"
      >
        {t.saveChanges}
      </Button>

      {cropSrc && cropTarget && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={cropTarget === "desktop" ? DESKTOP_BG_ASPECT : MOBILE_BG_ASPECT}
          outputWidth={
            cropTarget === "desktop" ? DESKTOP_BG_OUTPUT.width : MOBILE_BG_OUTPUT.width
          }
          outputHeight={
            cropTarget === "desktop" ? DESKTOP_BG_OUTPUT.height : MOBILE_BG_OUTPUT.height
          }
          title={cropTarget === "desktop" ? t.cropDesktopTitle : t.cropMobileTitle}
          hint={t.cropHint}
          cancelLabel={t.cropCancel}
          confirmLabel={t.cropConfirm}
          busy={uploadingBg}
          error={bgError}
          onCancel={closeCropModal}
          onConfirm={handleCropConfirm}
        />
      )}
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

function BackgroundImageField({
  icon,
  label,
  hint,
  imageUrl,
  uploadLabel,
  replaceLabel,
  removeLabel,
  inputRef,
  onChange,
  onRemove,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  imageUrl: string;
  uploadLabel: string;
  replaceLabel: string;
  removeLabel: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <FieldWrapper label={label} hint={hint}>
      <div className="flex items-center gap-3">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={label}
            className="h-12 w-20 shrink-0 rounded-lg border border-ink-100 object-cover"
          />
        ) : (
          <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-ink-200 text-ink-300">
            {icon}
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            {imageUrl ? replaceLabel : uploadLabel}
          </Button>
          {imageUrl && (
            <button
              type="button"
              onClick={onRemove}
              className="cursor-pointer text-xs font-medium text-ink-500 hover:text-danger-600"
            >
              {removeLabel}
            </button>
          )}
        </div>
      </div>
    </FieldWrapper>
  );
}
