import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

import { customerEmailMessage } from "../../components/checkout/checkout-copy.ts";
import { checkoutOutcomeFromRecord } from "../order-fulfillment/checkout-outcome.ts";
import { executeOrderEmailEffect } from "../order-fulfillment/email-effect.ts";
import { classifyFulfillmentError } from "../order-fulfillment/retry.ts";
import * as deliveryError from "./delivery-error.ts";

const { MailDeliveryError } = deliveryError;
const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./mailer.ts", import.meta.url), "utf8");

const resendConfig = {
  NODE_ENV: "production",
  RESEND_API_KEY: "re_test_key",
  EMAIL_FROM: "Store <store@example.test>",
};

test("a configured key sends one request to Resend with sender, recipient and content", async () => {
  const harness = loadMailerHarness(resendConfig);

  await harness.sendMail({
    ...messageFixture(),
    text: "Test",
    replyTo: "buyer@example.test",
  });

  assert.equal(harness.requests.length, 1);
  const [request] = harness.requests;
  assert.equal(request.url, "https://api.resend.com/emails");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.headers.Authorization, "Bearer re_test_key");
  assert.equal(request.init.headers["Content-Type"], "application/json");
  assert.ok(request.init.headers["User-Agent"], "Resend refuses requests without a User-Agent");
  assert.ok(request.init.signal instanceof AbortSignal, "a hung request is cut off");
  assert.deepEqual(JSON.parse(request.init.body), {
    from: "Store <store@example.test>",
    to: "buyer@example.test",
    subject: "Test message",
    html: "<p>Test</p>",
    text: "Test",
    reply_to: "buyer@example.test",
  });
});

test("an idempotency key reaches Resend scoped to the store origin, the same on every retry", async () => {
  const harness = loadMailerHarness(resendConfig);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await harness.sendMail({ ...messageFixture(), idempotencyKey: "work:7:email:customer" });
  }

  assert.deepEqual(
    harness.requests.map(({ init }) => init.headers["Idempotency-Key"]),
    ["store.example.test/work:7:email:customer", "store.example.test/work:7:email:customer"],
  );
});

test("a message without a key sends no Idempotency-Key header", async () => {
  const harness = loadMailerHarness(resendConfig);

  await harness.sendMail(messageFixture());

  assert.equal("Idempotency-Key" in harness.requests[0].init.headers, false);
});

test("without a key in production nothing is sent and the failure is permanent", async () => {
  const harness = loadMailerHarness({ NODE_ENV: "production" });

  await assert.rejects(harness.sendMail(messageFixture()), (error) => {
    assert.ok(error instanceof MailDeliveryError);
    assert.equal(error.reason, "not_configured");
    assert.equal(error.retryable, false);
    return true;
  });
  assert.equal(harness.requests.length, 0);
});

test("without a key in development the message is printed instead of sent", async () => {
  const harness = loadMailerHarness({ NODE_ENV: "development" });

  await harness.sendMail({
    ...messageFixture(),
    text: "Confirm: https://store.example.test/api/auth/verify-email?token=abc",
  });

  assert.equal(harness.requests.length, 0);
  assert.equal(harness.printed.length, 1);
  assert.match(harness.printed[0], /buyer@example\.test/);
  assert.match(harness.printed[0], /Test message/);
  assert.match(harness.printed[0], /verify-email\?token=abc/);
});

test("a key without EMAIL_FROM fails before any request", async () => {
  const harness = loadMailerHarness({ NODE_ENV: "production", RESEND_API_KEY: "re_test_key" });

  await assert.rejects(harness.sendMail(messageFixture()), { reason: "not_configured" });
  assert.equal(harness.requests.length, 0);
});

test("legacy SMTP or public variables cannot enable delivery", async () => {
  const harness = loadMailerHarness({
    NODE_ENV: "production",
    EMAIL_SERVER_HOST: "smtp.example.test",
    EMAIL_SERVER_PORT: "587",
    EMAIL_SERVER_USER: "mailer@example.test",
    EMAIL_SERVER_PASSWORD: "test-password",
    NEXT_PUBLIC_RESEND_API_KEY: "re_public_key",
    EMAIL_FROM: "store@example.test",
  });

  await assert.rejects(harness.sendMail(messageFixture()), { reason: "not_configured" });
  assert.equal(harness.requests.length, 0);
});

