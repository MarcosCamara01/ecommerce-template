import { type NextRequest, NextResponse } from "next/server";

import { canonicalRequestRedirect } from "@/lib/app-origin";
import { getPrincipalFromHeaders, hasCapability } from "@/lib/identity";
import {
  NOT_FOUND_INTERNAL_PATH,
  pathShould404,
} from "@/lib/routing/unknown-path";

export async function proxy(request: NextRequest) {
  const canonicalRedirect = canonicalRequestRedirect(
    request.nextUrl,
    request.headers.get("host"),
    request.headers.get("x-forwarded-proto")?.split(",", 1)[0] ?? null,
  );
  if (canonicalRedirect) return NextResponse.redirect(canonicalRedirect);

  const protectedRoutes = ["/orders", "/admin"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (isProtectedRoute) {
    const principal = await getPrincipalFromHeaders(request.headers);
    if (!principal) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (
      request.nextUrl.pathname.startsWith("/admin") &&
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
