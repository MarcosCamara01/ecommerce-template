import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CatalogVariantColorHandoffConflictError,
  CatalogVariantIdentityConflictError,
  planCatalogVariantMutation,
} from "./catalog-archive.ts";

test("omitted active variants are archived rather than replaced", () => {
  const plan = planCatalogVariantMutation(
    [
      { id: 1, color: "Black", archivedAt: null },
      { id: 2, color: "Blue", archivedAt: null },
    ],
    [{ id: 1, color: "Black" }],
  );

  assert.deepEqual(plan.archiveIds, [2]);
  assert.deepEqual(plan.mutations, [{ incomingIndex: 0, existingId: 1 }]);
});

test("an archived identity is reactivated by id or its unique color", () => {
  const archivedAt = new Date("2026-08-14T00:00:00.000Z");
  assert.deepEqual(
    planCatalogVariantMutation(
      [{ id: 7, color: "Ochre", archivedAt }],
      [{ id: 7, color: "Ochre" }],
    ).mutations,
    [{ incomingIndex: 0, existingId: 7 }],
  );
  assert.deepEqual(
    planCatalogVariantMutation(
      [{ id: 7, color: "Ochre", archivedAt }],
      [{ color: "Ochre" }],
    ).mutations,
    [{ incomingIndex: 0, existingId: 7 }],
  );
});

test("a missing id reuses an active identity with the same durable color", () => {
  const plan = planCatalogVariantMutation(
    [{ id: 3, color: "Black", archivedAt: null }],
    [{ color: "Black" }],
  );

  assert.deepEqual(plan.archiveIds, []);
  assert.deepEqual(plan.mutations, [{ incomingIndex: 0, existingId: 3 }]);
});

test("cross-color handoffs are rejected before Stripe in either incoming order", () => {
  const existing = [{ id: 3, color: "Black", archivedAt: null }];
  let stripeEmissions = 0;
  const planThenEmitStripe = (incoming) => {
    const plan = planCatalogVariantMutation(existing, incoming);
    stripeEmissions += 1;
    return plan;
  };

  for (const incoming of [
    [{ id: 3, color: "Blue" }, { color: "Black" }],
    [{ color: "Black" }, { id: 3, color: "Blue" }],
  ]) {
    assert.throws(
      () => planThenEmitStripe(incoming),
      (error) =>
        error instanceof CatalogVariantColorHandoffConflictError &&
        /durable variant 3/.test(error.message),
    );
  }
  assert.equal(stripeEmissions, 0);
});

test("a historical archive with missing Stripe state is not removed again", async () => {
  const plan = planCatalogVariantMutation(
    [
      { id: 1, color: "Black", archivedAt: null },
      { id: 2, color: "Ochre", archivedAt: new Date("2026-08-14T00:00:00.000Z") },
    ],
    [{ id: 1, color: "Black" }],
  );
  const source = await readFile(
    new URL("../../../data-access/catalog-sync.repository.ts", import.meta.url),
    "utf8",
  );

  assert.deepEqual(plan.archiveIds, []);
  assert.match(source, /const archiveIds = new Set\(mutationPlan\.archiveIds\)/);
  assert.match(source, /removedVariants:\s*variants[\s\S]*?archiveIds\.has\(variant\.id\)/);
});

test("an explicit identity cannot take a color owned by another archived identity", () => {
  const archivedAt = new Date("2026-08-14T00:00:00.000Z");
  assert.throws(
    () => planCatalogVariantMutation(
      [
        { id: 1, color: "Black", archivedAt: null },
        { id: 2, color: "Blue", archivedAt },
      ],
      [{ id: 1, color: "Blue" }],
    ),
    (error) =>
      error instanceof CatalogVariantIdentityConflictError &&
      /durable variant 2 already owns it/.test(error.message),
  );
});

