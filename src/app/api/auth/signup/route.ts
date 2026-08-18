import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiResponse";
import { signupSchema } from "@/lib/validation";
import { isSlugAllowed } from "@/lib/reservedSlugs";
import { ADMIN_SESSION_COOKIE, signAdminSession } from "@/lib/session";
import { rateLimit, enforceBodyLimit, RATE_LIMITS, BODY_LIMITS } from "@/lib/rateLimit";
import { sendVerificationEmail } from "@/lib/email/authEmails";

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "signup", RATE_LIMITS.signup);
    if (limited) return limited;
    const tooLarge = enforceBodyLimit(request, BODY_LIMITS.json);
    if (tooLarge) return tooLarge;

    const body = await request.json();
    const data = signupSchema.parse(body);
    const slug = data.slug.toLowerCase();
    const email = data.email.toLowerCase();

    if (!isSlugAllowed(slug)) {
      return NextResponse.json(
        { error: "That URL isn't available. Please choose another." },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.adminUser.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const { tenant, admin } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { slug, businessName: data.businessName, timezone: data.timezone ?? "UTC" },
      });
      await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: data.branchName,
          address: "Add your address",
          phone: "Add your phone number",
          hours: "Add your hours",
        },
      });
      const admin = await tx.adminUser.create({
        data: { tenantId: tenant.id, email, passwordHash },
      });
      return { tenant, admin };
    });

    const token = signAdminSession({
      sub: admin.id,
      email: admin.email,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    });

    // Best-effort — never blocks signup. Without a verified sending domain
    // yet, this only actually lands in an inbox for the Resend account's
    // own address; the admin can always retry later via the "resend" banner.
    sendVerificationEmail({
      adminUserId: admin.id,
      to: admin.email,
      businessName: tenant.businessName,
      origin: request.nextUrl.origin,
    }).catch((error) => console.error("Failed to send verification email:", error));

    const response = NextResponse.json({ ok: true, tenantSlug: tenant.slug }, { status: 201 });
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
