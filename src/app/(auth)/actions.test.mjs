import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

import * as emailFlows from "../../lib/auth/email-flows.ts";
import * as formState from "../../lib/auth/form-state.ts";
import * as localCallback from "../../lib/auth/local-callback.ts";

const { FORGOT_PASSWORD_START, RESET_PASSWORD_START, SIGN_UP_START } = formState;
const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./actions.ts", import.meta.url), "utf8");

const form = (fields) => {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
};
const signUpForm = (overrides = {}) => form({
  name: "Alex",
  email: "alex@example.test",
  password: "correct horse battery",
  callbackURL: "/cart",
  ...overrides,
});

test("sign-up shows check-email for a new or a taken address alike", async () => {
  const harness = loadActionsHarness(() => ({ ok: true, cookies: [] }));

  for (const email of ["new@example.test", "taken@example.test"]) {
    assert.deepEqual(
      await harness.signUp(SIGN_UP_START, signUpForm({ email })),
      { step: "check-email", email },
    );
  }
});

test("sign-up hands Better Auth only a local destination", async () => {
  const harness = loadActionsHarness(() => ({ ok: true, cookies: [] }));

  await harness.signUp(SIGN_UP_START, signUpForm({ callbackURL: "https://evil.example/steal" }));
  await harness.signUp(SIGN_UP_START, signUpForm({ callbackURL: "/cart" }));

  assert.deepEqual(harness.calls.map(({ endpoint }) => endpoint), ["/sign-up/email", "/sign-up/email"]);
  assert.deepEqual(harness.calls.map(({ body }) => body.callbackURL), ["/", "/cart"]);
  assert.deepEqual(harness.calls[1].body, {
    name: "Alex",
    email: "alex@example.test",
    password: "correct horse battery",
    callbackURL: "/cart",
  });
});

test("a refused sign-up keeps name and email and never echoes the password", async () => {
  const harness = loadActionsHarness(() => ({ ok: false, code: "PASSWORD_TOO_SHORT" }));

  const state = await harness.signUp(SIGN_UP_START, signUpForm({ password: "short" }));

  assert.equal(state.step, "form");
  assert.equal(state.name, "Alex");
  assert.equal(state.email, "alex@example.test");
  assert.equal(state.failure.code, "PASSWORD_TOO_SHORT");
  assert.match(state.failure.message, /8 characters/);
  assert.doesNotMatch(JSON.stringify(state), /short"/);
});

test("each failure is a new attempt", async () => {
  const harness = loadActionsHarness(() => ({ ok: false, code: "RATE_LIMITED" }));

  const first = await harness.signUp(SIGN_UP_START, signUpForm());
  const second = await harness.signUp(first, signUpForm());

  assert.equal(first.failure.attempt, 1);
  assert.equal(second.failure.attempt, 2);
  assert.equal(second.failure.message, first.failure.message);
});

test("forgot-password answers the same for any address and asks for links to /reset-password", async () => {
  const harness = loadActionsHarness(() => ({ ok: true, cookies: [] }));

  for (const email of ["known@example.test", "unknown@example.test"]) {
    assert.deepEqual(
      await harness.requestPasswordReset(FORGOT_PASSWORD_START, form({ email })),
      { step: "sent", email },
    );
  }
  assert.deepEqual(harness.calls.at(-1), {
    endpoint: "/request-password-reset",
    body: { email: "unknown@example.test", redirectTo: "/reset-password" },
  });
});

test("a rate-limited forgot-password says so and keeps the address", async () => {
  const harness = loadActionsHarness(() => ({ ok: false, code: "RATE_LIMITED" }));

  const state = await harness.requestPasswordReset(
    FORGOT_PASSWORD_START,
    form({ email: "alex@example.test" }),
  );

  assert.equal(state.step, "form");
  assert.equal(state.email, "alex@example.test");
  assert.equal(state.failure.code, "RATE_LIMITED");
  assert.match(state.failure.message, /too many attempts/i);
});

test("reset without a token is expired without calling Better Auth", async () => {
  const harness = loadActionsHarness(() => ({ ok: true, cookies: [] }));

  assert.deepEqual(
    await harness.resetPassword(RESET_PASSWORD_START, form({ password: "a new password" })),
    { step: "expired" },
  );
  assert.equal(harness.calls.length, 0);
});

test("a used or expired reset token shows the expired step", async () => {
  for (const code of ["INVALID_TOKEN", "TOKEN_EXPIRED", "USER_NOT_FOUND"]) {
    const harness = loadActionsHarness(() => ({ ok: false, code }));
    assert.deepEqual(
      await harness.resetPassword(RESET_PASSWORD_START, form({ token: "t0k3n", password: "a new password" })),
      { step: "expired" },
      code,
    );
  }
});

test("a weak new password stays on the form; a successful reset shows done", async () => {
  const weak = loadActionsHarness(() => ({ ok: false, code: "PASSWORD_TOO_SHORT" }));
  const refused = await weak.resetPassword(RESET_PASSWORD_START, form({ token: "t0k3n", password: "short" }));
  assert.equal(refused.step, "form");
  assert.equal(refused.failure.code, "PASSWORD_TOO_SHORT");
  assert.doesNotMatch(JSON.stringify(refused), /short"|t0k3n/);

  const harness = loadActionsHarness(() => ({ ok: true, cookies: [] }));
  assert.deepEqual(
    await harness.resetPassword(RESET_PASSWORD_START, form({ token: "t0k3n", password: "a new password" })),
    { step: "done" },
  );
  assert.deepEqual(harness.calls, [{
    endpoint: "/reset-password",
    body: { token: "t0k3n", newPassword: "a new password" },
  }]);
});

function loadActionsHarness(respond) {
  const calls = [];
  const modules = {
    "@/lib/app-origin": { getCanonicalAppOrigin: () => "https://store.example.test" },
    "@/lib/auth/endpoint": {
      callAuthEndpoint: async (endpoint, body) => {
        calls.push({ endpoint, body });
        return respond(endpoint, body);
      },
    },
    "@/lib/auth/email-flows": emailFlows,
    "@/lib/auth/form-state": formState,
    "@/lib/auth/local-callback": localCallback,
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "actions.ts",
  }).outputText;
  const actionsModule = { exports: {} };
  const mockedRequire = (id) => modules[id] ?? nativeRequire(id);
  new Function("require", "module", "exports", compiled)(
    mockedRequire,
    actionsModule,
    actionsModule.exports,
  );
  return { ...actionsModule.exports, calls };
}
