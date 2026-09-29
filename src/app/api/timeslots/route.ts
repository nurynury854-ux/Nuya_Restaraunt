import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertTenantOwns, requireAdminSession } from "@/lib/adminAuth";
import { handleApiError } from "@/lib/apiResponse";
import { timeSlotCreateSchema } from "@/lib/validation";
import { getTenantBySlug } from "@/lib/tenant";
import { isStorefrontOpen } from "@/lib/billing";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const branchId = params.get("branchId");
  const method = params.get("method");
  const wantAll = params.get("all") === "1";

  try {
    let tenantId: string;

    if (wantAll) {
      // Admin view (includes inactive slots) — must be authenticated.
      const session = await requireAdminSession();
      tenantId = session.tenantId;
    } else {
      // Public customer-facing view — resolve tenant from the slug instead.
      const slug = params.get("tenant");
      if (!slug) {
        return NextResponse.json({ error: "Missing tenant" }, { status: 400 });
      }
      const tenant = await getTenantBySlug(slug);
      if (!isStorefrontOpen(tenant)) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
      }
      tenantId = tenant!.id;
    }

    const slots = await prisma.timeSlot.findMany({
      where: {
        tenantId,
        ...(branchId ? { branchId } : {}),
        ...(method ? { method } : {}),
        ...(wantAll ? {} : { isActive: true }),
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ slots });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const data = timeSlotCreateSchema.parse(body);

    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    assertTenantOwns(branch, session.tenantId);

    const slot = await prisma.timeSlot.create({
      data: { ...data, tenantId: session.tenantId },
    });
    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
