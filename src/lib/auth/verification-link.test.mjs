import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import * as betterAuthApi from "better-auth/api";
import { signJWT } from "better-auth/crypto";
import * as betterAuthPlugins from "better-auth/plugins";
import * as drizzleOrm from "drizzle-orm";
import ts from "typescript";

import * as emailFlows from "./email-flows.ts";
import * as verificationLink from "./verification-link.ts";

const ORIGIN = "http://localhost:3000";
const SECRET = "verification-link-test-secret-0123456789abcdef";
const PASSWORD = "correct-horse-battery-staple";
const authSource = await readFile(new URL("../../utils/auth.ts", import.meta.url), "utf8");

test("a verification link verifies the address once and is refused after that", async () => {
  const app = loadAuth();
  const link = await app.signUp("ada@example.test");

  const first = await app.open(link);
  assert.equal(first.status, 302);
  assert.equal(first.headers.get("location"), "/email-verification");
  assert.equal(first.headers.get("set-cookie"), null, "verifying never signs anyone in");
  assert.equal(app.isVerified("ada@example.test"), true);

  const second = await app.open(link);
  assert.equal(second.status, 302);
  assert.equal(second.headers.get("location"), "/email-verification?error=INVALID_TOKEN");
  assert.equal(second.headers.get("set-cookie"), null);
});

test("a link re-sent on sign-in verifies an unverified address, then every link is spent", async () => {
  const app = loadAuth();
  const signUpLink = await app.signUp("grace@example.test");
  const signInLink = await app.signInUnverified("grace@example.test");

  const verified = await app.open(signInLink);
  assert.equal(verified.headers.get("location"), "/email-verification");
  assert.equal(app.isVerified("grace@example.test"), true);

  const stale = await app.open(signUpLink);
  assert.equal(stale.headers.get("location"), "/email-verification?error=INVALID_TOKEN");
});

test("a token not signed with the auth secret verifies nothing and reads the same for every account", async () => {
  const app = loadAuth();
  await app.signUp("unverified@example.test");
  await app.open(await app.signUp("verified@example.test"));

  for (const email of ["unverified@example.test", "verified@example.test", "nobody@example.test"]) {
    const forged = await signJWT({ email }, "an-attacker-chosen-secret-0123456789abcdef", 3600);
    const response = await app.open(verifyEmailUrl(forged, "/email-verification"));
    assert.equal(response.status, 302, email);
    assert.equal(response.headers.get("location"), "/email-verification?error=INVALID_TOKEN", email);
  }
  assert.equal(app.isVerified("unverified@example.test"), false);
});

test("a used link with an untrusted callbackURL still fails the origin check", async () => {
  const app = loadAuth();
  const link = new URL(await app.signUp("linus@example.test"));
  await app.open(link.href);

  const response = await app.open(
    verifyEmailUrl(link.searchParams.get("token"), "https://evil.example/landing"),
  );
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("location"), null);
});

function verifyEmailUrl(token, callbackURL) {
  const url = new URL("/api/auth/verify-email", ORIGIN);
  url.searchParams.set("token", token);
  url.searchParams.set("callbackURL", callbackURL);
  return url.href;
}

function loadAuth() {
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
    "@/lib/app-origin": { getCanonicalAppOrigin: () => ORIGIN },
    "@/lib/auth/email-flows": emailFlows,
    "@/lib/auth/verification-link": verificationLink,
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
  const compiled = ts.transpileModule(authSource, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "auth.ts",
  }).outputText;
  const authModule = { exports: {} };
  const mockedRequire = (id) => {
    if (!(id in modules)) throw new Error(`auth.ts imports ${id}, which the harness does not provide`);
    return modules[id];
  };
  new Function("require", "module", "exports", "process", compiled)(
    mockedRequire,
    authModule,
    authModule.exports,
    { env: { BETTER_AUTH_SECRET: SECRET } },
  );
  const { auth } = authModule.exports;

  const lastVerificationLink = (email) => {
    const mail = mails.findLast((sent) => sent.to === email && sent.kind === "verify-email");
    assert.ok(mail, `a verification mail was sent to ${email}`);
    return mail.url;
  };

  return {
    async signUp(email) {
      await auth.api.signUpEmail({ body: { email, password: PASSWORD, name: "Test" } });
      return lastVerificationLink(email);
    },
    async signInUnverified(email) {
      const sentBefore = mails.length;
      await assert.rejects(
        auth.api.signInEmail({ body: { email, password: PASSWORD } }),
        (error) => error.body?.code === "EMAIL_NOT_VERIFIED",
      );
      assert.equal(mails.length, sentBefore + 1, "sign-in re-sends the verification link");
      return lastVerificationLink(email);
    },
    open: (url) => auth.handler(new Request(url)),
    isVerified: (email) => database.user.find((user) => user.email === email).emailVerified,
  };
}
