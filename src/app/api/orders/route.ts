import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { handleApiError } from "@/lib/apiResponse";
import { createOrderSchema } from "@/lib/validation";
import { generateOrderNumber } from "@/lib/orderNumber";
import { PENDING_STATUSES, COMPLETED_STATUSES } from "@/lib/constants";
import { getTenantBySlug } from "@/lib/tenant";
import { isStorefrontOpen } from "@/lib/billing";
import { rateLimit, enforceBodyLimit, RATE_LIMITS, BODY_LIMITS } from "@/lib/rateLimit";
import { todayPartsInTimezone, dateOnlyUTC } from "@/lib/timezone";

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "order", RATE_LIMITS.orderCreate);
    if (limited) return limited;
    const tooLarge = enforceBodyLimit(request, BODY_LIMITS.order);
    if (tooLarge) return tooLarge;

    const body = await request.json();
    const data = createOrderSchema.parse(body);

    const tenant = await getTenantBySlug(data.tenantSlug);
    if (!isStorefrontOpen(tenant)) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    const tenantId = tenant!.id;

    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch || branch.tenantId !== tenantId || !branch.isActive) {
      return NextResponse.json({ error: "This location isn't available" }, { status: 400 });
    }

    const todayParts = todayPartsInTimezone(tenant!.timezone);
    const closure = await prisma.branchClosure.findUnique({
      where: {
        branchId_date: {
          branchId: data.branchId,
          date: dateOnlyUTC(todayParts.year, todayParts.month, todayParts.day),
        },
      },
    });
    if (closure) {
      return NextResponse.json(
        { error: closure.reason ? `Closed today — ${closure.reason}` : "This location is closed today" },
        { status: 400 }
      );
    }

    const menuItemIds = data.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, tenantId },
      include: { modifierGroups: { include: { options: true } } },
    });
    if (menuItems.length !== new Set(menuItemIds).size) {
      return NextResponse.json(
        { error: "Some items in your cart no longer exist — please check your cart" },
        { status: 400 }
      );
    }
    const unavailable = menuItems.find((m) => !m.isAvailable);
    if (unavailable) {
      return NextResponse.json(
        { error: `"${unavailable.name}" is no longer available — please remove it from your cart` },
        { status: 400 }
      );
    }

    for (const orderItem of data.items) {
      const menuItem = menuItems.find((m) => m.id === orderItem.menuItemId)!;
      const selectedIds = new Set(orderItem.modifierOptionIds ?? []);
      const allOptionIds = new Set(menuItem.modifierGroups.flatMap((g) => g.options.map((o) => o.id)));
      for (const id of selectedIds) {
        if (!allOptionIds.has(id)) {
          return NextResponse.json(
            {
              error: `An option for "${menuItem.name}" is no longer available — please check your cart`,
            },
            { status: 400 }
          );
        }
      }
      for (const group of menuItem.modifierGroups) {
        const chosen = group.options.filter((o) => selectedIds.has(o.id));
        const unavailableChoice = chosen.find((o) => !o.isAvailable);
        if (unavailableChoice) {
          return NextResponse.json(
            {
              error: `"${unavailableChoice.name}" is no longer available — please update "${menuItem.name}"`,
            },
            { status: 400 }
          );
        }
        const max = group.maxSelect ?? Infinity;
        if (chosen.length < group.minSelect || chosen.length > max) {
          return NextResponse.json(
            { error: `Please pick a valid "${group.name}" selection for "${menuItem.name}"` },
            { status: 400 }
          );
        }
      }
    }

    if (data.timeSlotId) {
      const slot = await prisma.timeSlot.findUnique({ where: { id: data.timeSlotId } });
      const expectedMethod = data.diningMethod === "DELIVERY" ? "DELIVERY" : "PICKUP";
      if (
        !slot ||
        slot.tenantId !== tenantId ||
        !slot.isActive ||
        slot.branchId !== data.branchId ||
        slot.method !== expectedMethod
      ) {
        return NextResponse.json(
          { error: "That time slot is no longer available — please pick another" },
          { status: 400 }
        );
      }
    }

    const itemsWithPrice = data.items.map((orderItem) => {
      const menuItem = menuItems.find((m) => m.id === orderItem.menuItemId)!;
      const selectedIds = new Set(orderItem.modifierOptionIds ?? []);
      const chosenOptions = menuItem.modifierGroups.flatMap((g) =>
        g.options
          .filter((o) => selectedIds.has(o.id))
          .map((o) => ({ option: o, groupName: g.name }))
      );
      const unitPrice = menuItem.price + chosenOptions.reduce((sum, c) => sum + c.option.priceDelta, 0);
      return {
        menuItemId: menuItem.id,
        nameSnapshot: menuItem.name,
        priceSnapshot: unitPrice,
        quantity: orderItem.quantity,
        subtotal: unitPrice * orderItem.quantity,
        modifiers: {
          create: chosenOptions.map((c) => ({
            modifierOptionId: c.option.id,
            groupNameSnapshot: c.groupName,
            nameSnapshot: c.option.name,
            priceDeltaSnapshot: c.option.priceDelta,
          })),
        },
      };
    });
    const totalAmount = itemsWithPrice.reduce((sum, i) => sum + i.subtotal, 0);
    const orderNo = await generateOrderNumber(tenantId, tenant!.slug.slice(0, 3).toUpperCase());

    const order = await prisma.order.create({
      data: {
        tenantId,
        orderNo,
        branchId: data.branchId,
        diningMethod: data.diningMethod,
        tableNumber: data.tableNumber,
        timeSlotId: data.timeSlotId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        paymentMethod: data.paymentMethod,
        totalAmount,
        items: { create: itemsWithPrice },
      },
      include: { items: { include: { modifiers: true } }, branch: true, timeSlot: true },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

const HISTORY_PAGE_SIZE = 25;

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    const params = request.nextUrl.searchParams;
    const branchId = params.get("branchId");
    const status = params.get("status");
    const bucket = params.get("bucket"); // "pending" | "completed"
    const diningMethod = params.get("diningMethod");
    const orderNo = params.get("orderNo")?.trim();
    const phone = params.get("phone")?.trim();
    const dateFrom = params.get("dateFrom");
    const dateTo = params.get("dateTo");
    const page = params.get("page");

    const bucketStatuses =
      bucket === "pending"
        ? PENDING_STATUSES
        : bucket === "completed"
          ? COMPLETED_STATUSES
          : null;

    const where = {
      tenantId: session.tenantId,
      ...(branchId ? { branchId } : {}),
      ...(bucketStatuses ? { status: { in: bucketStatuses } } : {}),
      ...(status ? { status } : {}),
      ...(diningMethod ? { diningMethod } : {}),
      ...(orderNo ? { orderNo: { contains: orderNo, mode: "insensitive" as const } } : {}),
      ...(phone ? { customerPhone: { contains: phone } } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00`) } : {}),
              ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999`) } : {}),
            },
          }
        : {}),
    };

    // Pagination is opt-in (only when `page` is passed) so the existing
    // pending/completed boards — which poll this endpoint every few seconds
    // without a `page` param — keep their current unpaginated response shape.
    if (page) {
      const pageNum = Math.max(1, Number(page) || 1);
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: { items: { include: { modifiers: true } }, branch: true, timeSlot: true },
          orderBy: { createdAt: "desc" },
          skip: (pageNum - 1) * HISTORY_PAGE_SIZE,
          take: HISTORY_PAGE_SIZE,
        }),
        prisma.order.count({ where }),
      ]);
      return NextResponse.json({ orders, total, page: pageNum, pageSize: HISTORY_PAGE_SIZE });
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { modifiers: true } }, branch: true, timeSlot: true },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return handleApiError(error);
  }
}
