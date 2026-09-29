import { Clock } from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";

/**
 * Shown to a restaurant's customers when its subscription has lapsed.
 *
 * Says nothing about billing. The visitor is a diner who just wanted lunch —
 * "unavailable, try again later" is the whole of what's useful to them, and
 * airing a business's payment trouble to its own customers would be a
 * genuinely damaging thing for this platform to do. The tenant hears about it
 * through their admin panel instead.
 */
export async function StorefrontClosed({ businessName }: { businessName: string }) {
  const { dict } = await getServerDictionary();
  const t = dict.customer.storefrontClosed;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-20">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-soft">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-ink-100">
          <Clock className="size-6 text-ink-400" />
        </div>
        {businessName && (
          <p className="mt-5 font-[family-name:var(--font-display)] text-xl font-bold text-ink-900">
            {businessName}
          </p>
        )}
        <h1 className="mt-2 text-base font-semibold text-ink-700">{t.heading}</h1>
        <p className="mt-2 text-sm text-ink-500">{t.body}</p>
      </div>
    </main>
  );
}
