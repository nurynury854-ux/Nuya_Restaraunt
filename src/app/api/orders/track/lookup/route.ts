import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiResponse";
import { orderLookupSchema } from "@/lib/validation";
import { getTenantBySlug } from "@/lib/tenant";
import { isStorefrontOpen } from "@/lib/billing";
import { rateLimit, enforceBodyLimit, RATE_LIMITS, BODY_LIMITS } from "@/lib/rateLimit";

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/**
 * For a customer who lost their tracking link: find it again with the order
 * number they were given plus the phone they placed it under. Requiring
 * both (not just the order number, which is short and per-tenant-
 * sequential — easy to enumerate) is the ownership check here, in place of
 * an account system this app doesn't have.
 */
export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "order-lookup", RATE_LIMITS.orderLookup);
    if (limited) return limited;
    const tooLarge = enforceBodyLimit(request, BODY_LIMITS.json);
    if (tooLarge) return tooLarge;

    const body = await request.json();
    const data = orderLookupSchema.parse(body);

    const tenant = await getTenantBySlug(data.tenantSlug);
    if (!isStorefrontOpen(tenant)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderNo = data.orderNo.trim().toUpperCase();
    const phoneDigits = digitsOnly(data.phone);

    const order = await prisma.order.findUnique({
      where: { tenantId_orderNo: { tenantId: tenant!.id, orderNo } },
      select: { id: true, customerPhone: true },
    });

    if (!order || digitsOnly(order.customerPhone) !== phoneDigits) {
      return NextResponse.json(
        { error: "We couldn't find an order with that number and phone" },
        { status: 404 }
      );
    }

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    return handleApiError(error);
  }
}
