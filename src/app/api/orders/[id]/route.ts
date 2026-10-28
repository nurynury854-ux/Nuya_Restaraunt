import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertTenantOwns, requireAdminSession } from "@/lib/adminAuth";
import { handleApiError } from "@/lib/apiResponse";
import { updateOrderStatusSchema } from "@/lib/validation";
import { notifyOrderCompleted } from "@/lib/sms";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { modifiers: true } }, branch: true, timeSlot: true },
    });
    assertTenantOwns(order, session.tenantId);
    return NextResponse.json({ order });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    const { id } = await params;
    const existing = await prisma.order.findUnique({ where: { id } });
    assertTenantOwns(existing, session.tenantId);

    const body = await request.json();
    const data = updateOrderStatusSchema.parse(body);
    const order = await prisma.order.update({
      where: { id },
      data: { status: data.status },
      include: { items: { include: { modifiers: true } }, branch: true, timeSlot: true },
    });

    // Best-effort customer SMS, only on the actual PENDING -> COMPLETED
    // transition (not re-saving an already-completed order, which would
    // otherwise re-text the customer every time).
    if (data.status === "COMPLETED" && existing!.status !== "COMPLETED") {
      const tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
        select: { businessName: true, smsUsername: true, smsPasswordEnc: true },
      });
      if (tenant) after(() => notifyOrderCompleted({ tenant, order }));
    }

    return NextResponse.json({ order });
  } catch (error) {
    return handleApiError(error);
  }
}
