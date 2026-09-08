import { NextRequest, NextResponse } from "next/server";

import { getCanonicalAppOrigin } from "@/lib/app-origin";
import { safeLocalCallback } from "@/lib/auth/local-callback";
import { auth } from "@/utils/auth";

type FormMode = "sign-in" | "sign-up";

const modeEndpoints: Record<FormMode, string> = {
  "sign-in": "/api/auth/sign-in/email",
  "sign-up": "/api/auth/sign-up/email",
};

function redirectWithCookies(destination: string, upstream?: Response) {
  const response = NextResponse.redirect(
    new URL(destination, getCanonicalAppOrigin()),
    { status: 303 },
  );
  const headers = upstream?.headers as
    | (Headers & { getSetCookie?: () => string[] })
    | undefined;
  const cookies = headers?.getSetCookie?.() ?? [];
  if (!cookies.length) {
    const cookie = upstream?.headers.get("set-cookie");
    if (cookie) cookies.push(cookie);
  }
  for (const cookie of cookies) response.headers.append("set-cookie", cookie);
  return response;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const mode = form.get("mode");
  if (mode !== "sign-in" && mode !== "sign-up") {
    return redirectWithCookies("/login?error=invalid_request");
  }

  const callbackURL = safeLocalCallback(
    form.get("callbackURL"),
    getCanonicalAppOrigin(),
  );
  const body = new URLSearchParams();
  for (const field of mode === "sign-in"
    ? ["email", "password"]
    : ["name", "email", "password"]) {
    const value = form.get(field);
    if (typeof value === "string") body.set(field, value);
  }
  body.set("callbackURL", callbackURL);

  const headers = new Headers(request.headers);
  headers.set("content-type", "application/x-www-form-urlencoded");
  headers.delete("content-length");
  const upstream = await auth.handler(
    new Request(new URL(modeEndpoints[mode], getCanonicalAppOrigin()), {
      method: "POST",
      headers,
      body,
    }),
  );

  if (!upstream.ok) {
    return redirectWithCookies(
      mode === "sign-in"
        ? "/login?error=invalid_credentials"
        : "/register?error=registration_failed",
    );
  }

  return redirectWithCookies(
    mode === "sign-up" ? "/login?notice=check-email" : callbackURL,
    upstream,
  );
}
