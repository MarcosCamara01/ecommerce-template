import test from "node:test";
import assert from "node:assert/strict";

import { decideAccountLink } from "./account-linking.ts";

/** Defaults describe the dangerous case: an unverified pre-claim. */
const scenario = (overrides = {}) => ({
  providerId: "google",
  userExists: true,
  userEmailVerified: false,
  existingProviderIds: ["credential"],
  hasOrderHistory: false,
  ...overrides,
});

test("REPORT-1732: never links a verified identity into an unverified pre-claim", () => {
  // The attack: attacker registers victim@example.test with a password and
  // never verifies it, then the real owner signs in with Google. Linking here
  // is what handed the attacker persistent access.
  assert.notEqual(decideAccountLink(scenario()), "allow");
});

test("unverified, inert pre-claim is reclaimed so the owner is not locked out", () => {
  assert.equal(decideAccountLink(scenario()), "reclaim");
});

test("refuses instead of reclaiming when the account has order history", () => {
  assert.equal(
    decideAccountLink(scenario({ hasOrderHistory: true })),
    "refuse",
  );
});

test("refuses when another social identity is already attached", () => {
  assert.equal(
    decideAccountLink(
      scenario({ existingProviderIds: ["credential", "github"] }),
    ),
    "refuse",
  );
});

test("allows linking when the existing account proved it owns the address", () => {
  assert.equal(
    decideAccountLink(scenario({ userEmailVerified: true })),
    "allow",
  );
});

test("allows a fresh social sign-up with no existing user", () => {
  assert.equal(
    decideAccountLink(
      scenario({ userExists: false, existingProviderIds: [] }),
    ),
    "allow",
  );
});

test("allows the credential row created by email sign-up itself", () => {
  // Sign-up writes a credential row while emailVerified is still false; that
  // must not be mistaken for an attempt to link into a pre-claim.
  assert.equal(
    decideAccountLink(
      scenario({ providerId: "credential", existingProviderIds: [] }),
    ),
    "allow",
  );
});

test("allows when the user row exists but has nothing attached yet", () => {
  assert.equal(
    decideAccountLink(scenario({ existingProviderIds: [] })),
    "allow",
  );
});

test("order history alone cannot force a link into an unverified account", () => {
  // Guards the precedence: verification is what authorises linking, and an
  // account with orders but no proof of ownership still must not absorb a
  // verified identity.
  assert.equal(
    decideAccountLink(
      scenario({ hasOrderHistory: true, existingProviderIds: ["credential"] }),
    ),
    "refuse",
  );
});
