import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateReconciledStripeResult } from "./reconciliation.ts";

const target = {
  kind: "upsert",
  variants: [{ key: "variant-1" }],
  removedVariants: [{ stripePriceId: "price_removed" }],
};

test("operator reconciliation must exactly cover durable Stripe effects", () => {
  const result = {
    kind: "upsert",
    variants: { "variant-1": { productId: "prod_1", priceId: "price_1" } },
    archivedPriceIds: ["price_removed"],
  };
  assert.equal(validateReconciledStripeResult(target, result), result);
  assert.throws(() => validateReconciledStripeResult(target, {
    ...result,
    variants: { unexpected: { productId: "prod_1", priceId: "price_1" } },
  }));
  assert.throws(() => validateReconciledStripeResult(target, {
    ...result,
    archivedPriceIds: [],
  }));
});

test("archive reconciliation requires the exact Price set", () => {
  const archiveTarget = { kind: "archive", stripePriceIds: ["price_1"] };
  assert.doesNotThrow(() => validateReconciledStripeResult(archiveTarget, {
    kind: "archive",
    archivedPriceIds: ["price_1"],
  }));
  assert.throws(() => validateReconciledStripeResult(archiveTarget, {
    kind: "archive",
    archivedPriceIds: ["price_other"],
  }));
});

test("operator replay persists validated reconciliation before processing", async () => {
  const [repository, route] = await Promise.all([
    readFile("src/lib/data-access/catalog-sync.repository.ts", "utf8"),
    readFile("src/app/api/admin/catalog-sync/replay/route.ts", "utf8"),
  ]);
  assert.match(repository, /validateReconciledStripeResult/);
  assert.match(repository, /set\(\{ state: replayState, stripeResult/);
  assert.match(route, /reconciledStripeResult: stripeResultSchema\.optional\(\)/);
  assert.match(route, /input\.reconciledStripeResult/);
});
