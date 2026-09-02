import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";
import { externalErrorFacts } from "../external/error-facts.ts";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./service.ts", import.meta.url), "utf8");

test("catalog sweep rejects callers without the catalog-sync System Principal", async () => {
  const service = loadServiceHarness();

  await assert.rejects(
    service.runCatalogSyncSweep({ kind: "system", purpose: "order-fulfillment" }),
    /catalog-sync System Principal/,
  );
});

test("catalog sweep accepts only the catalog-sync purpose before persistence", async () => {
  const { service, requestedPurposes } = loadServiceHarness({ withEvidence: true });

  assert.deepEqual(
    await service.runCatalogSyncSweep(
      { kind: "system", purpose: "catalog-sync" },
      { limit: 4 },
    ),
    [],
  );
  assert.deepEqual(requestedPurposes, ["catalog-sync"]);
});

function loadServiceHarness({ withEvidence = false } = {}) {
  const requestedPurposes = [];
  class CatalogSyncError extends Error {}
  class StripeError extends Error {}
  const repository = {
    claimStalePreparation: async () => null,
  };
  const modules = {
    "server-only": {},
    "@/lib/data-access": {
      dataAccess: {
        forCatalogManager: () => ({ catalog: {} }),
      },
    },
    "@/lib/data-access/catalog-sync.repository": {
      catalogSyncRepository: repository,
    },
    "@/lib/identity": {
      assertSystemPrincipal: (principal, purpose) => {
        requestedPurposes.push(purpose);
        if (principal?.kind !== "system" || principal.purpose !== purpose) {
          throw new Error(`A valid ${purpose} System Principal is required`);
        }
        return principal;
      },
    },
    "@/lib/storage/supabase": {
      createStorageAdminClient: () => ({
        storage: { from: () => ({ remove: async () => ({ error: null }) }) },
      }),
    },
    "@/lib/stripe": {
      stripe: {},
      Stripe: { errors: { StripeError } },
    },
    "@/lib/external/error-facts": { externalErrorFacts },
    "./engine": {
      createCatalogSyncEngine: () => ({
        processById: async () => ({ outcome: "busy" }),
        sweep: async () => [],
      }),
    },
    "./model": { CatalogSyncError },
    "./stripe-operations": {
      applyCatalogSyncToStripe: async () => ({ kind: "archive" }),
    },
    "./preparation-state": {
      isCatalogPreparationComplete: () => false,
    },
    "./preparation-cancellation": {
      runPreparationCancellation: async () => null,
    },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "service.ts",
  }).outputText;
  const serviceModule = { exports: {} };
  const mockedRequire = (id) => modules[id] ?? nativeRequire(id);
  new Function("require", "module", "exports", compiled)(
    mockedRequire,
    serviceModule,
    serviceModule.exports,
  );
  return withEvidence
    ? { service: serviceModule.exports, requestedPurposes }
    : serviceModule.exports;
}
