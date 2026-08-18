import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiResponse";
import { requireAdminSession } from "@/lib/adminAuth";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { sendVerificationEmail } from "@/lib/email/authEmails";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    const limited = rateLimit(request, `resendVerification:${session.sub}`, RATE_LIMITS.resendVerification);
    if (limited) return limited;

    const admin = await prisma.adminUser.findUnique({
      where: { id: session.sub },
      include: { tenant: true },
    });
    if (!admin) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (admin.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    const sent = await sendVerificationEmail({
      adminUserId: admin.id,
      to: admin.email,
      businessName: admin.tenant.businessName,
      origin: request.nextUrl.origin,
    });
    if (!sent) {
      return NextResponse.json({ error: "Couldn't send the email. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
