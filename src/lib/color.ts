export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return null;
  const num = parseInt(match[1], 16);
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Blends a #RRGGBB hex color toward another by the given fraction (0-1). */
export function mixHex(hex: string, toward: string, amount: number): string {
  const from = parseHex(hex);
  const to = parseHex(toward);
  if (!from || !to) return hex;
  return toHex([
    Math.round(from[0] + (to[0] - from[0]) * amount),
    Math.round(from[1] + (to[1] - from[1]) * amount),
    Math.round(from[2] + (to[2] - from[2]) * amount),
  ]);
}

/** Darkens a #RRGGBB hex color by the given fraction (0-1). Used to derive a
 * hover/pressed shade from a tenant's single chosen brand color. */
export function darkenHex(hex: string, amount: number): string {
  return mixHex(hex, "#000000", amount);
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colors, 1 (none) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
