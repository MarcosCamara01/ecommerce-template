import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import * as betterAuthApi from "better-auth/api";
import * as betterAuthPlugins from "better-auth/plugins";
import * as drizzleOrm from "drizzle-orm";
import ts from "typescript";

import * as emailFlows from "../lib/auth/email-flows.ts";

const AUTH_TEST_ORIGIN = "http://localhost:3000";
const AUTH_TEST_SECRET = "auth-harness-test-secret-0123456789abcdef";

const authSource = await readFile(new URL("./auth.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(authSource, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: "auth.ts",
}).outputText;

function loadAuthHarness() {
  const database = { user: [], session: [], account: [], verification: [] };
  const mails = [];
  const modules = {
    "server-only": {},
    "better-auth": {
      // Better Auth skips origin checks when NODE_ENV is "test" or TEST is set; pin the production behavior.
      betterAuth: (options) =>
        betterAuth({
          ...options,
          database: memoryAdapter(database),
          advanced: { ...options.advanced, disableOriginCheck: false },
        }),
    },
    "better-auth/adapters/drizzle": { drizzleAdapter: () => null },
    "better-auth/api": betterAuthApi,
    "better-auth/plugins": betterAuthPlugins,
    "drizzle-orm": drizzleOrm,
    "next/server": { after: () => {} },
    "@/lib/app-origin": { getCanonicalAppOrigin: () => AUTH_TEST_ORIGIN },
    "@/lib/auth/email-flows": emailFlows,
    "@/lib/db/drizzle/connection": { db: {} },
    "@/lib/email": { sendAuthMail: (user, mail) => mails.push({ to: user.email, ...mail }) },
    "@/lib/db/drizzle/schema": { accounts: {}, sessions: {}, users: {}, verifications: {} },
    "@/lib/db/drizzle/schema/legacy-auth": {
      legacyAccounts: {},
      legacySessions: {},
      legacyUsers: {},
      legacyVerifications: {},
    },
  };
  const authModule = { exports: {} };
  const mockedRequire = (id) => {
    if (!(id in modules)) throw new Error(`auth.ts imports ${id}, which the harness does not provide`);
    return modules[id];
  };
  new Function("require", "module", "exports", "process", compiled)(
    mockedRequire,
    authModule,
    authModule.exports,
    { env: { BETTER_AUTH_SECRET: AUTH_TEST_SECRET } },
  );
  const { auth } = authModule.exports;
  const post = (path, body) =>
    auth.handler(
      new Request(new URL(`/api/auth${path}`, AUTH_TEST_ORIGIN), {
        method: "POST",
        headers: { "content-type": "application/json", origin: AUTH_TEST_ORIGIN },
        body: JSON.stringify(body),
      }),
    );
  return { auth, database, mails, post };
}

const PASSWORD = "correct-horse-battery-staple";

test("signing up an existing email creates no row and answers like a new account", async () => {
  const { database, mails, post } = loadAuthHarness();
  const first = await post("/sign-up/email", {
    email: "ada@example.test",
    password: PASSWORD,
    name: "Ada",
  });
  assert.equal(first.status, 200);
  const ownerId = database.user[0].id;

  const duplicate = await post("/sign-up/email", {
    email: "ada@example.test",
    password: "another-password-0123",
    name: "Mallory",
  });
  assert.equal(duplicate.status, 200);
  const body = await duplicate.json();
  assert.equal(body.token, null);
  assert.notEqual(body.user.id, ownerId);
  assert.equal(database.user.length, 1, "no second user row");
  assert.equal(database.user[0].name, "Ada");
  assert.equal(
    mails.filter((mail) => mail.kind === "existing-account").length,
    1,
    "the real owner is told someone tried to register",
  );
});

test("sign-up refuses a role and creates nothing", async () => {
  const { database, post } = loadAuthHarness();
  const response = await post("/sign-up/email", {
    email: "eve@example.test",
    password: PASSWORD,
    name: "Eve",
    role: "admin",
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, "FIELD_NOT_ALLOWED");
  assert.equal(database.user.length, 0);
});

test("sign-up ignores client-chosen id, verification and ban fields", async () => {
  const { database, post } = loadAuthHarness();
  const response = await post("/sign-up/email", {
    email: "eve@example.test",
    password: PASSWORD,
    name: "Eve",
    id: "pt-custom-id",
    emailVerified: true,
    banned: true,
  });
  assert.equal(response.status, 200);
  const [user] = database.user;
  assert.notEqual(user.id, "pt-custom-id");
  assert.equal(user.emailVerified, false);
  assert.equal(user.banned, false);
  assert.equal(user.role, "user");
});
