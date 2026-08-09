import Link from "next/link";
import { ShoppingBag, DollarSign, Receipt, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { bucketOrdersByMonth, parseMonthParam, monthParamOf } from "@/lib/analytics";
import { getTenantBySlug } from "@/lib/tenant";
import { getServerDictionary } from "@/lib/i18n/getServerDictionary";
import { formatMessage } from "@/lib/i18n/format";
import { Card } from "@/components/ui/Card";
import { MonthlyBarChart } from "@/components/admin/dashboard/MonthlyBarChart";
import { OnboardingChecklist, type OnboardingStep } from "@/components/admin/dashboard/OnboardingChecklist";

export const dynamic = "force-dynamic";

const PLACEHOLDER_ADDRESS = "Add your address";
const PLACEHOLDER_PHONE = "Add your phone number";
const PLACEHOLDER_HOURS = "Add your hours";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string; branchId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { tenantSlug, branchId } = await params;
  const { month: monthParam } = await searchParams;
  const [tenant, { locale, dict }] = await Promise.all([
    getTenantBySlug(tenantSlug),
    getServerDictionary(),
  ]);
  const t = dict.adminDashboard;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const { year, month } = parseMonthParam(monthParam);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const prevHref = `?month=${monthParamOf(prevDate.getFullYear(), prevDate.getMonth() + 1)}`;
  const nextHref = `?month=${monthParamOf(nextDate.getFullYear(), nextDate.getMonth() + 1)}`;
  const monthLabel = monthStart.toLocaleDateString(locale === "zh" ? "zh-TW" : "en-US", {
    month: "long",
    year: "numeric",
  });

  const [todayCount, todayRevenueAgg, monthOrders, branch, categoryCount, itemCount] =
    await Promise.all([
      prisma.order.count({
        where: { branchId, createdAt: { gte: startOfToday, lt: startOfTomorrow } },
      }),
      prisma.order.aggregate({
        where: { branchId, status: "COMPLETED", createdAt: { gte: startOfToday, lt: startOfTomorrow } },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: { branchId, createdAt: { gte: monthStart, lt: monthEnd } },
        select: { id: true, createdAt: true, status: true, totalAmount: true },
      }),
      prisma.branch.findUnique({
        where: { id: branchId },
        select: { address: true, phone: true, hours: true },
      }),
      prisma.menuCategory.count({ where: { tenantId: tenant!.id } }),
      prisma.menuItem.count({ where: { tenantId: tenant!.id } }),
    ]);

  const onboardingSteps: OnboardingStep[] = [
    {
      key: "logo",
      label: t.onboarding.logoLabel,
      description: t.onboarding.logoDescription,
      done: !!tenant!.logoUrl,
      href: `/${tenantSlug}/admin/settings`,
    },
    {
      key: "category",
      label: t.onboarding.categoryLabel,
      description: t.onboarding.categoryDescription,
      done: categoryCount > 0,
      href: `/${tenantSlug}/admin/${branchId}/menu`,
    },
    {
      key: "item",
      label: t.onboarding.itemLabel,
      description: t.onboarding.itemDescription,
      done: itemCount > 0,
      href: `/${tenantSlug}/admin/${branchId}/menu`,
    },
    {
      key: "hours",
      label: t.onboarding.hoursLabel,
      description: t.onboarding.hoursDescription,
      done:
        !!branch &&
        branch.address !== PLACEHOLDER_ADDRESS &&
        branch.phone !== PLACEHOLDER_PHONE &&
        branch.hours !== PLACEHOLDER_HOURS,
      href: `/${tenantSlug}/admin/${branchId}/settings`,
    },
  ];
  const onboardingComplete = onboardingSteps.every((s) => s.done);

  const completedMonthOrders = monthOrders.filter((o) => o.status === "COMPLETED");
  const monthRevenue = completedMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = completedMonthOrders.length
    ? Math.round(monthRevenue / completedMonthOrders.length)
    : 0;

  const bestSellers = completedMonthOrders.length
    ? await prisma.orderItem.groupBy({
        by: ["nameSnapshot"],
        where: { orderId: { in: completedMonthOrders.map((o) => o.id) } },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      })
    : [];

  const buckets = bucketOrdersByMonth(monthOrders, year, month);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink-900">
        {t.heading}
      </h1>

      {!onboardingComplete && <OnboardingChecklist steps={onboardingSteps} />}

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={ShoppingBag} label={t.todaysOrders} value={String(todayCount)} />
        <StatCard
          icon={DollarSign}
          label={t.todaysRevenue}
          value={`$${todayRevenueAgg._sum.totalAmount ?? 0}`}
        />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-ink-900">
            {monthLabel}
          </h2>
          <div className="flex items-center gap-1">
            <Link
              href={prevHref}
              className="inline-flex size-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100"
              aria-label={t.previousMonth}
            >
              <ChevronLeft className="size-4" />
            </Link>
            {isCurrentMonth ? (
              <span className="inline-flex size-8 items-center justify-center rounded-lg text-ink-200">
                <ChevronRight className="size-4" />
              </span>
            ) : (
              <Link
                href={nextHref}
                className="inline-flex size-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100"
                aria-label={t.nextMonth}
              >
                <ChevronRight className="size-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <MonthStat icon={ShoppingBag} label={t.orders} value={String(monthOrders.length)} />
          <MonthStat icon={DollarSign} label={t.revenue} value={`$${monthRevenue}`} />
          <MonthStat icon={Receipt} label={t.avgOrder} value={`$${avgOrderValue}`} />
        </div>

        <MonthlyBarChart buckets={buckets} />
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold text-ink-900">
          <Trophy className="size-4 text-gold-600" />
          {t.bestSellers}
          <span className="text-sm font-normal text-ink-400">({monthLabel})</span>
        </h2>
        {bestSellers.length === 0 ? (
          <p className="text-sm text-ink-400">{t.noCompletedOrders}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {bestSellers.map((item, i) => (
              <div key={item.nameSnapshot} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cream-100 text-xs font-semibold text-ink-500">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-ink-900">{item.nameSnapshot}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink-900">
                    {formatMessage(t.sold, { count: item._sum.quantity ?? 0 })}
                  </p>
                  <p className="text-xs text-ink-400">${item._sum.subtotal}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShoppingBag;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <Icon className="size-4 text-brand-500" />
      <p className="text-xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </Card>
  );
}

function MonthStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShoppingBag;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-cream-50 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-ink-400">
        <Icon className="size-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-bold text-ink-900">{value}</p>
    </div>
  );
}
