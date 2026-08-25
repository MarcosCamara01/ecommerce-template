import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

import { customerEmailMessage } from "../../components/checkout/checkout-copy.ts";
import { checkoutOutcomeFromRecord } from "../order-fulfillment/checkout-outcome.ts";
import { executeOrderEmailEffect } from "../order-fulfillment/email-effect.ts";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./mailer.ts", import.meta.url), "utf8");

const completeConfig = {
  EMAIL_SERVER_HOST: "smtp.example.test",
  EMAIL_SERVER_PORT: "587",
  EMAIL_SERVER_USER: "mailer@example.test",
  EMAIL_SERVER_PASSWORD: "test-password",
  EMAIL_FROM: "store@example.test",
  EMAIL_CONTACT_TO: "owner@example.test",
};

test("email stays disabled without transport configuration", async () => {
  const harness = loadMailerHarness({});

  await assert.rejects(
    harness.sendMail(messageFixture()),
    /email is disabled.*EMAIL_SERVER_HOST/i,
  );
  assert.equal(harness.transportOptions.length, 0);
  assert.equal(harness.messages.length, 0);
});

test("residual Gmail credentials cannot enable delivery without a host", async () => {
  const harness = loadMailerHarness({
    EMAIL_SERVER_USER: "residual@gmail.example",
    EMAIL_SERVER_PASSWORD: "residual-password",
    EMAIL_FROM: "residual@gmail.example",
    EMAIL_CONTACT_TO: "owner@example.test",
  });

  await assert.rejects(
    harness.sendMail(messageFixture()),
    /email is disabled.*EMAIL_SERVER_HOST/i,
  );
  assert.equal(harness.transportOptions.length, 0);
  assert.equal(harness.messages.length, 0);
});

test("partial SMTP credentials fail before a transport is created", async () => {
  for (const environment of [
    { EMAIL_SERVER_HOST: "smtp.example.test" },
    {
      ...completeConfig,
      EMAIL_SERVER_PASSWORD: "",
    },
    {
      ...completeConfig,
      EMAIL_SERVER_PORT: "not-a-port",
    },
  ]) {
    const harness = loadMailerHarness(environment);
    await assert.rejects(
      harness.sendMail(messageFixture()),
      /email configuration is incomplete or invalid/i,
    );
    assert.equal(harness.transportOptions.length, 0);
    assert.equal(harness.messages.length, 0);
  }
});

test("complete Gmail SMTP configuration is explicit and supported", async () => {
  const harness = loadMailerHarness({
    ...completeConfig,
    EMAIL_SERVER_HOST: "smtp.gmail.com",
    EMAIL_SERVER_PORT: "465",
  });

  await harness.sendMail(messageFixture());

  assert.deepEqual(harness.transportOptions, [{
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "mailer@example.test",
      pass: "test-password",
    },
  }]);
  assert.equal(harness.messages.length, 1);
});

test("complete generic SMTP configuration preserves delivery", async () => {
  const harness = loadMailerHarness(completeConfig);

  await harness.sendMail(messageFixture());

  assert.deepEqual(harness.transportOptions, [{
    host: "smtp.example.test",
    port: 587,
    secure: false,
    auth: {
      user: "mailer@example.test",
      pass: "test-password",
    },
  }]);
  assert.deepEqual(harness.messages, [{
    from: "store@example.test",
    ...messageFixture(),
  }]);
});

test("disabled email leaves a confirmed order safe and reports delayed delivery", async () => {
  const harness = loadMailerHarness({});
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
  } catch {
    effect.state = "pending";
    effect.lastErrorCode = "unexpected";
  }

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
  assert.equal(harness.transportOptions.length, 0);
  assert.equal(harness.messages.length, 0);
});

function loadMailerHarness(environment) {
  const transportOptions = [];
  const messages = [];
  const modules = {
    "server-only": {},
    nodemailer: {
      createTransport: (options) => {
        transportOptions.push(options);
        return {
          sendMail: async (message) => {
            messages.push(message);
          },
        };
      },
    },
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
  new Function("require", "module", "exports", "process", compiled)(
    mockedRequire,
    mailerModule,
    mailerModule.exports,
    { env: environment },
  );
  return { ...mailerModule.exports, messages, transportOptions };
}

function messageFixture() {
  return {
    to: "buyer@example.test",
    subject: "Test message",
    html: "<p>Test</p>",
  };
}
