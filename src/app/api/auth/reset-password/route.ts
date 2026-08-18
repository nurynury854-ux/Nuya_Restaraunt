import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiResponse";
import { resetPasswordSchema } from "@/lib/validation";
import { rateLimit, enforceBodyLimit, RATE_LIMITS, BODY_LIMITS } from "@/lib/rateLimit";
import { consumeAuthToken } from "@/lib/authTokens";
import { ADMIN_SESSION_COOKIE, signAdminSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "resetPassword", RATE_LIMITS.resetPassword);
    if (limited) return limited;
    const tooLarge = enforceBodyLimit(request, BODY_LIMITS.json);
    if (tooLarge) return tooLarge;

    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const consumed = await consumeAuthToken(token, "PASSWORD_RESET");
    if (!consumed) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Clicking a reset link proves the same thing an email-verification link
    // does — that this inbox belongs to this admin — so this also settles
    // emailVerified rather than leaving the "please verify" banner nagging
    // someone who's just proven ownership.
    const admin = await prisma.adminUser.update({
      where: { id: consumed.adminUserId },
      data: { passwordHash, emailVerified: true },
      include: { tenant: true },
    });

    const sessionToken = signAdminSession({
      sub: admin.id,
      email: admin.email,
      tenantId: admin.tenantId,
      tenantSlug: admin.tenant.slug,
    });
    const response = NextResponse.json({ ok: true, tenantSlug: admin.tenant.slug });
    response.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
