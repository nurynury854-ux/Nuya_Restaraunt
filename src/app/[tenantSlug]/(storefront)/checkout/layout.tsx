import type { ReactNode } from "react";
import { CheckoutSteps } from "@/components/customer/checkout/CheckoutSteps";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6">
      <CheckoutSteps />
      {children}
    </div>
  );
}
