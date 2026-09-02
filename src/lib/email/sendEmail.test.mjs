import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./sendEmail.ts", import.meta.url), "utf8");

test("each durable email effect sends exactly one stable message", async () => {
  const harness = loadEmailHarness();
  const order = orderFixture();

  await harness.sendEmail(order, "customer", "work:7:email:customer");
  assert.equal(harness.messages.length, 1);
  assert.equal(harness.messages[0].to, "buyer@example.test");
  assert.equal(harness.messages[0].subject, "Order Confirmation - Purchase Receipt");
  assert.equal(
    harness.messages[0].messageId,
    "<work-7-email-customer@ecommerce-template.local>",
  );

  await harness.sendEmail(order, "owner", "work:7:email:owner");
  assert.equal(harness.messages.length, 2);
  assert.equal(harness.messages[1].to, "owner@example.test");
  assert.equal(harness.messages[1].subject, "New Order #42");
  assert.equal(
    harness.messages[1].messageId,
    "<work-7-email-owner@ecommerce-template.local>",
  );
});

function loadEmailHarness() {
  const messages = [];
  const modules = {
    "server-only": {},
    "./mailer": {
      escapeHtml: (value) => String(value),
      getContactEmailAddress: () => "owner@example.test",
      sendMail: async (message) => {
        messages.push(message);
      },
    },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "sendEmail.ts",
  }).outputText;
  const emailModule = { exports: {} };
  const mockedRequire = (id) => modules[id] ?? nativeRequire(id);
  new Function("require", "module", "exports", compiled)(
    mockedRequire,
    emailModule,
    emailModule.exports,
  );
  return { ...emailModule.exports, messages };
}

function orderFixture() {
  return {
    id: 7,
    userId: "user-1",
    deliveryDate: "2026-08-21T10:00:00.000Z",
    orderNumber: 42,
    createdAt: "2026-08-14T10:00:00.000Z",
    updatedAt: "2026-08-14T10:00:00.000Z",
    customerInfo: {
      name: "Buyer",
      email: "buyer@example.test",
      phone: "+34123456789",
      address: {
        line1: "Main Street 1",
        city: "Madrid",
        postal_code: "28001",
        country: "ES",
      },
      totalPrice: 2500,
      currency: "eur",
    },
    orderProducts: [{
      quantity: 1,
      size: "M",
      unitAmount: 2500,
      variant: {
        color: "Blue",
        product: { name: "T-Shirt" },
      },
    }],
  };
}
