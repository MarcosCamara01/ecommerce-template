import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const authSource = await readFile(
  new URL("../../utils/auth.ts", import.meta.url),
  "utf8",
);

test("credential and local-account linking both require verified email", () => {
  assert.match(authSource, /baseURL: authBaseURL/);
  assert.match(authSource, /trustedOrigins: authTrustedOrigins/);
  assert.match(
    authSource,
    /emailAndPassword:\s*\{[\s\S]*?requireEmailVerification:\s*true/,
  );
  assert.match(
    authSource,
    /accountLinking:\s*\{[\s\S]*?requireLocalEmailVerified:\s*true/,
  );
  assert.match(authSource, /trustedProviders:\s*\[\]/);
  assert.match(authSource, /allowDifferentEmails:\s*false/);
});

test("OAuth cannot reclaim or rewrite an unverified credential account", () => {
  assert.doesNotMatch(authSource, /reclaimUnverifiedPreRegistrationAndLink/);
  assert.match(
    authSource,
    /databaseHooks:\s*\{[\s\S]*?account:[\s\S]*?rejectUnverifiedProviderLink\(account\.userId\)/,
  );
  assert.match(authSource, /if \(user && !user\.emailVerified\)/);
  assert.doesNotMatch(authSource, /delete from|update [\s\S]*?"user"/i);
});

test("every explicit provider-link create runs the configured account hook", async () => {
  const [explicitLink, callback, withHooks] = await Promise.all([
    readFile("node_modules/better-auth/dist/api/routes/account.mjs", "utf8"),
    readFile("node_modules/better-auth/dist/api/routes/callback.mjs", "utf8"),
    readFile("node_modules/better-auth/dist/db/with-hooks.mjs", "utf8"),
  ]);
  assert.match(explicitLink, /linkSocialAccount[\s\S]*?internalAdapter\.createAccount/);
  assert.match(callback, /if \(link\)[\s\S]*?internalAdapter\.createAccount/);
  const beforeHook = withHooks.indexOf("hooks[model]?.create?.before");
  const hookCall = withHooks.indexOf("toRun(actualData, context)", beforeHook);
  const adapterCreate = withHooks.indexOf(
    "getCurrentAdapter(adapter)).create",
    hookCall,
  );
  assert.ok(
    beforeHook >= 0 && hookCall > beforeHook && adapterCreate > hookCall,
    "account create hooks must run before adapter persistence",
  );
});

test("installed Better Auth keeps identical provider links on its native path", async () => {
  const oauthLinking = await readFile(
    "node_modules/better-auth/dist/oauth2/link-account.mjs",
    "utf8",
  );
  const explicitCallback = await readFile(
    "node_modules/better-auth/dist/api/routes/callback.mjs",
    "utf8",
  );

  assert.match(
    oauthLinking,
    /const linkedAccount =[\s\S]*?if \(!linkedAccount\) \{[\s\S]*?internalAdapter\.linkAccount/,
  );
  assert.match(
    explicitCallback,
    /if \(existingAccount\) \{[\s\S]*?existingAccount\.userId[\s\S]*?\} else if \(!await c\.context\.internalAdapter\.createAccount/,
  );
});
