import { type NextRequest, NextResponse } from "next/server";

import {
  canonicalRequestRedirect,
  getCanonicalAppOrigin,
} from "@/lib/app-origin";
import { getPrincipalFromHeaders, hasCapability } from "@/lib/identity";
import {
  NOT_FOUND_INTERNAL_PATH,
  pathShould404,
} from "@/lib/routing/unknown-path";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Browsers attach the session cookie to writes other origins start. Better Auth
// checks Origin on its own routes, except our update-user, which calls auth.api
// without a Request. Stripe signs its webhooks and cron takes a bearer secret.
function apiWriteNeedsSameOrigin(pathname: string): boolean {
  if (pathname === "/api/auth/update-user") return true;
  return (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    !pathname.startsWith("/api/cron/") &&
    pathname !== "/api/stripe/webhooks"
  );
}

function crossOriginWriteRejection(request: NextRequest) {
  if (
    SAFE_METHODS.has(request.method) ||
    !request.headers.has("cookie") ||
    !apiWriteNeedsSameOrigin(request.nextUrl.pathname) ||
    request.headers.get("origin") === getCanonicalAppOrigin()
  ) return null;
  return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Vercel Cron calls the deployment's own host and does not follow redirects.
  // Job routes check CRON_SECRET themselves, so the host does not matter.
  const isScheduledJob = pathname.startsWith("/api/cron/");
  const canonicalRedirect = isScheduledJob
    ? null
    : canonicalRequestRedirect(
        request.nextUrl,
        request.headers.get("host"),
        request.headers.get("x-forwarded-proto")?.split(",", 1)[0] ?? null,
      );
  if (canonicalRedirect) return NextResponse.redirect(canonicalRedirect);

  const originRejection = crossOriginWriteRejection(request);
  if (originRejection) return originRejection;

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isProtectedRoute =
    isAdminRoute || pathname === "/orders" || pathname.startsWith("/orders/");

  if (isProtectedRoute) {
    const principal = await getPrincipalFromHeaders(request.headers);
    if (!principal) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (
      isAdminRoute &&
      !hasCapability(principal, "catalog:manage")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Dynamic [category] would otherwise render unknown slugs as a streamed 200.
  // Rewrite to an unmatched path so Next.js not-found handling can return 404.
  if (pathShould404(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = NOT_FOUND_INTERNAL_PATH;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
