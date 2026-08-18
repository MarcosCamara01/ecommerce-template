import assert from "node:assert/strict";
import test from "node:test";

import { createStripeClientOptions } from "./client-options.ts";

test("Stripe uses its default API host when no emulator is configured", () => {
  assert.deepEqual(createStripeClientOptions(), {
    apiVersion: "2026-07-29.dahlia",
    telemetry: true,
  });
});

test("Stripe can target an explicit local emulator without telemetry", () => {
  assert.deepEqual(createStripeClientOptions("http://localhost:4000", "development"), {
    apiVersion: "2026-07-29.dahlia",
    telemetry: false,
    host: "localhost",
    port: 4000,
    protocol: "http",
  });
});

test("Stripe rejects remote or production emulator overrides", () => {
  assert.throws(
    () => createStripeClientOptions("https://stripe-proxy.example.com", "development"),
    /development-only/,
  );
  assert.throws(
    () => createStripeClientOptions("http://localhost:4000", "production"),
    /development-only/,
  );
});
