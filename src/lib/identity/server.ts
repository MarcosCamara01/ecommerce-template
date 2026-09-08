import "server-only";

import { headers } from "next/headers";

import { auth } from "@/utils/auth";
import {
  IdentityError,
  assertCapability,
  createUserPrincipalForIdentityModule,
  type Capability,
  type UserPrincipal,
} from "./principal-authority";

export type AuthenticatedIdentity = Readonly<{
  principal: UserPrincipal;
  email: string;
}>;

export async function getIdentityFromHeaders(
  requestHeaders: Headers,
): Promise<AuthenticatedIdentity | null> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (
    !session?.user?.id ||
    !session.user.email ||
    session.user.emailVerified !== true
  ) return null;
  return Object.freeze({
    principal: createUserPrincipalForIdentityModule({
      userId: session.user.id,
      role: "role" in session.user ? String(session.user.role ?? "user") : "user",
    }),
    email: session.user.email,
  });
}

export async function getPrincipalFromHeaders(
  requestHeaders: Headers,
): Promise<UserPrincipal | null> {
  return (await getIdentityFromHeaders(requestHeaders))?.principal ?? null;
}

export async function getIdentity(): Promise<AuthenticatedIdentity | null> {
  return getIdentityFromHeaders(await headers());
}

export async function getPrincipal(): Promise<UserPrincipal | null> {
  return getPrincipalFromHeaders(await headers());
}

export async function requirePrincipalFromHeaders(
  requestHeaders: Headers,
): Promise<UserPrincipal> {
  const principal = await getPrincipalFromHeaders(requestHeaders);
  if (!principal) {
    throw new IdentityError(
      "authentication_required",
      "Authentication is required",
    );
  }
  return principal;
}

export async function requirePrincipal(): Promise<UserPrincipal> {
  const principal = await getPrincipal();
  if (!principal) {
    throw new IdentityError(
      "authentication_required",
      "Authentication is required",
    );
  }
  return principal;
}

export async function requireCapabilityFromHeaders(
  requestHeaders: Headers,
  capability: Capability,
): Promise<UserPrincipal> {
  return assertCapability(
    await requirePrincipalFromHeaders(requestHeaders),
    capability,
  );
}

export async function requireCapability(
  capability: Capability,
): Promise<UserPrincipal> {
  return assertCapability(await requirePrincipal(), capability);
}

export async function updateIdentityProfileFromHeaders(
  requestHeaders: Headers,
  input: { name: string },
) {
  await requirePrincipalFromHeaders(requestHeaders);
  return auth.api.updateUser({
    headers: requestHeaders,
    body: { name: input.name },
  });
}
