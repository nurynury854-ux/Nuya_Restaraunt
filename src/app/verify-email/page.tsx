import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { consumeAuthToken } from "@/lib/authTokens";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { PLATFORM_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const { dict } = await getServerDictionary();
  const t = dict.auth.verifyEmail;

  let tenantSlug: string | null = null;
  if (token) {
    const consumed = await consumeAuthToken(token, "EMAIL_VERIFICATION");
    if (consumed) {
      const admin = await prisma.adminUser.update({
        where: { id: consumed.adminUserId },
        data: { emailVerified: true },
        include: { tenant: true },
      });
      tenantSlug = admin.tenant.slug;
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <Link href="/" className="mb-6 font-[family-name:var(--font-display)] text-2xl font-bold text-ink-900">
        {PLATFORM_NAME}
      </Link>
      {tenantSlug ? (
        <>
          <CheckCircle2 className="mb-3 size-12 text-success-500" strokeWidth={1.5} />
          <p className="mb-6 text-ink-700">{t.success}</p>
          <Link
            href={`/${tenantSlug}/admin`}
            className="inline-flex h-11 items-center rounded-xl bg-brand-500 px-6 text-sm font-medium text-white hover:bg-brand-600"
          >
            {t.continueToAdmin}
          </Link>
        </>
      ) : (
        <>
          <XCircle className="mb-3 size-12 text-danger-500" strokeWidth={1.5} />
          <p className="text-ink-700">{t.invalidToken}</p>
        </>
      )}
    </div>
  );
}
