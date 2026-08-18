import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CatalogUploadCompensationError,
  compensateUploadedCatalogImages,
} from "./create-compensation.ts";
import { createCatalogSyncEngine } from "./engine.ts";
import { removeStorageObjectOrThrow } from "./storage-compensation.ts";
import {
  catalogPriceDecimalFromCents,
  parseCatalogPriceCents,
} from "./money.ts";
import {
  CATALOG_SYNC_IDEMPOTENCY_REPLAY_WINDOW_MS,
  CATALOG_SYNC_MAX_ATTEMPTS,
  catalogSyncFailureState,
  catalogSyncReplaySafety,
  isCatalogSyncClaimEligible,
} from "./state-machine.ts";
import { applyCatalogSyncToStripe } from "./stripe-operations.ts";
import {
  catalogPreparationFailureTransition,
  catalogPreparationCleanupCompletion,
  isCatalogPreparationComplete,
  shouldCompensateRejectedPreparedUpload,
} from "./preparation-state.ts";

const now = new Date("2026-08-14T10:00:00.000Z");
const operation = (overrides = {}) => ({ id: "11111111-1111-4111-8111-111111111111", productId: 1, activeProductId: 1, action: "archive", requestHash: null, state: "processing", target: { kind: "archive", expectedProductUpdatedAt: now.toISOString(), stripePriceIds: ["price_1"], priorSnapshot: { product: { name: "P", description: "D", priceCents: 100, category: "t-shirts", img: "https://example.com/p.jpg", archivedAt: null }, variants: [] } }, stripeResult: null, attemptCount: 1, nextAttemptAt: now, leaseOwner: "worker", leaseExpiresAt: new Date(now.getTime() + 60_000), lastErrorCode: null, lastErrorDetail: null, lastOperatorUserId: null, lastOperatorReason: null, createdAt: now, updatedAt: now, completedAt: null, ...overrides });
const upsertOperation = (overrides = {}) => operation({
  action: "upsert",
  target: {
    kind: "upsert",
    expectedProductUpdatedAt: now.toISOString(),
    createdShell: false,
    product: { name: "P", description: "D", priceCents: 1000, category: "t-shirts", img: "https://example.com/p.jpg" },
    variants: [{ key: "variant-1", variantId: 1, stripePriceId: "price_old", color: "Black", sizes: ["M"], images: ["https://example.com/v.jpg"] }],
    removedVariants: [],
    uploadedImageUrls: [],
    priorSnapshot: { product: { name: "P", description: "D", priceCents: 1000, category: "t-shirts", img: "https://example.com/p.jpg", archivedAt: null }, variants: [] },
  },
  ...overrides,
});
const repository = (overrides = {}) => ({ claimById: async () => null, claimNext: async () => null, renewLease: async () => true, recordStripeResult: async () => true, finalize: async () => "succeeded", fail: async ({ retryable }) => operation({ state: retryable ? "retry_wait" : "needs_attention" }), get: async () => operation({ state: "pending" }), ...overrides });
const engine = (repo, stripe) => createCatalogSyncEngine({ repository: repository(repo), applyStripe: stripe, classify: (error) => ({ retryable: true, code: "test", detail: error.message }) });

test("a rejected stale upload is deleted only after terminal cancellation", () => {
  assert.equal(shouldCompensateRejectedPreparedUpload("cancelling"), true);
  assert.equal(shouldCompensateRejectedPreparedUpload("cancelled"), true);
  for (const state of ["preparing", "pending", "processing", "succeeded", null]) {
    assert.equal(shouldCompensateRejectedPreparedUpload(state), false);
  }
});

test("catalog EUR prices stay within Stripe's eight-digit minor-unit limit", () => {
  assert.equal(parseCatalogPriceCents("999999.99"), 99_999_999);
  assert.equal(parseCatalogPriceCents("1000000.00"), null);
  assert.throws(() => catalogPriceDecimalFromCents(100_000_000));
});

test("preparation cancellation requires a successful settling pass", () => {
  const first = catalogPreparationCleanupCompletion(
    "preparation_cleanup_pending",
    now,
  );
  assert.equal(first.state, "cancelling");
  assert.equal(first.errorCode, "preparation_cleanup_settling");
  assert.equal(first.completedAt, null);
  const settled = catalogPreparationCleanupCompletion(first.errorCode, now);
  assert.equal(settled.state, "cancelled");
  assert.equal(settled.completedAt, now);
  assert.equal(
    catalogPreparationCleanupCompletion("late_upload_cleanup_failed", now).state,
    "cancelling",
  );
});

