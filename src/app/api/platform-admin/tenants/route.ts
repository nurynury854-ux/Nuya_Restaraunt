import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformSession } from "@/lib/platformAuth";
import { handleApiError } from "@/lib/apiResponse";
import {
  formatCalendarDate,
  getBillingState,
  isStorefrontOpen,
  paidDaysRemaining,
  trialDaysRemaining,
} from "@/lib/billing";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    await requirePlatformSession();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    // "unpaid" = never approved — the list to work through when matching
    // incoming bank transfers.
    const unpaidOnly = searchParams.get("filter") === "unpaid";

    const where: Prisma.TenantWhereInput = {
      ...(unpaidOnly ? { approvedAt: null } : {}),
      ...(q
        ? {
            OR: [
              { businessName: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
              { paymentReference: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [tenants, total, unpaidCount] = await Promise.all([
      prisma.tenant.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          adminUsers: { take: 1, orderBy: { createdAt: "asc" }, select: { email: true } },
          _count: { select: { branches: true, orders: true } },
        },
      }),
      prisma.tenant.count({ where }),
      prisma.tenant.count({ where: { approvedAt: null } }),
    ]);

    return NextResponse.json({
      tenants: tenants.map((t) => ({
        id: t.id,
        slug: t.slug,
        businessName: t.businessName,
        isActive: t.isActive,
        billingState: getBillingState(t),
        // The same answer a visitor to their site would get, so this column
        // can't drift from what's actually being served.
        siteLive: isStorefrontOpen(t),
        trialDaysLeft: trialDaysRemaining(t.trialEndsAt),
        paidDaysLeft: paidDaysRemaining(t),
        approvedAt: t.approvedAt,
        paidThrough: t.paidThrough ? formatCalendarDate(t.paidThrough) : null,
        paymentReference: t.paymentReference,
        billingNote: t.billingNote,
        createdAt: t.createdAt,
        ownerEmail: t.adminUsers[0]?.email ?? null,
        branchCount: t._count.branches,
        orderCount: t._count.orders,
      })),
      total,
      unpaidCount,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
