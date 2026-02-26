import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/verify-email"];

function extractProjectSlug(request: NextRequest): string | null {
  const host = request.headers.get("host") ?? "";
  const baseDomain = process.env.BASE_DOMAIN;

  // localhost / dev: use DEV_PROJECT_SLUG
  if (!baseDomain || host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return process.env.DEV_PROJECT_SLUG ?? "tandem";
  }

  // Apex domain or www — no project slug
  if (host === baseDomain || host === `www.${baseDomain}`) {
    return null;
  }

  // Subdomain extraction: {slug}.toscanaproducciones.com
  if (host.endsWith(`.${baseDomain}`)) {
    return host.slice(0, -(baseDomain.length + 1));
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|css|js|sh)$/)
  ) {
    return NextResponse.next();
  }

  const projectSlug = extractProjectSlug(request);

  // API routes: set header but skip auth checks
  if (pathname.startsWith("/api")) {
    const response = NextResponse.next();
    if (projectSlug) {
      response.headers.set("x-project-slug", projectSlug);
    }
    return response;
  }

  // Apex/www with no project slug — pass through (landing page)
  if (!projectSlug) {
    return NextResponse.next();
  }

  // Set project slug header for downstream
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-project-slug", projectSlug);

  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  if (!sessionCookie && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
