import Link from "next/link";
import { PLATFORM_NAME } from "@/lib/constants";
import { VerifyEmailConfirm } from "./VerifyEmailConfirm";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <Link href="/" className="mb-6 font-[family-name:var(--font-display)] text-2xl font-bold text-ink-900">
        {PLATFORM_NAME}
      </Link>
      <VerifyEmailConfirm token={token ?? ""} />
    </div>
  );
}
