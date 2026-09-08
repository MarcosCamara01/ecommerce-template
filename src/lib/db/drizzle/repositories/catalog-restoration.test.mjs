import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { restorableVariantIdsFromArchiveTarget } from "./catalog-archive.ts";

test("product restore includes only variants active before whole-product archive", () => {
  assert.deepEqual(
    restorableVariantIdsFromArchiveTarget({
      kind: "archive",
      priorSnapshot: {
        variants: [
          { id: 1, archivedAt: null },
          { id: 2, archivedAt: "2026-08-01T00:00:00.000Z" },
          { id: 3, archivedAt: null },
        ],
      },
    }),
    [1, 3],
  );
});

test("restoration fails closed without durable archive evidence", () => {
  assert.equal(restorableVariantIdsFromArchiveTarget({ kind: "upsert" }), null);
});

test("the restoration query uses the latest succeeded archive snapshot", async () => {
  const [readSource, writeSource] = await Promise.all([
    readFile(new URL("./products.repository.ts", import.meta.url), "utf8"),
    readFile("src/lib/data-access/catalog-sync.repository.ts", "utf8"),
  ]);
  for (const source of [readSource, writeSource]) {
    assert.match(source, /catalogSyncOperations\.action, "archive"/);
    assert.match(source, /catalogSyncOperations\.state, "succeeded"/);
    assert.match(source, /restorableVariantIdsFromArchiveTarget/);
  }
  assert.match(readSource, /product\.variants\.filter\(\(variant\) => allowed\.has\(variant\.id\)\)/);
  assert.match(writeSource, /durableVariant && !allowed\.has\(durableVariant\.id\)/);
});
