import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./server.ts", import.meta.url), "utf8");

test("an unverified Better Auth session never becomes a Principal", async () => {
  let principalCreations = 0;
  const identity = await loadServerHarness({
    emailVerified: false,
    onCreatePrincipal: () => principalCreations += 1,
  }).getIdentityFromHeaders(new Headers());
  assert.equal(identity, null);
  assert.equal(principalCreations, 0);
});

test("a verified Better Auth session becomes the expected Principal", async () => {
  const identity = await loadServerHarness({ emailVerified: true })
    .getIdentityFromHeaders(new Headers());
  assert.deepEqual(identity, {
    principal: { kind: "user", userId: "user-1", role: "user" },
    email: "user@example.test",
  });
  assert.equal(Object.isFrozen(identity), true);
});

function loadServerHarness({ emailVerified, onCreatePrincipal = () => undefined }) {
  class IdentityError extends Error {}
  const modules = {
    "server-only": {},
    "next/headers": { headers: async () => new Headers() },
    "@/utils/auth": {
      auth: {
        api: {
          getSession: async () => ({
            user: {
              id: "user-1",
              email: "user@example.test",
              emailVerified,
              role: "user",
            },
          }),
          updateUser: async () => undefined,
        },
      },
    },
    "./principal-authority": {
      IdentityError,
      assertCapability: (principal) => principal,
      createUserPrincipalForIdentityModule: ({ userId, role }) => {
        onCreatePrincipal();
        return { kind: "user", userId, role };
      },
    },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "server.ts",
  }).outputText;
  const serverModule = { exports: {} };
  const mockedRequire = (id) => modules[id] ?? nativeRequire(id);
  new Function("require", "module", "exports", compiled)(
    mockedRequire,
    serverModule,
    serverModule.exports,
  );
  return serverModule.exports;
}
