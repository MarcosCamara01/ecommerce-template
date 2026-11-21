import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

import * as formState from "../../lib/auth/form-state.ts";
import * as localCallback from "../../lib/auth/local-callback.ts";

const { SIGN_UP_START } = formState;
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
