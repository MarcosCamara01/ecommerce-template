import "server-only";

import { headers } from "next/headers";

import { getCanonicalAppOrigin } from "@/lib/app-origin";
import { auth } from "@/utils/auth";

import { type AuthErrorCode, authErrorCode } from "./form-errors";

type EndpointBodies = {
  "/sign-in/email": { email: string; password: string; callbackURL: string };
  "/sign-up/email": { name: string; email: string; password: string; callbackURL: string };
};

export type AuthEndpoint = keyof EndpointBodies;

export type AuthEndpointResult =
  | Readonly<{ ok: true; cookies: readonly string[] }>
  | Readonly<{ ok: false; code: AuthErrorCode }>;

/**
 * Goes through auth.handler, not auth.api: the rate limiter (keyed on
 * x-forwarded-for) and the origin check run only in Better Auth's router.
 * The body is JSON because the router accepts only JSON on most endpoints.
 */
export async function callAuthEndpoint<E extends AuthEndpoint>(
  endpoint: E,
  body: EndpointBodies[E],
): Promise<AuthEndpointResult> {
  const forwarded = new Headers(await headers());
  forwarded.set("content-type", "application/json");
  forwarded.delete("content-length");

  const response = await auth.handler(
    new Request(new URL(`/api/auth${endpoint}`, getCanonicalAppOrigin()), {
      method: "POST",
      headers: forwarded,
      body: JSON.stringify(body),
    }),
  );

  if (response.ok) return { ok: true, cookies: response.headers.getSetCookie() };
  if (response.status === 429) return { ok: false, code: "RATE_LIMITED" };
  const refusal: unknown = await response.json().catch(() => null);
  return {
    ok: false,
    code: authErrorCode(
      typeof refusal === "object" && refusal !== null && "code" in refusal
        ? refusal.code
        : null,
    ),
  };
}
