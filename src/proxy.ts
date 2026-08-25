import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/session";
import { PLATFORM_SESSION_COOKIE, verifyPlatformSession } from "@/lib/platformAuth";
import { ADMIN_PATH } from "@/lib/redirects";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/platform-admin" || pathname.startsWith("/platform-admin/")) {
    if (pathname === "/platform-admin/login") return NextResponse.next();
    const token = request.cookies.get(PLATFORM_SESSION_COOKIE)?.value;
    if (!verifyPlatformSession(token)) {
      return NextResponse.redirect(new URL("/platform-admin/login", request.url));
    }
    return NextResponse.next();
  }

  const match = pathname.match(ADMIN_PATH);
  if (!match) return NextResponse.next();

  const tenantSlug = match[1];
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = verifyAdminSession(token);

  // No session, or the session belongs to a different tenant than the one
  // in the URL — either way, this admin panel isn't theirs to see.
  if (!session || session.tenantSlug !== tenantSlug) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:tenantSlug/admin/:path*", "/platform-admin/:path*"],
};
