"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useDictionary } from "@/components/i18n/LocaleProvider";

export function PlatformLogoutButton() {
  const router = useRouter();
  const { dict } = useDictionary();

  async function handleLogout() {
    await fetch("/api/platform-admin/auth/logout", { method: "POST" });
    router.replace("/platform-admin/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-ink-500 transition-colors hover:bg-danger-500/10 hover:text-danger-600"
    >
      <LogOut className="size-3.5" />
      {dict.platformAdmin.dashboard.logOut}
    </button>
  );
}
