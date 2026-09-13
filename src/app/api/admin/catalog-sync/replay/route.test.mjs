import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("malformed catalog replay JSON returns 400 after authorization", async () => {
  let authorized = false;
  const modules = {
    "next/server": {
      NextResponse: {
        json: (body, init = {}) => ({ body, status: init.status ?? 200 }),
      },
    },
    zod: nativeRequire("zod"),
    "@/lib/catalog-sync/revalidate": { revalidateProducts: async () => undefined },
    "@/app/api/admin/products/authorization": {
      createCatalogRouteHandler: (requireCapability, identityStatus, handler) =>
        async (request) => {
          const principal = await requireCapability(request.headers, "catalog:manage");
          return handler(request, principal);
        },
    },
    "@/lib/catalog-sync/model": { CatalogSyncError: class extends Error {} },
    "@/lib/catalog-sync/service": {
      createCatalogSyncManager: () => assert.fail("manager must not run"),
    },
    "@/lib/identity": {
      IdentityError: class extends Error {},
      identityErrorHttpStatus: () => 401,
      requireCapabilityFromHeaders: async () => {
        authorized = true;
        return { kind: "user", userId: "admin-1", capabilities: ["catalog:manage"] };
      },
    },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "route.ts",
  }).outputText;
  const routeModule = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => modules[id] ?? nativeRequire(id),
    routeModule,
    routeModule.exports,
  );
  const response = await routeModule.exports.POST({
    headers: new Headers(),
    json: async () => { throw new SyntaxError("malformed"); },
  });
  assert.equal(authorized, true);
  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: "Invalid JSON body" });
});
