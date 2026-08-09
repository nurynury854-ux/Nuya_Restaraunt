import { ShieldCheck } from "lucide-react";
import { PLATFORM_NAME } from "@/lib/constants";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { TenantTable } from "@/components/platform-admin/TenantTable";
import { PlatformLogoutButton } from "@/components/platform-admin/PlatformLogoutButton";

export const dynamic = "force-dynamic";

export default async function PlatformAdminDashboard() {
  const { dict } = await getServerDictionary();
  const t = dict.platformAdmin.dashboard;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-ink-100 bg-white/70 px-5 py-3 backdrop-blur sm:px-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-ink-900" />
          <span className="font-[family-name:var(--font-display)] text-base font-bold text-ink-900">
            {PLATFORM_NAME}
            {t.headerSuffix}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <PlatformLogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <TenantTable />
      </main>
    </div>
  );
}