test("catalog prices reject fractional cents and share one canonical representation", () => {
  assert.equal(parseCatalogPriceCents("1.005"), null);
  assert.equal(parseCatalogPriceCents("1.01"), 101);
  assert.equal(catalogPriceDecimalFromCents(101), "1.01");
});

test("preparation recovery becomes operator-visible at the retry ceiling", () => {
  assert.equal(
    catalogPreparationFailureTransition(CATALOG_SYNC_MAX_ATTEMPTS, now).state,
    "needs_attention",
  );
  assert.equal(
    catalogPreparationFailureTransition(CATALOG_SYNC_MAX_ATTEMPTS - 1, now).state,
    "preparing",
  );
  assert.equal(
    isCatalogPreparationComplete({
      uploadedImageUrls: ["main", "variant"],
      completedImageUrls: ["variant", "main"],
    }),
    true,
  );
});

test("create persists a resumable command before uploading assets", async () => {
  const [routeSource, repositorySource, preparationRepositorySource] = await Promise.all([
    readFile("src/app/api/admin/products/route.ts", "utf8"),
    readFile("src/lib/data-access/catalog-sync.repository.ts", "utf8"),
    readFile("src/lib/data-access/catalog-preparation.repository.ts", "utf8"),
  ]);
  const postHandler = routeSource.slice(
    routeSource.indexOf("async function postAuthorized"),
    routeSource.indexOf("async function putAuthorized"),
  );
  const preparation = repositorySource.slice(
    repositorySource.indexOf("async function prepareCreate"),
    repositorySource.indexOf("async function lockProduct"),
  );
  const activation = preparationRepositorySource.slice(
    preparationRepositorySource.indexOf("async function activatePreparedCreate"),
    preparationRepositorySource.indexOf("async function claimStalePreparation"),
  );

  assert.match(postHandler, /commandIdSchema/);
  assert.match(postHandler, /manager\.prepareCreate/);
  assert.ok(
    postHandler.indexOf("manager.prepareCreate") <
      postHandler.indexOf("await uploadImage"),
  );
  assert.match(postHandler, /manager\.claimPreparedCreate/);
  assert.match(postHandler, /uploadImage\(upload\.file, upload\.path, true\)/);
  assert.match(postHandler, /manager\.recordPreparedUpload/);
  assert.match(postHandler, /manager\.releasePreparedCreate/);
  assert.match(postHandler, /completedImages\.has\(upload\.url\)/);
  assert.match(
    postHandler,
    /catch \(recordError\)[\s\S]*?await deleteImage\(url\)[\s\S]*?throw recordError/,
  );
  assert.ok(
    postHandler.indexOf('operation.state === "preparing"') <
      postHandler.indexOf("await uploadImage"),
    "a raced preparation state must be rechecked before Storage",
  );
  assert.match(preparation, /id: input\.operationId/);
  assert.match(preparation, /requestHash: input\.requestHash/);
  assert.match(preparation, /state: "preparing"/);
  assert.match(activation, /state: "pending"/);
  assert.match(activation, /createdShell: true/);
  assert.match(activation, /completedImageUrls/);
  assert.equal(
    isCatalogSyncClaimEligible(operation({ state: "preparing" }), now),
    false,
  );
});

