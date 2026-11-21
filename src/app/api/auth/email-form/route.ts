import { NextRequest, NextResponse } from "next/server";

import { getCanonicalAppOrigin } from "@/lib/app-origin";
import { authPageHref } from "@/lib/auth/email-flows";
import { callAuthEndpoint } from "@/lib/auth/endpoint";
import { safeLocalCallback } from "@/lib/auth/local-callback";

function redirectWithCookies(destination: string, cookies: readonly string[] = []) {
  const response = NextResponse.redirect(
    new URL(destination, getCanonicalAppOrigin()),
    { status: 303 },
  );
  for (const cookie of cookies) response.headers.append("set-cookie", cookie);
  return response;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const text = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  };
  const callbackURL = safeLocalCallback(form.get("callbackURL"), getCanonicalAppOrigin());

  const result = await callAuthEndpoint("/sign-in/email", {
    email: text("email"),
    password: text("password"),
    callbackURL,
  });

  return result.ok
    ? redirectWithCookies(callbackURL, result.cookies)
    : redirectWithCookies(authPageHref("signIn", { redirect: callbackURL, error: result.code }));
}
