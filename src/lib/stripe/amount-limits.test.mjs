import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  STRIPE_EUR_MAX_CHARGE_CENTS,
  stripeEurChargeTotal,
} from "./amount-limits.ts";

test("Stripe EUR charge totals enforce minimum, maximum, and safe arithmetic", () => {
  assert.equal(stripeEurChargeTotal([{ unitAmount: 50, quantity: 1 }]), 50);
  assert.equal(
    stripeEurChargeTotal([{ unitAmount: STRIPE_EUR_MAX_CHARGE_CENTS, quantity: 1 }]),
    STRIPE_EUR_MAX_CHARGE_CENTS,
  );
  assert.equal(stripeEurChargeTotal([{ unitAmount: 49, quantity: 1 }]), null);
  assert.equal(stripeEurChargeTotal([{ unitAmount: 50_000_000, quantity: 2 }]), null);
  assert.equal(stripeEurChargeTotal([{ unitAmount: Number.MAX_SAFE_INTEGER, quantity: 2 }]), null);
});

test("the admin price input shares the server's Stripe ceiling", async () => {
  const form = await readFile("src/components/admin/BasicInfo.tsx", "utf8");
  assert.match(form, /STRIPE_EUR_MAX_CHARGE_CENTS \/ 100/);
  assert.doesNotMatch(form, /99999999\.99/);
});
