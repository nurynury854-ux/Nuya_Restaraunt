import { NextRequest, NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validation";
import { checkPlatformCredentials, signPlatformSession, PLATFORM_SESSION_COOKIE } from "@/lib/platformAuth";
import { rateLimit, enforceBodyLimit, RATE_LIMITS, BODY_LIMITS } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
  try {
    // Per-IP is the only identity available here: the platform owner is a
    // single env-configured credential pair, not a row keyed by email.
    const limited = rateLimit(request, "platform-login", RATE_LIMITS.login);
    if (limited) return limited;
    const tooLarge = enforceBodyLimit(request, BODY_LIMITS.json);
    if (tooLarge) return tooLarge;

    const body = await request.json();
    const { email, password } = adminLoginSchema.parse(body);

    if (!checkPlatformCredentials(email, password)) {
      return NextResponse.json(
        { error: "Incorrect email or password", code: "invalid_credentials" },
        { status: 401 }
      );
    }

    const token = signPlatformSession();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(PLATFORM_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
