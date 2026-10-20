import type { CSSProperties } from "react";
import { HEX_COLOR_REGEX, mixHex, relativeLuminance } from "@/lib/color";

/**
 * Tenant storefront theming.
 *
 * Every color, font and radius in the app comes from a Tailwind theme
 * variable (see globals.css), so a tenant's look is applied by overriding
 * those variables — nothing in the components needs to know about themes.
 *
 * - The brand scale (`--color-brand-*`) is applied to the whole tenant area,
 *   admin panel included (src/app/[tenantSlug]/layout.tsx).
 * - Everything else — background, heading font, corners — is applied to the
 *   customer-facing storefront only ((storefront)/layout.tsx), so the admin
 *   panel keeps a consistent, predictable look.
 *
 * Values read from the database are re-validated here before they go anywhere
 * near a <style> tag, so a bad row can never inject arbitrary CSS.
 */

export const DEFAULT_ACCENT_COLOR = "#c8722e";
export const DEFAULT_BACKGROUND_COLOR = "#fbf4e7";

/** Page text is dark ink, so the background has to stay light enough for it
 * to remain readable. 0.7 keeps even the lighter grey hint text legible. */
export const MIN_BACKGROUND_LUMINANCE = 0.7;

export const BACKGROUND_STYLES = ["GLOW", "SOLID", "DOTS", "IMAGE"] as const;
export type BackgroundStyle = (typeof BACKGROUND_STYLES)[number];

/** Breakpoint (px) the storefront switches from the mobile-cropped background
 * image to the desktop-cropped one. Matches Tailwind's `sm` breakpoint, the
 * same one the rest of the app uses for its own mobile/desktop layout
 * switches (e.g. the branch-card grid in BranchSelector). */
export const BACKGROUND_IMAGE_BREAKPOINT_PX = 640;

export const HEADING_FONTS = ["CLASSIC", "ELEGANT", "MODERN", "FRIENDLY"] as const;
export type HeadingFont = (typeof HEADING_FONTS)[number];

export const CORNER_STYLES = ["SHARP", "SOFT", "ROUNDED"] as const;
export type CornerStyle = (typeof CORNER_STYLES)[number];

export interface TenantTheme {
  accentColor: string | null;
  backgroundColor: string | null;
  backgroundStyle: string;
  backgroundImageDesktopUrl: string | null;
  backgroundImageMobileUrl: string | null;
  backgroundOverlayOpacity: number;
  headingFont: string;
  cornerStyle: string;
}

/** Font stacks for each heading choice. The CJK fallbacks mirror
 * --font-display / --font-sans in globals.css so Chinese text still renders. */
export const HEADING_FONT_STACKS: Record<HeadingFont, string> = {
  CLASSIC: "var(--font-fraunces), var(--font-noto-serif-tc)",
  ELEGANT: "var(--font-playfair), var(--font-noto-serif-tc)",
  MODERN: "var(--font-inter), var(--font-noto-sans-tc)",
  FRIENDLY: "var(--font-nunito), var(--font-noto-sans-tc)",
};

/** Overrides for Tailwind's radius scale. ROUNDED is the platform default,
 * so it overrides nothing. rounded-full (pills, avatars) is left alone. */
const CORNER_RADII: Record<CornerStyle, Record<string, string>> = {
  SHARP: {
    "--radius-md": "0.125rem",
    "--radius-lg": "0.25rem",
    "--radius-xl": "0.25rem",
    "--radius-2xl": "0.375rem",
    "--radius-3xl": "0.5rem",
  },
  SOFT: {
    "--radius-md": "0.25rem",
    "--radius-lg": "0.375rem",
    "--radius-xl": "0.5rem",
    "--radius-2xl": "0.625rem",
    "--radius-3xl": "0.875rem",
  },
  ROUNDED: {},
};

export interface ThemePreset {
  id: string;
  accentColor: string;
  backgroundColor: string;
  backgroundStyle: BackgroundStyle;
  headingFont: HeadingFont;
  cornerStyle: CornerStyle;
}

