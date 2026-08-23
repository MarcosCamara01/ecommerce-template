import { type NextRequest, NextResponse } from "next/server";

import { canonicalRequestRedirect } from "@/lib/app-origin";
import { getPrincipalFromHeaders, hasCapability } from "@/lib/identity";

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

  if (!isProtectedRoute) return NextResponse.next();

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