test("catalog sync applies the identity plan before constructing its Stripe target", async () => {
  const source = await readFile(
    new URL("../../../data-access/catalog-sync.repository.ts", import.meta.url),
    "utf8",
  );
  const planning = source.indexOf("planCatalogVariantMutation(variants, input.variants)");
  const target = source.indexOf("const target: CatalogSyncTarget");
  const durableOperation = source.indexOf("tx.insert(catalogSyncOperations)");

  assert.ok(planning >= 0, "catalog sync must use the durable identity plan");
  assert.ok(planning < target, "archived identities must resolve before Stripe targets");
  assert.ok(
    planning < durableOperation,
    "invalid color handoffs must fail before a replayable operation is inserted",
  );
  assert.match(source, /CatalogVariantColorHandoffConflictError/);
  assert.match(source, /plannedVariants\.map\(\(\{ variant, existing \}\)/);
  assert.match(source, /stripePriceId:\s*existing\?\.stripeId\s*\?\?\s*null/);
});

test("public catalog paths hide archives while historical lookup retains them", async () => {
  const source = await readFile(
    new URL("./products.repository.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /where:\s*isNull\(productsItems\.archivedAt\)/);
  assert.match(source, /where:\s*isNull\(productsVariants\.archivedAt\)/);
  assert.match(source, /findVariantByIdIncludingArchived/);
  assert.match(source, /archivedAt:\s*row\.archivedAt\?\.toISOString\(\)\s*\?\?\s*null/);
  assert.doesNotMatch(source, /\.delete\(productsVariants\)/);
  assert.doesNotMatch(source, /\.delete\(productsItems\)/);
});

test("cart and wishlist reads hide archived catalog identities", async () => {
  const [cartSource, wishlistSource] = await Promise.all([
    readFile(new URL("./cart.repository.ts", import.meta.url), "utf8"),
    readFile(new URL("./wishlist.repository.ts", import.meta.url), "utf8"),
  ]);

  assert.match(cartSource, /isNull\(productsVariants\.archivedAt\)/);
  assert.match(cartSource, /isNull\(productsItems\.archivedAt\)/);
  assert.match(cartSource, /findCheckoutStateByUserId/);
  assert.match(wishlistSource, /isNull\(productsItems\.archivedAt\)/);
  assert.match(wishlistSource, /isNull\(productsVariants\.archivedAt\)/);
});

test("public additions reject archives and admin restoration is explicit", async () => {
  const [dataAccessSource, adminRouteSource, productsSource, adminPageSource, productServiceSource] = await Promise.all([
    readFile(new URL("../../../data-access/index.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../../../catalog-sync/admin-mutations.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("./products.repository.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../../../../app/admin/products/[id]/edit/page.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../../../../services/products.service.ts", import.meta.url), "utf8"),
  ]);

  assert.match(
    dataAccessSource,
    /cart:[\s\S]*?add:[\s\S]*?cartRepository\.upsertAvailable/,
  );
  assert.match(
    dataAccessSource,
    /wishlist:[\s\S]*?add:[\s\S]*?wishlistRepository\.createAvailable/,
  );
  assert.match(productsSource, /findByIdIncludingArchived/);
  assert.match(
    productsSource,
    /findEditableById[\s\S]*?isNull\(productsItems\.archivedAt\)[\s\S]*?variants:\s*\{\s*where:\s*isNull\(productsVariants\.archivedAt\)/,
  );
  assert.match(
    productsSource,
    /findArchivedByIdForRestoration[\s\S]*?isNotNull\(productsItems\.archivedAt\)[\s\S]*?with:\s*\{\s*variants:\s*true/,
  );
  assert.match(adminRouteSource, /manager\.findByIdIncludingArchived\(id\)/);
  assert.match(adminPageSource, /requireCapability\("catalog:manage"\)/);
  assert.match(adminPageSource, /getProductByIdForManager\(principal, productId\)/);
  assert.match(adminPageSource, /getArchivedProductForRestoration/);
  assert.match(adminPageSource, /restore\s*===\s*"1"/);
  assert.match(
    productServiceSource,
    /forCatalogManager\(principal\)\.catalog\.findEditableById\(id\)/,
  );
  assert.match(
    productServiceSource,
    /forCatalogManager\(principal\)[\s\S]*?findArchivedByIdForRestoration\(id\)/,
  );
});

test("catalog additions lock products first through the write transaction", async () => {
  const [cartSource, wishlistSource] = await Promise.all([
    readFile(new URL("./cart.repository.ts", import.meta.url), "utf8"),
    readFile(new URL("./wishlist.repository.ts", import.meta.url), "utf8"),
  ]);
  const cartAdd = cartSource.slice(
    cartSource.indexOf("async upsertAvailable"),
    cartSource.indexOf("async upsert(data"),
  );
  const wishlistAdd = wishlistSource.slice(
    wishlistSource.indexOf("async createAvailable"),
    wishlistSource.indexOf("async delete"),
  );

  assert.match(cartAdd, /isNull\(productsVariants\.archivedAt\)/);
  assert.match(cartAdd, /isNull\(productsItems\.archivedAt\)/);
  assert.match(cartAdd, /\.for\("share"\)/);
  assert.ok(
    cartAdd.indexOf("const [product]") <
      cartAdd.indexOf("const [activeVariant]"),
    "cart additions must lock product before re-reading the active variant",
  );
  assert.doesNotMatch(cartAdd, /innerJoin[\s\S]*?\.for\("share"\)/);
  assert.match(cartAdd, /upsertInternal/);
  assert.match(wishlistAdd, /isNull\(productsItems\.archivedAt\)/);
  assert.match(wishlistAdd, /\.for\("share"\)/);
  assert.match(wishlistAdd, /onConflictDoUpdate/);
});

test("soft archive preserves storage assets for history and restoration", async () => {
  const [routeSource, repositorySource, modelSource, serviceSource, compensationSource] =
    await Promise.all([
      readFile(
        new URL("../../../catalog-sync/admin-mutations.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../../../data-access/catalog-sync.repository.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../../../catalog-sync/model.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../../../catalog-sync/service.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../../../catalog-sync/create-compensation.ts", import.meta.url),
        "utf8",
      ),
    ]);
  const putHandler = routeSource.slice(
    routeSource.indexOf("async function updateCatalogProduct"),
    routeSource.indexOf("async function archiveCatalogProduct"),
  );
  const deleteHandler = routeSource.slice(
    routeSource.indexOf("async function archiveCatalogProduct"),
    routeSource.indexOf("export const POST"),
  );

  assert.match(putHandler, /manager\.findByIdIncludingArchived\(id\)/);
  assert.match(putHandler, /manager\.enqueueUpsert/);
  assert.match(deleteHandler, /manager\.enqueueArchive\(id\)/);
  assert.doesNotMatch(deleteHandler, /deleteImage/);
  assert.match(modelSource, /priorSnapshot:\s*CatalogSnapshot/);
  assert.match(modelSource, /uploadedImageUrls:\s*string\[\]/);
  assert.match(serviceSource, /enqueueUpsert:\s*catalogSyncRepository\.enqueueUpsert/);
  assert.match(serviceSource, /enqueueArchive:\s*catalogSyncRepository\.enqueueArchive/);
  assert.match(repositorySource, /kind === "upsert"[\s\S]*?archivedAt:\s*null/);
  assert.match(repositorySource, /else \{[\s\S]*?archivedAt:\s*now/);
  assert.doesNotMatch(repositorySource, /\.delete\(productsItems\)|\.delete\(productsVariants\)/);
  assert.match(compensationSource, /if \(input\.operationPersisted\) return/);
  assert.match(compensationSource, /input\.uploadedImageUrls/);
  assert.doesNotMatch(compensationSource, /priorSnapshot|existingImages/);
});
