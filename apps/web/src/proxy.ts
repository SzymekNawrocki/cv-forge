import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/verify-email"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const hasAuth = request.cookies.has("auth");

  if (!isPublic && !hasAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublic && hasAuth && !pathname.startsWith("/verify-email")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|.*\\.png$).*)"],
};