/** One-click starting points in Site Settings. Labels live in the
 * adminSettings dictionary under tenantSettings.presets[id]. */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "warm",
    accentColor: DEFAULT_ACCENT_COLOR,
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    backgroundStyle: "GLOW",
    headingFont: "CLASSIC",
    cornerStyle: "ROUNDED",
  },
  {
    id: "garden",
    accentColor: "#3f8f5a",
    backgroundColor: "#f2f7ef",
    backgroundStyle: "GLOW",
    headingFont: "FRIENDLY",
    cornerStyle: "ROUNDED",
  },
  {
    id: "coastal",
    accentColor: "#2f6fb0",
    backgroundColor: "#f1f5fa",
    backgroundStyle: "SOLID",
    headingFont: "MODERN",
    cornerStyle: "SOFT",
  },
  {
    id: "bistro",
    accentColor: "#8a2332",
    backgroundColor: "#f8f4ee",
    backgroundStyle: "SOLID",
    headingFont: "ELEGANT",
    cornerStyle: "SHARP",
  },
  {
    id: "sweet",
    accentColor: "#d6517d",
    backgroundColor: "#fff4f6",
    backgroundStyle: "DOTS",
    headingFont: "FRIENDLY",
    cornerStyle: "ROUNDED",
  },
];

function pick<T extends string>(allowed: readonly T[], value: string, fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** A valid color that differs from the platform default, or null. Choosing the
 * default counts as "not customized" so those tenants keep the hand-tuned
 * default palette (the settings form used to always save #c8722e). */
function customHex(value: string | null | undefined, platformDefault: string): string | null {
  if (!value || !HEX_COLOR_REGEX.test(value)) return null;
  const hex = value.toLowerCase();
  return hex === platformDefault ? null : hex;
}

export function isReadableBackground(hex: string): boolean {
  return relativeLuminance(hex) >= MIN_BACKGROUND_LUMINANCE;
}

/** The full --color-brand-* scale derived from one brand color, so light
 * tints (badges, selected states, borders) match the brand instead of staying
 * on the default orange. Empty when the tenant hasn't picked a color. */
export function brandThemeVars(accentColor: string | null): Record<string, string> {
  const base = customHex(accentColor, DEFAULT_ACCENT_COLOR);
  if (!base) return {};
  const white = "#ffffff";
  const black = "#000000";
  return {
    "--color-brand-50": mixHex(base, white, 0.92),
    "--color-brand-100": mixHex(base, white, 0.84),
    "--color-brand-200": mixHex(base, white, 0.64),
    "--color-brand-300": mixHex(base, white, 0.44),
    "--color-brand-400": mixHex(base, white, 0.22),
    "--color-brand-500": base,
    "--color-brand-600": mixHex(base, black, 0.15),
    "--color-brand-700": mixHex(base, black, 0.32),
    "--color-brand-800": mixHex(base, black, 0.48),
    "--color-brand-900": mixHex(base, black, 0.62),
  };
}

/** Background, heading font and corner variables for the storefront. */
export function storefrontThemeVars(theme: TenantTheme): Record<string, string> {
  const vars: Record<string, string> = {};

  // The chosen color becomes cream-100 (the page itself); the lighter and
  // darker cream shades used for inputs, headers and dividers follow it.
  const background = customHex(theme.backgroundColor, DEFAULT_BACKGROUND_COLOR);
  if (background && isReadableBackground(background)) {
    vars["--color-cream-50"] = mixHex(background, "#ffffff", 0.6);
    vars["--color-cream-100"] = background;
    vars["--color-cream-200"] = mixHex(background, "#000000", 0.04);
    vars["--color-cream-300"] = mixHex(background, "#000000", 0.09);
  }

  // The default look pairs the orange brand with a gold glow; with a custom
  // brand color, gold would clash, so the glow follows the brand instead.
  vars["--storefront-glow"] = customHex(theme.accentColor, DEFAULT_ACCENT_COLOR)
    ? "var(--color-brand-200)"
    : "var(--color-gold-400)";

  const font = pick(HEADING_FONTS, theme.headingFont, "CLASSIC");
  vars["--font-display"] = HEADING_FONT_STACKS[font];

  Object.assign(vars, CORNER_RADII[pick(CORNER_STYLES, theme.cornerStyle, "ROUNDED")]);

  return vars;
}

/** Wraps a URL for safe interpolation into `url("...")` inside a `<style>`
 * tag — escapes quotes/backslashes so a pathological value (this app only
 * ever stores its own Vercel Blob URLs here, validated by zod as `.url()`,
 * but a `<style dangerouslySetInnerHTML>` is still worth defending) can't
 * break out of the string and inject other CSS. */
function cssUrl(url: string): string {
  return `url("${url.replace(/["\\]/g, (c) => `\\${c}`)}")`;
}

function overlayGradient(overlayOpacity: number): string {
  const opacity = Math.max(0, Math.min(100, overlayOpacity)) / 100;
  return `linear-gradient(rgba(255,255,255,${opacity}), rgba(255,255,255,${opacity}))`;
}

/** The CSS `background` value for the storefront page. For "IMAGE", prefers
 * the desktop crop (falling back to the mobile one) — used for single-element
 * contexts that can't express a responsive media-query swap, i.e. the Site
 * Settings live preview. The real storefront page uses
 * `storefrontBackgroundCss` instead, which picks per-breakpoint. */
export function storefrontBackground(theme: TenantTheme): string {
  switch (pick(BACKGROUND_STYLES, theme.backgroundStyle, "GLOW")) {
    case "SOLID":
      return "var(--color-cream-100)";
    case "DOTS":
      return "radial-gradient(var(--color-cream-300) 1.2px, transparent 1.2px) 0 0 / 18px 18px, var(--color-cream-100)";
    case "GLOW":
      return [
        "radial-gradient(1200px 600px at 10% -10%, var(--color-brand-100) 0%, transparent 60%)",
        "radial-gradient(900px 500px at 110% 10%, var(--storefront-glow) 0%, transparent 45%)",
        "var(--color-cream-100)",
      ].join(", ");
    case "IMAGE": {
      const url = theme.backgroundImageDesktopUrl ?? theme.backgroundImageMobileUrl;
      if (!url) return "var(--color-cream-100)";
      return `${overlayGradient(theme.backgroundOverlayOpacity)}, ${cssUrl(url)} center / cover no-repeat, var(--color-cream-100)`;
    }
  }
}

/**
 * The full `body{...}` CSS (including a mobile/desktop media query when the
 * tenant uploaded a custom background image) for the real storefront page —
 * `(storefront)/layout.tsx` injects this directly.
 *
 * A single `background` value can't swap per-breakpoint on its own, so the
 * "IMAGE" case is the only one that needs more than one rule: it renders the
 * tenant's mobile-cropped photo by default, then overrides to the
 * desktop-cropped one past `BACKGROUND_IMAGE_BREAKPOINT_PX` — each crop made
 * for the screen shape it actually fills, rather than one image stretched or
 * cover-cropped across both.
 */
export function storefrontBackgroundCss(theme: TenantTheme): string {
  if (
    pick(BACKGROUND_STYLES, theme.backgroundStyle, "GLOW") === "IMAGE" &&
    (theme.backgroundImageMobileUrl || theme.backgroundImageDesktopUrl)
  ) {
    const overlay = overlayGradient(theme.backgroundOverlayOpacity);
    const mobileUrl = theme.backgroundImageMobileUrl ?? theme.backgroundImageDesktopUrl!;
    const desktopUrl = theme.backgroundImageDesktopUrl ?? theme.backgroundImageMobileUrl!;
    const layer = (url: string) => `${overlay}, ${cssUrl(url)} center / cover no-repeat`;
    let css = `body{background:${layer(mobileUrl)}, var(--color-cream-100);}`;
    if (desktopUrl !== mobileUrl) {
      css += `@media (min-width:${BACKGROUND_IMAGE_BREAKPOINT_PX}px){body{background:${layer(desktopUrl)}, var(--color-cream-100);}}`;
    }
    return css;
  }
  return `body{background:${storefrontBackground(theme)};}`;
}

export function varsToCss(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([name, value]) => `${name}:${value};`)
    .join("");
}

/** The same theme as inline styles on one element, for the live preview in
 * Site Settings. Custom properties cascade, so real Tailwind classes inside
 * the element render exactly as they would on the storefront. */
export function themePreviewStyle(theme: TenantTheme): CSSProperties {
  return {
    ...brandThemeVars(theme.accentColor),
    ...storefrontThemeVars(theme),
    background: storefrontBackground(theme),
  } as CSSProperties;
}
