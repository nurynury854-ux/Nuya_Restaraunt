import type { Metadata, Viewport } from "next";
import { Inter, Fraunces, Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import { PageTransition } from "@/components/PageTransition";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { getLocale } from "@/lib/i18n/getLocale";
import { LOCALE_HTML_LANG } from "@/lib/i18n/locale";
import { PLATFORM_NAME } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600", "700", "900"],
});

// Neither Latin font has CJK glyphs, so these are chained in as fallbacks in
// globals.css (--font-sans / --font-display) rather than swapped based on
// locale — a browser already picks the right font per-character from a
// fallback stack, so Latin and Chinese text can mix in the same string
// (e.g. a business's own name) without any locale-conditional logic.
const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["600", "700", "900"],
});

export const metadata: Metadata = {
  title: `${PLATFORM_NAME} — Online Ordering for Restaurants`,
  description:
    "Spin up your own branded online ordering site in minutes. Menus, locations, live orders — all self-serve.",
};

export const viewport: Viewport = {
  themeColor: "#c8722e",
  width: "device-width",
  initialScale: 1,
  // Let content extend into the notch / rounded-corner areas so our
  // safe-area-aware padding can position fixed UI correctly on phones.
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={LOCALE_HTML_LANG[locale]}
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${fraunces.variable} ${notoSansTC.variable} ${notoSerifTC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider initialLocale={locale}>
          <PageTransition>{children}</PageTransition>
        </LocaleProvider>
      </body>
    </html>
  );
}
