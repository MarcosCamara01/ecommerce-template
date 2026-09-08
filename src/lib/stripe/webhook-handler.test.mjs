import assert from "node:assert/strict";
import test from "node:test";

import Stripe from "stripe";

import { createStripeWebhookHandler } from "./webhook-handler.ts";

test("invalid Stripe webhook signatures return 400 with configured fixtures", async () => {
  const signatureError = new Stripe.errors.StripeSignatureVerificationError(
    "signature",
    "payload",
    { message: "invalid signature" },
  );
  const { handler, warnings } = createHarness({
    constructError: signatureError,
  });

  const response = await handler(requestWithSignature());

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Webhook signature verification failed",
  });
  assert.deepEqual(warnings, ["Webhook signature verification failed"]);
});

test("missing Stripe webhook signatures remain a client error", async () => {
  const { handler, warnings, errors } = createHarness();

  const response = await handler(requestWithoutSignature());

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Webhook signature is required",
  });
  assert.deepEqual(warnings, ["Webhook signature is missing"]);
  assert.deepEqual(errors, []);
});

test("missing server webhook secret is an operational configuration error", async () => {
  const { handler, warnings, errors } = createHarness({ secret: "" });

  const response = await handler(requestWithSignature());

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "Webhook is not configured",
  });
  assert.deepEqual(warnings, []);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].message, "Webhook secret is not configured");
  assert.match(errors[0].error.message, /STRIPE_WEBHOOK_SECRET/);
});

test("real webhook operational failures remain 500", async () => {
  const construction = createHarness({
    constructError: new Error("crypto unavailable"),
  });
  const constructionResponse = await construction.handler(
    requestWithSignature(),
  );
  assert.equal(constructionResponse.status, 500);
  assert.deepEqual(await constructionResponse.json(), {
    error: "Webhook registration failed",
  });

  const persistence = createHarness({
    registrationError: new Error("database unavailable"),
  });
  const persistenceResponse = await persistence.handler(requestWithSignature());
  assert.equal(persistenceResponse.status, 500);
  assert.deepEqual(await persistenceResponse.json(), {
    error: "Webhook registration failed",
  });
});

function createHarness({ constructError, registrationError, secret = "whsec_test" } = {}) {
  const warnings = [];
  const errors = [];
  const event = {
    id: "evt_1",
    type: "checkout.session.completed",
    data: { object: { id: "cs_1" } },
  };
  const handler = createStripeWebhookHandler({
    getWebhookSecret: () => secret,
    constructEvent: (payload, signature, secret) => {
      assert.equal(payload, "payload");
      assert.equal(signature, "signature");
      assert.equal(secret, "whsec_test");
      if (constructError) throw constructError;
      return event;
    },
    registerEvent: async () => {
      if (registrationError) throw registrationError;
      return { handled: true };
    },
    logger: {
      warn: (message) => warnings.push(message),
      error: (message, error) => errors.push({ message, error }),
    },
  });

  return { errors, handler, warnings };
}

function requestWithSignature() {
  return {
    headers: new Headers({ "stripe-signature": "signature" }),
    text: async () => "payload",
  };
}

function requestWithoutSignature() {
  return {
    headers: new Headers(),
    text: async () => "payload",
  };
}
