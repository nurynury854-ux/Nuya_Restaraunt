import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiResponse";
import { verifyEmailSchema } from "@/lib/validation";
import { consumeAuthToken } from "@/lib/authTokens";
import { rateLimit, enforceBodyLimit, RATE_LIMITS, BODY_LIMITS } from "@/lib/rateLimit";

/**
 * Redeems an email-verification token.
 *
 * This is a POST, and the link in the email lands on a page with a confirm
 * button rather than verifying on arrival, because the token is single-use:
 * anything that fetches the URL spends it. Corporate mail security (Outlook
 * Safe Links, scanning gateways, link previews) follows links with GET before
 * a human ever clicks, which would leave the real user staring at "this
 * verification link is invalid or has expired". Those scanners don't POST.
 */
export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "verifyEmail", RATE_LIMITS.verifyEmail);
    if (limited) return limited;
    const tooLarge = enforceBodyLimit(request, BODY_LIMITS.json);
    if (tooLarge) return tooLarge;

    const body = await request.json();
    const { token } = verifyEmailSchema.parse(body);

    const consumed = await consumeAuthToken(token, "EMAIL_VERIFICATION");
    if (!consumed) {
      return NextResponse.json(
        { error: "This verification link is invalid or has expired.", code: "invalid_token" },
        { status: 400 }
      );
    }

    const admin = await prisma.adminUser.update({
      where: { id: consumed.adminUserId },
      data: { emailVerified: true },
      include: { tenant: true },
    });

    return NextResponse.json({ ok: true, tenantSlug: admin.tenant.slug });
  } catch (error) {
    return handleApiError(error);
  }
}
