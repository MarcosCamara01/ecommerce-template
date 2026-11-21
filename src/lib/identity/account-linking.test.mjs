import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const authSource = await readFile(
  new URL("../../utils/auth.ts", import.meta.url),
  "utf8",
);

test("credential sign-in requires a verified email and mail leaves the response path", () => {
  assert.match(authSource, /import \{ getCanonicalAppOrigin \}/);
  assert.match(authSource, /const authBaseURL = getCanonicalAppOrigin\(\)/);
  assert.match(authSource, /baseURL: authBaseURL/);
  assert.match(authSource, /trustedOrigins: authTrustedOrigins/);
  assert.match(
    authSource,
    /emailAndPassword:\s*\{[\s\S]*?requireEmailVerification:\s*true/,
  );
  assert.match(
    authSource,
    /emailVerification:\s*\{[\s\S]*?sendOnSignIn:\s*true[\s\S]*?sendVerificationEmail:/,
  );
  assert.doesNotMatch(
    authSource,
    /sendOnSignUp:/,
    "sendOnSignUp: true would also mail unverified Google registrations",
  );
  assert.match(authSource, /sendResetPassword:/);
  assert.match(authSource, /revokeSessionsOnPasswordReset:\s*true/);
  assert.match(authSource, /onPasswordReset:\s*\(\{ user \}\) => markEmailVerifiedAfterReset\(user\.id\)/);
  assert.match(authSource, /disabledPaths:\s*\["\/send-verification-email"\]/);
  assert.match(authSource, /backgroundTasks:\s*\{\s*handler:\s*runAfterResponse\s*\}/);
  assert.match(authSource, /function runAfterResponse[\s\S]*?after\(task\)/);
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
  assert.doesNotMatch(authSource, /delete from/i);
  const writes = authSource.match(/\bupdate\s[\s\S]*?`/gi) ?? [];
  assert.equal(writes.length, 1, "auth config writes user rows in one place only");
  assert.match(
    writes[0],
    /^update \$\{authSchemaIdentifier\}\."user"\s+set email_verified = true, updated_at = now\(\)\s+where id = \$\{userId\} and email_verified = false\s+`$/,
    "the one write marks an unverified email verified, and nothing else",
  );
});

test("every explicit provider-link create runs the configured account hook", async () => {
  const [explicitLink, callback, oauthLinking, internalAdapter, withHooks] =
    await Promise.all([
      readFile("node_modules/better-auth/dist/api/routes/account.mjs", "utf8"),
      readFile("node_modules/better-auth/dist/api/routes/callback.mjs", "utf8"),
      readFile("node_modules/better-auth/dist/oauth2/link-account.mjs", "utf8"),
      readFile("node_modules/better-auth/dist/db/internal-adapter.mjs", "utf8"),
      readFile("node_modules/better-auth/dist/db/with-hooks.mjs", "utf8"),
    ]);
  assert.match(explicitLink, /linkSocialAccount[\s\S]*?internalAdapter\.createAccount/);
  assert.match(callback, /if \(link\)[\s\S]*?linkOAuthAccount\(c,/);
  assert.match(
    oauthLinking,
    /async function linkOAuthAccount[\s\S]*?internalAdapter\.createAccount/,
  );
  for (const method of ["createAccount", "linkAccount"]) {
    assert.match(
      internalAdapter,
      new RegExp(`${method}: async \\(account\\) => \\{\\s*return await createWithHooks\\([\\s\\S]*?"account"`),
      `${method} must persist through the account hooks`,
    );
  }
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
  assert.match(
    oauthLinking,
    /const linkedAccount =[\s\S]*?if \(!linkedAccount\) \{[\s\S]*?internalAdapter\.linkAccount/,
  );
  assert.match(
    oauthLinking,
    /if \(existingAccount\) \{[\s\S]*?existingAccount\.userId[\s\S]*?\} else if \(!await c\.context\.internalAdapter\.createAccount/,
  );
});

test("installed Better Auth mails sign-up verification only for credential sign-ups when sendOnSignUp is unset", async () => {
  const [signUp, oauthLinking] = await Promise.all([
    readFile("node_modules/better-auth/dist/api/routes/sign-up.mjs", "utf8"),
    readFile("node_modules/better-auth/dist/oauth2/link-account.mjs", "utf8"),
  ]);
  assert.match(
    signUp,
    /emailVerification\?\.sendOnSignUp \?\? ctx\.context\.options\.emailAndPassword\.requireEmailVerification/,
  );
  assert.match(
    oauthLinking,
    /const requireEmailVerification = c\.context\.socialProviders[\s\S]*?emailVerification\?\.sendOnSignUp \?\? requireEmailVerification/,
    "an OAuth registration follows the provider's own option, which is unset",
  );
});

test("installed Better Auth rate-limits only requests through its router", async () => {
  const [router, endpoints] = await Promise.all([
    readFile("node_modules/better-auth/dist/api/index.mjs", "utf8"),
    readFile("node_modules/better-auth/dist/api/to-auth-endpoints.mjs", "utf8"),
  ]);
  assert.match(
    router,
    /createRouter\(api, \{[\s\S]*?async onRequest\(req\) \{[\s\S]*?disabledPaths\.includes\(normalizedPath\)\) return new Response\("Not Found", \{ status: 404 \}\)[\s\S]*?onRequestRateLimit\(currentRequest, ctx\)/,
    "auth.handler applies disabledPaths and the rate limiter",
  );
  assert.doesNotMatch(endpoints, /rateLimit/i, "auth.api.* skips the rate limiter");
});

test("installed Better Auth defers mail when a background handler is set", async () => {
  const context = await readFile("node_modules/better-auth/dist/context/create-context.mjs", "utf8");
  assert.match(
    context,
    /async runInBackgroundOrAwait\(promise\) \{[\s\S]*?if \(options\.advanced\?\.backgroundTasks\?\.handler\) \{\s*if \(promise instanceof Promise\) options\.advanced\.backgroundTasks\.handler\(promise\.catch\(/,
    "the handler gets a promise whose failure is already caught",
  );
});
