"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDictionary } from "@/components/i18n/LocaleProvider";

/**
 * Navigates to `href` via a plain client-side router call, instead of a
 * server-side redirect(). A server redirect() rendered as the target of a
 * client-initiated navigation (router.push()/replace(), e.g. right after
 * login/signup, or clicking an in-app link) gets encoded into the RSC
 * response as a special digest for the client router to resolve — and that
 * resolution isn't reliable across a nested dynamic-segment jump, which can
 * surface as a load error that a manual reload "fixes" (a plain document
 * load just follows the HTTP redirect directly, no client-side digest
 * handling involved). Doing the hop as an ordinary client navigation
 * sidesteps that entirely.
 */
export function ClientRedirect({ href }: { href: string }) {
  const router = useRouter();
  const { dict } = useDictionary();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return (
    <div className="flex flex-1 items-center justify-center text-ink-400">{dict.common.loading}</div>
  );
}
