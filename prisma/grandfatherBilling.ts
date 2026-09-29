import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * One-off: keeps tenants that existed before billing was introduced online.
 *
 * Run once, right after the `prisma db push` that adds the billing columns.
 * Without it every pre-existing tenant goes dark: they have no trial end date
 * (so no trial) and have never been approved (so no paid period), which is
 * exactly what an unpaid tenant looks like.
 *
 * This approves them with no end date — the same as ticking "No end date" in
 * /platform-admin — so you can later set a real paid-through date from there
 * for any that should start paying.
 *
 * Safe to re-run. The filter below is the exact fingerprint of a row that
 * predates billing: never approved, and no trial end date (every signup since
 * gets one). A genuine tenant whose trial lapsed has a trial end date, and one
 * you revoked has one too, so neither is resurrected by a second run.
 */
async function main() {
  const result = await prisma.tenant.updateMany({
    where: { approvedAt: null, trialEndsAt: null },
    data: { approvedAt: new Date(), paidThrough: null },
  });

  console.log(
    result.count === 0
      ? "No pre-billing tenants found — nothing to do."
      : `Approved ${result.count} pre-billing tenant(s) with no end date.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
