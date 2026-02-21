import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const publicPaths = ["/login", "/reset-password", "/change-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const isAuthApi = pathname.startsWith("/api/auth");

  if (isAuthApi) return NextResponse.next();

  const mustChangePassword = (req.auth?.user as { mustChangePassword?: boolean } | undefined)?.mustChangePassword;
  if (isLoggedIn && mustChangePassword && !pathname.startsWith("/change-password")) {
    return NextResponse.redirect(new URL("/change-password", req.nextUrl.origin));
  }

  // Redirect root to /tests (Tests is the primary landing page)
  if (isLoggedIn && pathname === "/") {
    return NextResponse.redirect(new URL("/tests", req.nextUrl.origin));
  }

  if (!isLoggedIn && !isPublicPath) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isPublicPath) {
    if (pathname.startsWith("/change-password") && mustChangePassword) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/tests", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
