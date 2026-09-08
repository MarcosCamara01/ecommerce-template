import assert from "node:assert/strict";
import test from "node:test";

import {
  assertCapability,
  assertSystemPrincipal,
  createUserPrincipalForIdentityModule,
  IdentityError,
  identityErrorHttpStatus,
  isPrincipal,
} from "./principal-authority.ts";

test("a structural lookalike is not a Principal", () => {
  const fake = { kind: "user", userId: "victim", capabilities: ["catalog:manage"] };
  assert.equal(isPrincipal(fake), false);
  assert.throws(() => assertCapability(fake, "catalog:manage"), /valid User Principal/);
});

test("admin role maps to the catalog capability", () => {
  const principal = createUserPrincipalForIdentityModule({
    userId: "stable-user-id",
    role: "admin",
  });
  assert.equal(assertCapability(principal, "catalog:manage"), principal);
});

test("a user cannot stand in for the fulfillment System Principal", () => {
  const principal = createUserPrincipalForIdentityModule({ userId: "user", role: "user" });
  assert.throws(
    () => assertSystemPrincipal(principal, "order-fulfillment"),
    /System Principal/,
  );
});

test("HTTP identity semantics distinguish authentication from authorization", () => {
  assert.equal(
    identityErrorHttpStatus(
      new IdentityError("authentication_required", "Authentication required"),
    ),
    401,
  );
  assert.equal(
    identityErrorHttpStatus(
      new IdentityError("capability_denied", "Capability denied"),
    ),
    403,
  );
});
