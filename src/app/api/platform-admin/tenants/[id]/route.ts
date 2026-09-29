import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformSession } from "@/lib/platformAuth";
import { NotFoundError } from "@/lib/adminAuth";
import { handleApiError } from "@/lib/apiResponse";
import { platformTenantUpdateSchema } from "@/lib/validation";
import { parseCalendarDate } from "@/lib/billing";
import { ensurePaymentReference } from "@/lib/paymentReference";
import type { Prisma } from "@/generated/prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePlatformSession();
    const { id } = await params;
    const body = await request.json();
    const input = platformTenantUpdateSchema.parse(body);

    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError();

    const data: Prisma.TenantUpdateInput = {};
    if (input.isActive !== undefined) data.isActive = input.isActive;

    if (input.revokeApproval) {
      data.approvedAt = null;
      data.paidThrough = null;
      // A tenant from before billing has no trial date at all; stamp an
      // already-ended one so prisma/grandfatherBilling.ts (which matches
      // "never approved, no trial date") can't re-approve them on a re-run.
      data.trialEndsAt = existing.trialEndsAt ?? new Date();
    } else if (input.payment) {
      // Recording a payment is what approves a tenant. Keep the original
      // approval date on later renewals so it still says when they first paid.
      data.approvedAt = existing.approvedAt ?? new Date();
      data.paidThrough = input.payment.paidThrough
        ? parseCalendarDate(input.payment.paidThrough)
        : null;
      if (input.payment.billingNote !== undefined) {
        data.billingNote = input.payment.billingNote || null;
      }
      // Older tenants predate references; give them one now so it's on
      // record next to the payment it was matched against.
      await ensurePaymentReference(existing);
    }

    const tenant = await prisma.tenant.update({ where: { id }, data });
    return NextResponse.json({ tenant });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Deletes a tenant and everything under it. Rows are removed in dependency
 * order (children before parents) inside one transaction rather than relying
 * on FK cascade resolution, since a few child tables use onDelete: Restrict
 * against each other (e.g. Order -> Branch, MenuItem -> MenuCategory) to
 * protect normal single-record deletes elsewhere in the app — those same
 * constraints would block an unordered bulk delete here.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePlatformSession();
    const { id } = await params;

    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError();

    await prisma.$transaction([
      prisma.order.deleteMany({ where: { tenantId: id } }),
      prisma.menuItem.deleteMany({ where: { tenantId: id } }),
      prisma.menuCategory.deleteMany({ where: { tenantId: id } }),
      prisma.branch.deleteMany({ where: { tenantId: id } }),
      prisma.adminUser.deleteMany({ where: { tenantId: id } }),
      prisma.tenant.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
