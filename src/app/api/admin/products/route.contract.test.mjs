import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const adapter = await readFile(new URL("./route.ts", import.meta.url), "utf8");
const route = await readFile(
  "src/lib/catalog-sync/admin-mutations.ts",
  "utf8",
);

test("the route is a shallow adapter over the catalog mutation module", async () => {
  assert.match(adapter, /createCatalogProduct/);
  assert.match(adapter, /updateCatalogProduct/);
  assert.match(adapter, /archiveCatalogProduct/);
  assert.doesNotMatch(adapter, /randomUUID|FormData|createStorageAdminClient|enqueueUpsert/);
  assert.match(route, /createCatalogSyncManager/);
  assert.match(route, /prepareCreate/);
  assert.match(route, /enqueueUpsert/);
  assert.match(route, /enqueueArchive/);
});

test("archived products require explicit restore intent at the write boundary", async () => {
  const [page, editForm, productForm, formEncoder] = await Promise.all([
    readFile("src/app/admin/products/[id]/edit/page.tsx", "utf8"),
    readFile("src/components/admin/EditProductForm.tsx", "utf8"),
    readFile("src/components/admin/ProductForm.tsx", "utf8"),
    readFile("src/components/admin/product-form-data.ts", "utf8"),
  ]);

  assert.match(page, /restoreArchived=\{restore === "1"\}/);
  assert.match(editForm, /restoreArchived=\{restoreArchived\}/);
  assert.match(productForm, /restoreArchived,/);
  assert.match(formEncoder, /form\.append\("restoreArchived", "true"\)/);
  assert.match(route, /existing\.archivedAt && !restoreArchived/);
  assert.match(
    route,
    /restoreArchived[\s\S]*?manager\.findArchivedByIdForRestoration\(id\)/,
  );
  assert.match(route, /enqueueUpsert\(\{[\s\S]*?restoreArchived/);
  assert.match(route, /code: "restore_required"[\s\S]*?retryable: false/);
});

test("a stale upload cannot delete media while a successor can own it", () => {
  assert.match(route, /getOperation\(operation\.id\)/);
  assert.match(
    route,
    /shouldCompensateRejectedPreparedUpload\(current\?\.state\)[\s\S]*?await deleteImage\(url\)/,
  );
  assert.match(route, /recordPreparedCleanupFailure\([\s\S]*?cleanupError/);
});

test("committed update and archive operations retain a recoverable 202 response", () => {
  const put = route.slice(
    route.indexOf("async function updateCatalogProduct"),
    route.indexOf("async function archiveCatalogProduct"),
  );
  const archive = route.slice(
    route.indexOf("async function archiveCatalogProduct"),
  );
  for (const handler of [put, archive]) {
    assert.match(handler, /durable = \{ operationId: operation\.id, state: operation\.state \}/);
    assert.match(handler, /if \(durable\) \{[\s\S]*?return queued\(/);
  }
});

test("POST and PUT share catalog text limits before durable mutation", async () => {
  const input = await readFile("src/lib/catalog-sync/admin-input.ts", "utf8");
  assert.match(input, /name: catalogProductNameSchema/);
  assert.match(input, /color: catalogVariantColorSchema/);
  const post = route.slice(
    route.indexOf("async function createCatalogProduct"),
    route.indexOf("async function updateCatalogProduct"),
  );
  const put = route.slice(
    route.indexOf("async function updateCatalogProduct"),
    route.indexOf("async function archiveCatalogProduct"),
  );
  assert.ok(post.indexOf("productFormSchema.parse") < post.indexOf("prepareCreate"));
  assert.ok(put.indexOf("productFormSchema.parse") < put.indexOf("enqueueUpsert"));
});

test("catalog removal uses durable archive vocabulary", () => {
  assert.match(route, /async function archiveCatalogProduct/);
  assert.match(route, /Product archived successfully/);
  assert.match(route, /Error archiving product/);
  assert.doesNotMatch(route, /deleteAuthorized|Product deleted successfully|Error deleting product/);
});
