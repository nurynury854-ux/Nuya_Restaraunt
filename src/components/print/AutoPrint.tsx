"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

/**
 * Opens the browser's print dialog as soon as the ticket has rendered, and
 * offers a manual retrigger — dismissing the dialog once shouldn't strand
 * the admin with no way to print again short of reloading the tab.
 */
export function AutoPrint({ label }: { label: string }) {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 150);
    return () => clearTimeout(id);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden mt-4 flex w-full max-w-[320px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
    >
      <Printer className="size-4" />
      {label}
    </button>
  );
}
