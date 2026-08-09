import { prisma } from "@/lib/prisma";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { TimeSlotManager } from "@/components/admin/timeslots/TimeSlotManager";

export const dynamic = "force-dynamic";

export default async function BranchTimeSlotsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; branchId: string }>;
}) {
  const { branchId } = await params;
  const [slots, { dict }] = await Promise.all([
    prisma.timeSlot.findMany({
      where: { branchId },
      orderBy: { sortOrder: "asc" },
    }),
    getServerDictionary(),
  ]);
  const t = dict.adminSettings.timeSlots;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl font-bold text-ink-900">
        {t.heading}
      </h1>
      <p className="mb-5 text-sm text-ink-500">{t.subheading}</p>
      <TimeSlotManager branchId={branchId} initialSlots={JSON.parse(JSON.stringify(slots))} />
    </div>
  );
}
