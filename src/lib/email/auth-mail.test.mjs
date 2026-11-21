import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./auth-mail.ts", import.meta.url), "utf8");
const mailerSource = await readFile(new URL("./mailer.ts", import.meta.url), "utf8");

const recipient = { email: "alex@example.test", name: "Alex" };
const VERIFY_URL =
  "https://store.example.test/api/auth/verify-email?token=abc.def.ghi&callbackURL=%2Femail-verification";

test("the verification mail goes to the user with the link in both html and text", async () => {
  const harness = loadAuthMailHarness();

  await harness.sendAuthMail(recipient, {
    kind: "verify-email",
    url: VERIFY_URL,
    expiresInSeconds: 3600,
  });

  assert.equal(harness.messages.length, 1);
  const [message] = harness.messages;
  assert.equal(message.to, "alex@example.test");
  assert.equal(message.subject, "Confirm your email address");
  assert.ok(message.text.includes(VERIFY_URL), "the text part carries the link");
  assert.ok(
    message.html.includes(VERIFY_URL.replaceAll("&", "&amp;")),
    "the html part carries the link",
  );
  assert.match(message.text, /expires in 1 hour/);
  assert.match(message.text, /didn't ask for this, ignore this email/);
});

test("the expiry in the verification mail follows the link's lifetime", async () => {
  const harness = loadAuthMailHarness();

  await harness.sendAuthMail(recipient, { kind: "verify-email", url: VERIFY_URL, expiresInSeconds: 1800 });
  await harness.sendAuthMail(recipient, { kind: "verify-email", url: VERIFY_URL, expiresInSeconds: 7200 });

  assert.match(harness.messages[0].text, /expires in 30 minutes/);
  assert.match(harness.messages[1].text, /expires in 2 hours/);
});

test("the reset mail carries the reset link and says to ignore it if unrequested", async () => {
  const harness = loadAuthMailHarness();
  const url = "https://store.example.test/api/auth/reset-password/abc123?callbackURL=%2Freset-password";

  await harness.sendAuthMail(recipient, { kind: "reset-password", url, expiresInSeconds: 3600 });

  const [message] = harness.messages;
  assert.equal(message.to, "alex@example.test");
  assert.equal(message.subject, "Reset your password");
  assert.ok(message.text.includes(url));
  assert.ok(message.html.includes(url.replaceAll("&", "&amp;")));
  assert.match(message.text, /expires in 1 hour/);
  assert.match(message.text, /didn't ask for this, ignore this email/);
});

test("the existing-account mail links sign-in and password reset, and mentions Google only when enabled", async () => {
  const harness = loadAuthMailHarness();
  const mail = {
    kind: "existing-account",
    signInUrl: "https://store.example.test/login",
    resetUrl: "https://store.example.test/forgot-password",
  };

  await harness.sendAuthMail(recipient, { ...mail, googleEnabled: false });
  await harness.sendAuthMail(recipient, { ...mail, googleEnabled: true });

  const [withoutGoogle, withGoogle] = harness.messages;
  assert.equal(withoutGoogle.subject, "You already have an account");
  assert.ok(withoutGoogle.text.includes("https://store.example.test/login"));
  assert.ok(withoutGoogle.text.includes("https://store.example.test/forgot-password"));
  assert.doesNotMatch(withoutGoogle.text, /verify-email|token=/);
  assert.doesNotMatch(withoutGoogle.text, /Google/);
  assert.match(withGoogle.text, /Continue with Google/);
});

test("the name a registrant typed never reaches the address owner", async () => {
  const harness = loadAuthMailHarness();
  const typedName = "Claim your prize at https://evil.example";

  await harness.sendAuthMail(
    { email: "alex@example.test", name: typedName },
    { kind: "verify-email", url: VERIFY_URL, expiresInSeconds: 3600 },
  );

  const [message] = harness.messages;
  assert.ok(!message.text.includes("evil.example"), "the text part leaves the name out");
  assert.ok(!message.html.includes("evil.example"), "the html part leaves the name out");
});

test("two auth mails to the same address are both sent", async () => {
  const harness = loadAuthMailHarness();
  const mail = { kind: "verify-email", url: VERIFY_URL, expiresInSeconds: 3600 };

  await harness.sendAuthMail(recipient, mail);
  await harness.sendAuthMail(recipient, mail);

  assert.equal(harness.messages.length, 2);
  for (const message of harness.messages) {
    assert.equal(message.idempotencyKey, undefined, "a resend is never deduped by Resend");
  }
});

function loadAuthMailHarness() {
  const messages = [];
  const mailer = loadModule(mailerSource, "mailer.ts", {
    "server-only": {},
    "@/lib/app-origin": { getCanonicalAppOrigin: () => "https://store.example.test" },
    "./delivery-error": {},
  });
  const modules = {
    "server-only": {},
    "./mailer": {
      escapeHtml: mailer.escapeHtml,
      sendMail: async (message) => {
        messages.push(message);
      },
    },
  };
  return { ...loadModule(source, "auth-mail.ts", modules), messages };
}

function loadModule(moduleSource, fileName, modules) {
  const compiled = ts.transpileModule(moduleSource, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName,
  }).outputText;
  const loaded = { exports: {} };
  const mockedRequire = (id) => modules[id] ?? nativeRequire(id);
  new Function("require", "module", "exports", compiled)(mockedRequire, loaded, loaded.exports);
  return loaded.exports;
}
