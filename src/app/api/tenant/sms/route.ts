import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { handleApiError } from "@/lib/apiResponse";
import { smsSettingsUpdateSchema } from "@/lib/validation";
import { encryptSecret } from "@/lib/secretCrypto";

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const { smsUsername, smsPassword } = smsSettingsUpdateSchema.parse(body);

    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: {
        smsUsername,
        smsPasswordEnc: smsPassword ? encryptSecret(smsPassword) : null,
      },
    });

    // Never echo the credential back, encrypted or not — the caller doesn't
    // need it, and there's no reason for it to cross the wire a second time.
    return NextResponse.json({ ok: true, configured: !!smsUsername });
  } catch (error) {
    return handleApiError(error);
  }
}