test("customer mail needs no contact address; the owner address comes from EMAIL_CONTACT_TO, then ADMIN_EMAIL", async () => {
  const withoutContact = loadMailerHarness(resendConfig);
  await withoutContact.sendMail(messageFixture());
  assert.equal(withoutContact.requests.length, 1);
  assert.throws(() => withoutContact.getContactEmailAddress(), { reason: "not_configured" });

  const withAdmin = loadMailerHarness({ ...resendConfig, ADMIN_EMAIL: "admin@example.test" });
  assert.equal(withAdmin.getContactEmailAddress(), "admin@example.test");

  const withBoth = loadMailerHarness({
    ...resendConfig,
    EMAIL_CONTACT_TO: "owner@example.test",
    ADMIN_EMAIL: "admin@example.test",
  });
  assert.equal(withBoth.getContactEmailAddress(), "owner@example.test");
});

test("any non-2xx reply rejects with its status", async () => {
  const harness = loadMailerHarness(resendConfig, async () =>
    Response.json({ name: "validation_error", message: "domain not verified" }, { status: 403 }));

  await assert.rejects(harness.sendMail(messageFixture()), (error) => {
    assert.ok(error instanceof MailDeliveryError);
    assert.equal(error.status, 403);
    assert.equal(error.retryable, false);
    return true;
  });
});

test("a network failure or timeout is retryable", async () => {
  for (const failure of [
    new TypeError("fetch failed"),
    new DOMException("The operation timed out.", "TimeoutError"),
  ]) {
    const harness = loadMailerHarness(resendConfig, async () => {
      throw failure;
    });

    await assert.rejects(harness.sendMail(messageFixture()), (error) => {
      assert.ok(error instanceof MailDeliveryError);
      assert.equal(error.reason, "unavailable");
      assert.equal(error.retryable, true);
      return true;
    });
  }
});

test("disabled email leaves a confirmed order safe and reports delayed delivery", async () => {
  const harness = loadMailerHarness({ NODE_ENV: "production" });
  const effect = {
    id: 9,
    idempotencyKey: "work:7:email:customer",
    state: "pending",
    lastErrorCode: null,
  };

  try {
    effect.state = "processing";
    await executeOrderEmailEffect(effect, "customer", {
      send: () => harness.sendMail(messageFixture()),
      complete: async () => {
        effect.state = "succeeded";
      },
    });
  } catch (error) {
    const failure = classifyFulfillmentError(error);
    effect.state = failure.retryable ? "pending" : "needs_attention";
    effect.lastErrorCode = failure.code;
  }

  assert.equal(effect.lastErrorCode, "email_not_configured");
  const outcome = checkoutOutcomeFromRecord({
    workState: "succeeded",
    orderId: 42,
    customerEmailState: effect.state,
    customerEmailLastErrorCode: effect.lastErrorCode,
    cartCleanupState: "succeeded",
  });

  assert.deepEqual(outcome, {
    status: "fulfilled",
    orderId: 42,
    customerEmail: "delayed",
    cartCleanup: "succeeded",
  });
  assert.equal(
    customerEmailMessage(outcome.customerEmail),
    "Email delivery is delayed, but your order is confirmed and safe.",
  );
  assert.equal(harness.requests.length, 0);
});

function loadMailerHarness(environment, respond = async () => Response.json({ id: "email-1" })) {
  const requests = [];
  const printed = [];
  const modules = {
    "server-only": {},
    "@/lib/app-origin": { getCanonicalAppOrigin: () => "https://store.example.test" },
    "./delivery-error": deliveryError,
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "mailer.ts",
  }).outputText;
  const mailerModule = { exports: {} };
  const mockedRequire = (id) => modules[id] ?? nativeRequire(id);
  const fetch = async (url, init) => {
    requests.push({ url, init });
    return respond(url, init);
  };
  new Function("require", "module", "exports", "process", "fetch", "console", compiled)(
    mockedRequire,
    mailerModule,
    mailerModule.exports,
    { env: environment },
    fetch,
    { info: (message) => printed.push(message) },
  );
  return { ...mailerModule.exports, requests, printed };
}

function messageFixture() {
  return {
    to: "buyer@example.test",
    subject: "Test message",
    html: "<p>Test</p>",
  };
}
