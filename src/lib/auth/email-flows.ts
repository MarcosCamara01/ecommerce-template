import { safeLocalCallback } from "./local-callback.ts";

export const AUTH_PAGES = {
  signIn: "/login",
  register: "/register",
  emailVerification: "/email-verification",
} as const;

export type AuthPage = keyof typeof AUTH_PAGES;

export const VERIFICATION_LINK_TTL_SECONDS = 60 * 60;

export function authPageHref(
  page: AuthPage,
  options: { redirect?: string; error?: string; origin?: string } = {},
): string {
  const search = new URLSearchParams();
  if (options.redirect && options.redirect !== "/") search.set("redirect", options.redirect);
  if (options.error) search.set("error", options.error);
  const query = search.toString();
  const path = query ? `${AUTH_PAGES[page]}?${query}` : AUTH_PAGES[page];
  return options.origin ? new URL(path, options.origin).href : path;
}

export function verificationLandingLink(betterAuthUrl: string, origin: string): string {
  const link = new URL(betterAuthUrl);
  const destination = safeLocalCallback(link.searchParams.get("callbackURL"), origin);
  if (new URL(destination, origin).pathname === AUTH_PAGES.emailVerification) {
    return link.href;
  }
  link.searchParams.set(
    "callbackURL",
    authPageHref("emailVerification", { redirect: destination }),
  );
  return link.href;
}
