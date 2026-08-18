import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiResponse";
import { forgotPasswordSchema } from "@/lib/validation";
import { rateLimit, enforceBodyLimit, RATE_LIMITS, BODY_LIMITS } from "@/lib/rateLimit";
import { sendPasswordResetEmail } from "@/lib/email/authEmails";

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "forgotPassword", RATE_LIMITS.forgotPassword);
    if (limited) return limited;
    const tooLarge = enforceBodyLimit(request, BODY_LIMITS.json);
    if (tooLarge) return tooLarge;

    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
      include: { tenant: true },
    });

    // Always the same response whether or not the account exists — otherwise
    // this endpoint becomes a way to check which emails have an account.
    if (admin && admin.tenant.isActive) {
      sendPasswordResetEmail({
        adminUserId: admin.id,
        to: admin.email,
        businessName: admin.tenant.businessName,
        origin: request.nextUrl.origin,
      }).catch((error) => console.error("Failed to send password reset email:", error));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
