import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "peabod_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Redirect non-www to www in production
  if (host === "peabod.com") {
    const url = request.nextUrl.clone();
    url.host = "www.peabod.com";
    return NextResponse.redirect(url, 301);
  }

  // Allow access to login page without auth
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Check if accessing admin routes (except API routes which handle their own auth)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/api")) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      // No session cookie - redirect to admin login
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