test("stale catalog preparations are completed or compensated by the sweep", async () => {
  const [preparationRepositorySource, serviceSource, formSource] = await Promise.all([
    readFile("src/lib/data-access/catalog-preparation.repository.ts", "utf8"),
    readFile("src/lib/catalog-sync/service.ts", "utf8"),
    readFile("src/components/admin/ProductForm.tsx", "utf8"),
  ]);

  assert.match(preparationRepositorySource, /async function claimStalePreparation/);
  assert.match(preparationRepositorySource, /catalogPreparationCleanupCompletion/);
  assert.match(preparationRepositorySource, /recordPreparedCleanupFailure/);
  assert.match(serviceSource, /recoverStaleCatalogPreparations/);
  assert.match(serviceSource, /removePreparedImages/);
  assert.match(serviceSource, /activatePreparedCreate/);
  assert.match(serviceSource, /completeCancelPreparedCreate/);
  assert.match(serviceSource, /return \{ handled, results \}/);
  assert.match(serviceSource, /\.\.\.recovered\.results/);
  assert.match(serviceSource, /Math\.floor\(boundedLimit \/ 2\)/);
  assert.match(serviceSource, /outcome: "cancelled"/);
  assert.match(formSource, /sessionStorage\.setItem\(\s*CREATE_COMMAND_STORAGE_KEY/);
  assert.match(formSource, /sessionStorage\.getItem\(CREATE_COMMAND_STORAGE_KEY/);
});

test("catalog replays append audit evidence and preserve preparation semantics", async () => {
  const [repositorySource, schemaSource] = await Promise.all([
    readFile("src/lib/data-access/catalog-sync.repository.ts", "utf8"),
    readFile("src/lib/db/drizzle/schema/catalog-sync.ts", "utf8"),
  ]);
  assert.match(repositorySource, /tx\.insert\(catalogSyncReplayAudit\)/);
  assert.match(repositorySource, /operation\.target\.kind === "preparing"[\s\S]*?"preparing"/);
  assert.match(schemaSource, /catalog_sync_replay_audit/);
  assert.match(schemaSource, /catalog_sync_replay_prior_state_check/);
});
test("storage compensation rejects a resolved removal error", async () => {
  const failure = new Error("storage removal failed");
  await assert.rejects(
    removeStorageObjectOrThrow("products/4/new.jpg", async () => ({ error: failure })),
    failure,
  );
});
test("storage compensation removes the requested object when Storage succeeds", async () => {
  const removals = [];
  await removeStorageObjectOrThrow("products/4/new.jpg", async (paths) => {
    removals.push(paths);
    return { error: null };
  });
  assert.deepEqual(removals, [["products/4/new.jpg"]]);
});
test("update upload compensation reports cleanup failures without losing the original error", async () => {
  const originalError = new Error("product update failed");
  const cleanupError = new Error("storage cleanup failed");
  const attempted = [];

  await assert.rejects(
    compensateUploadedCatalogImages({
      originalError,
      uploadedImageUrls: ["first", "second", "first"],
      deleteImage: async (url) => {
        attempted.push(url);
        if (url === "first") throw cleanupError;
      },
    }),
    (error) => {
      assert.ok(error instanceof CatalogUploadCompensationError);
      assert.equal(error.cause, originalError);
      assert.deepEqual(error.errors, [cleanupError]);
      return true;
    },
  );
  assert.deepEqual(attempted, ["first", "second"]);
});
test("admin catalog inputs expose neither Stripe ids nor a client cache action", async () => {
  const inputSurfaces = [
    "src/app/api/admin/products/route.ts",
    "src/types/admin.ts",
    "src/components/admin/VariantForm.tsx",
    "src/components/admin/VariantsSection.tsx",
    "src/components/admin/ProductForm.tsx",
    "src/components/admin/EditProductForm.tsx",
  ];
  for (const file of inputSurfaces) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /stripe_id|stripeId/);
  }

  const [actions, createForm, editForm, serverRevalidation] = await Promise.all([
    readFile("src/app/actions.ts", "utf8"),
    readFile("src/components/admin/CreateProductForm.tsx", "utf8"),
    readFile("src/components/admin/EditProductForm.tsx", "utf8"),
    readFile("src/lib/catalog-sync/revalidate.ts", "utf8"),
  ]);
  assert.doesNotMatch(actions, /revalidateProducts/);
  assert.doesNotMatch(createForm, /revalidateProducts/);
  assert.doesNotMatch(editForm, /revalidateProducts/);
  assert.match(serverRevalidation, /import "server-only"/);
  assert.match(
    serverRevalidation,
    /revalidateTag\("products",\s*\{\s*expire:\s*0\s*\}\)/,
  );
  assert.doesNotMatch(serverRevalidation, /updateTag/);
});
test("the product repository exposes no catalog write bypass", async () => {
  const source = await readFile(
    "src/lib/db/drizzle/repositories/products.repository.ts",
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /async\s+(create|createWithVariants|update|updateWithVariants|delete)\s*\(/,
  );
  assert.doesNotMatch(source, /InsertProductVariant|Partial<InsertProduct>|stripeId:\s*string/);
});
test("Stripe failure cannot report success", async () => {
  const result = await engine({}, async () => { throw new Error("stripe"); }).processClaimed(operation(), "worker");
  assert.equal(result.outcome, "retry_scheduled");
});
test("DB failure after Stripe reuses recorded result on retry", async () => {
  let calls = 0; let saved;
  const stripe = async () => { calls += 1; return { kind: "archive", archivedPriceIds: ["price_1"] }; };
  const first = engine({ recordStripeResult: async (_id, _worker, result) => { saved = result; return true; }, finalize: async () => { throw new Error("db"); } }, stripe);
  assert.equal((await first.processClaimed(operation(), "worker")).outcome, "retry_scheduled");
  const second = engine({ finalize: async () => "succeeded" }, stripe);
  assert.equal((await second.processClaimed(operation({ stripeResult: saved }), "worker")).outcome, "succeeded");
  assert.equal(calls, 1);
});
test("stale and concurrent operations do not produce false success", async () => {
  const stale = engine({ finalize: async () => "stale_catalog" }, async () => ({ kind: "archive", archivedPriceIds: [] }));
  assert.equal((await stale.processClaimed(operation(), "worker")).outcome, "needs_attention");
  const busy = await engine({}, async () => ({ kind: "archive", archivedPriceIds: [] })).processById(operation().id);
  assert.equal(busy.outcome, "busy");
  assert.equal(isCatalogSyncClaimEligible(operation({ leaseExpiresAt: new Date(now.getTime() + 1) }), now), false);
  assert.equal(catalogSyncFailureState(CATALOG_SYNC_MAX_ATTEMPTS, true), "needs_attention");
});

test("expired replay without a persisted Stripe result requires reconciliation", () => {
  const expired = operation({
    state: "needs_attention",
    stripeResult: null,
    createdAt: new Date(
      now.getTime() - CATALOG_SYNC_IDEMPOTENCY_REPLAY_WINDOW_MS,
    ),
  });

  assert.deepEqual(catalogSyncReplaySafety(expired, now), {
    allowed: false,
    reason: "stripe_reconciliation_required",
  });
  assert.deepEqual(
    catalogSyncReplaySafety(
      operation({
        ...expired,
        stripeResult: { kind: "archive", archivedPriceIds: ["price_1"] },
      }),
      now,
    ),
    { allowed: true },
  );
  assert.deepEqual(
    catalogSyncReplaySafety(
      operation({
        state: "needs_attention",
        stripeResult: null,
        createdAt: new Date(now.getTime() - 60_000),
      }),
      now,
    ),
    { allowed: true },
  );
});

test("automatic claims fence every old attempted state but allow untouched pending work", () => {
  const createdAt = new Date(
    now.getTime() - CATALOG_SYNC_IDEMPOTENCY_REPLAY_WINDOW_MS,
  );
  for (const state of ["pending", "retry_wait", "processing"]) {
    assert.deepEqual(
      catalogSyncReplaySafety(
        operation({ state, attemptCount: 1, stripeResult: null, createdAt }),
        now,
      ),
      { allowed: false, reason: "stripe_reconciliation_required" },
      state,
    );
  }
  assert.deepEqual(
    catalogSyncReplaySafety(
      operation({
        state: "pending",
        attemptCount: 0,
        stripeResult: null,
        createdAt,
      }),
      now,
    ),
    { allowed: true },
  );
});

test("both claim routes fence unsafe work under their transaction before processing", async () => {
  const source = await readFile(
    "src/lib/data-access/catalog-sync.repository.ts",
    "utf8",
  );
  const claimById = source.slice(
    source.indexOf("async function claimById"),
    source.indexOf("async function claimNext"),
  );
  const claimNext = source.slice(
    source.indexOf("async function claimNext"),
    source.indexOf("async function renewLease"),
  );
  assert.match(claimById, /moveUnsafeClaimToNeedsAttention\(tx, operation, now\)/);
  assert.match(claimNext, /moveUnsafeClaimToNeedsAttention\(tx, operation, now\)/);
  assert.doesNotMatch(source, /state: "pending", attemptCount: 0/);
});

test("archive deactivates only its Price when the Stripe Product is shared", async () => {
  const events = [];
  const client = {
    prices: {
      retrieve: async () => assert.fail("archive must not inspect shared Product ownership"),
      list: async () => assert.fail("archive must not enumerate sibling Prices"),
      update: async (id) => {
        events.push(`price:${id}`);
      },
    },
    products: {
      update: async (id) => {
        events.push(`product:${id}`);
      },
    },
  };

  await applyCatalogSyncToStripe(client, operation(), async () => {
    events.push("heartbeat");
  });

  assert.deepEqual(events, [
    "heartbeat",
    "price:price_1",
  ]);
});

test("archive leaves the Stripe Product active even after its final Price", async () => {
  const events = [];
  const client = {
    prices: {
      retrieve: async () => assert.fail("archive must not inspect shared Product ownership"),
      update: async (id) => events.push(`price:${id}`),
      list: async () => assert.fail("archive must not infer Product ownership"),
    },
    products: {
      update: async (id) => events.push(`product:${id}`),
    },
  };
  await applyCatalogSyncToStripe(client, operation(), async () => {
    events.push("heartbeat");
  });
  assert.deepEqual(events, ["heartbeat", "price:price_1"]);
});

test("prepared catalog commands cannot issue Stripe mutations", async () => {
  await assert.rejects(
    applyCatalogSyncToStripe(
      {},
      operation({
        state: "preparing",
        target: {
          kind: "preparing",
          expectedProductUpdatedAt: now.toISOString(),
          createdShell: true,
          product: {
            name: "P",
            description: "D",
            priceCents: 1000,
            category: "t-shirts",
            img: "https://example.com/p.jpg",
          },
          variants: [],
          uploadedImageUrls: [],
          completedImageUrls: [],
          priorSnapshot: {
            product: {
              name: "P",
              description: "D",
              priceCents: 1000,
              category: "t-shirts",
              img: "",
              archivedAt: now.toISOString(),
            },
            variants: [],
          },
        },
      }),
      async () => undefined,
    ),
    /must be activated/,
  );
});

test("upsert verifies its lease immediately before every Stripe call", async () => {
  const events = [];
  const client = {
    prices: {
      retrieve: async () => {
        events.push("price:retrieve");
        return { id: "price_old", product: "prod_1", unit_amount: 999, currency: "eur", type: "one_time" };
      },
      create: async () => {
        events.push("price:create");
        return { id: "price_new", product: "prod_1" };
      },
      update: async () => {
        events.push("price:update");
      },
    },
    products: {
      update: async () => {
        events.push("product:update");
      },
    },
  };

  await applyCatalogSyncToStripe(client, upsertOperation(), async () => {
    events.push("heartbeat");
  });

  assert.deepEqual(events, [
    "heartbeat", "price:retrieve",
    "heartbeat", "product:update",
    "heartbeat", "price:create",
    "heartbeat", "price:update",
  ]);
});

test("upsert stops issuing Stripe mutations as soon as the lease is lost", async () => {
  const mutations = [];
  let heartbeats = 0;
  const client = {
    prices: {
      create: async () => {
        mutations.push("price:create");
        return { id: "price_new", product: "prod_new" };
      },
    },
    products: {
      create: async () => {
        mutations.push("product:create");
        return { id: "prod_new" };
      },
    },
  };
  const createOperation = upsertOperation({
    target: {
      ...upsertOperation().target,
      variants: [{
        ...upsertOperation().target.variants[0],
        stripePriceId: null,
      }],
    },
  });

  await assert.rejects(
    applyCatalogSyncToStripe(client, createOperation, async () => {
      heartbeats += 1;
      if (heartbeats === 2) throw new Error("Catalog sync lease lost");
    }),
    /Catalog sync lease lost/,
  );
  assert.deepEqual(mutations, ["product:create"]);
});

test("Stripe price reuse requires matching amount, EUR, and one-time type", async () => {
  const cases = [
    { unitAmount: 1000, currency: "eur", type: "one_time", reused: true },
    { unitAmount: 999, currency: "eur", type: "one_time", reused: false },
    { unitAmount: 1000, currency: "usd", type: "one_time", reused: false },
    { unitAmount: 1000, currency: "eur", type: "recurring", reused: false },
  ];

  for (const priceCase of cases) {
    const created = [];
    const updated = [];
    const client = {
      prices: {
        retrieve: async () => ({
          id: "price_old",
          product: "prod_1",
          unit_amount: priceCase.unitAmount,
          currency: priceCase.currency,
          type: priceCase.type,
        }),
        create: async (params) => {
          created.push(params);
          return { id: "price_new", product: "prod_1" };
        },
        update: async (id, params) => {
          updated.push({ id, params });
        },
      },
      products: { update: async () => undefined },
    };

    const result = await applyCatalogSyncToStripe(
      client,
      upsertOperation(),
      async () => undefined,
    );

    assert.equal(created.length, priceCase.reused ? 0 : 1);
    assert.equal(
      result.variants["variant-1"].priceId,
      priceCase.reused ? "price_old" : "price_new",
    );
    assert.ok(
      updated.some(({ id, params }) =>
        id === "price_old" && params.active === priceCase.reused
      ),
    );
  }
});
