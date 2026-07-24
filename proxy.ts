import withAuth from "next-auth/middleware";
import { NextResponse } from "next/server";
import { authSecret } from "./lib/env";

export default withAuth(
  function proxy() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        if (
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/imagekit-auth") ||
          pathname === "/login" ||
          pathname === "/register"
        ) {
          return true;
        }

        if (
          pathname === "/" ||
          pathname.startsWith("/api/posts") ||
          pathname.startsWith("/api/videos")
        ) {
          return true;
        }

        return !!token;
      },
    },
    secret: authSecret,
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
