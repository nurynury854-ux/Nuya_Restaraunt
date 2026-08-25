import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiResponse";
import { adminLoginSchema } from "@/lib/validation";
import { ADMIN_SESSION_COOKIE, signAdminSession } from "@/lib/session";
import {
  rateLimit,
  rateLimitByKey,
  clearRateLimit,
  enforceBodyLimit,
  RATE_LIMITS,
  BODY_LIMITS,
} from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // Flood guard first — it's the one that has to run before we spend any
    // bcrypt or DB time on an unknown caller.
    const flooding = rateLimit(request, "loginIp", RATE_LIMITS.loginIp);
    if (flooding) return flooding;
    const tooLarge = enforceBodyLimit(request, BODY_LIMITS.json);
    if (tooLarge) return tooLarge;

    const body = await request.json();
    const { email, password } = adminLoginSchema.parse(body);
    const normalizedEmail = email.toLowerCase();

    // Guessing guard, scoped to the account being targeted. Parsing 16KB of
    // JSON to get here is cheap next to bcrypt, and keying on the email is
    // what stops one person's typos from locking out everyone who happens to
    // share their egress IP.
    const attemptsKey = `login:${normalizedEmail}`;
    const guessing = rateLimitByKey(attemptsKey, RATE_LIMITS.login);
    if (guessing) return guessing;

    const admin = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
      include: { tenant: true },
    });
    const passwordOk = admin ? await bcrypt.compare(password, admin.passwordHash) : false;

    if (!admin || !passwordOk) {
      return NextResponse.json(
        { error: "Incorrect email or password", code: "invalid_credentials" },
        { status: 401 }
      );
    }

    // Only checked once the password has already proved who they are, so this
    // never tells an anonymous guesser anything about the account. Reporting
    // it separately matters: folding it into the credentials error tells
    // someone whose site was switched off that their password is wrong, and
    // they'll chase that instead — right down to a password reset that
    // "works" and still leaves them unable to log in.
    if (!admin.tenant.isActive) {
      return NextResponse.json(
        { error: "This site has been deactivated. Please contact support.", code: "tenant_inactive" },
        { status: 403 }
      );
    }

    // They're in, so the earlier fumbled attempts shouldn't keep counting.
    clearRateLimit(attemptsKey);

    const token = signAdminSession({
      sub: admin.id,
      email: admin.email,
      tenantId: admin.tenantId,
      tenantSlug: admin.tenant.slug,
    });
    const response = NextResponse.json({ ok: true, tenantSlug: admin.tenant.slug });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
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
