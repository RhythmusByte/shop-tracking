import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "store_tracker_session";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (isPublic) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return redirectOrDeny(req, pathname);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // User management is admin-only. Everything else just needs a valid
    // logged-in session (any role).
    const needsAdmin = pathname.startsWith("/api/users") || pathname.startsWith("/users");
    if (needsAdmin && payload.role !== "admin") {
      return redirectOrDeny(req, pathname, true);
    }

    return NextResponse.next();
  } catch {
    return redirectOrDeny(req, pathname);
  }
}

function redirectOrDeny(req, pathname, forbidden = false) {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: forbidden ? "Admins only" : "Unauthorized" },
      { status: forbidden ? 403 : 401 }
    );
  }
  if (forbidden) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
