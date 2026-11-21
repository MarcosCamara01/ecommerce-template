import assert from "node:assert/strict";
import test from "node:test";

import { authPageHref, verificationLandingLink } from "./email-flows.ts";

const ORIGIN = "https://store.example.test";
const betterAuthLink = (callbackURL) =>
  `${ORIGIN}/api/auth/verify-email?token=header.payload.signature&callbackURL=${encodeURIComponent(callbackURL)}`;

test("a verification link lands on /email-verification and keeps the destination and token", () => {
  const link = new URL(verificationLandingLink(betterAuthLink("/cart"), ORIGIN));

  assert.equal(link.origin, ORIGIN);
  assert.equal(link.pathname, "/api/auth/verify-email");
  assert.equal(link.searchParams.get("token"), "header.payload.signature");
  assert.equal(link.searchParams.get("callbackURL"), "/email-verification?redirect=%2Fcart");
});

test("a link to the home page lands on /email-verification without a redirect", () => {
  const link = new URL(verificationLandingLink(betterAuthLink("/"), ORIGIN));

  assert.equal(link.searchParams.get("callbackURL"), "/email-verification");
});

test("a foreign or malformed destination becomes the home page", () => {
  for (const callbackURL of ["https://evil.example", "//evil.example", "/\\evil.example"]) {
    const link = new URL(verificationLandingLink(betterAuthLink(callbackURL), ORIGIN));
    assert.equal(link.searchParams.get("callbackURL"), "/email-verification", callbackURL);
  }
});

test("rewriting a link twice changes nothing", () => {
  const once = verificationLandingLink(betterAuthLink("/wishlist?tab=saved"), ORIGIN);

  assert.equal(verificationLandingLink(once, ORIGIN), once);
});

test("auth page hrefs drop a \"/\" redirect and become absolute with an origin", () => {
  assert.equal(authPageHref("signIn"), "/login");
  assert.equal(authPageHref("signIn", { redirect: "/" }), "/login");
  assert.equal(authPageHref("signIn", { redirect: "/cart" }), "/login?redirect=%2Fcart");
  assert.equal(
    authPageHref("signIn", { redirect: "/cart", error: "EMAIL_NOT_VERIFIED" }),
    "/login?redirect=%2Fcart&error=EMAIL_NOT_VERIFIED",
  );
  assert.equal(authPageHref("register", { origin: ORIGIN }), `${ORIGIN}/register`);
});
