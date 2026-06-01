import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_EXACT = ["/"];
const PUBLIC_PREFIX = ["/login", "/register", "/verify-email", "/privacy", "/terms", "/onboarding"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIX.some((p) => pathname.startsWith(p));
  const authCookie = request.cookies.get("session");

  if (!isPublic && !authCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Exclude /api — those requests are proxied straight to the backend (see
  // next.config.ts rewrites). The middleware must not intercept them, otherwise
  // unauthenticated calls like POST /api/auth/demo get redirected to /login.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|fonts|.*\\.png$).*)"],
};
