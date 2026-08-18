import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("archived products require explicit restore intent at the write boundary", async () => {
  const [page, editForm, productForm] = await Promise.all([
    readFile("src/app/admin/products/[id]/edit/page.tsx", "utf8"),
    readFile("src/components/admin/EditProductForm.tsx", "utf8"),
    readFile("src/components/admin/ProductForm.tsx", "utf8"),
  ]);

  assert.match(page, /restoreArchived=\{restore === "1"\}/);
  assert.match(editForm, /restoreArchived=\{restoreArchived\}/);
  assert.match(productForm, /formData\.append\("restoreArchived", "true"\)/);
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
    route.indexOf("async function putAuthorized"),
    route.indexOf("async function deleteAuthorized"),
  );
  const archive = route.slice(
    route.indexOf("async function deleteAuthorized"),
    route.indexOf("export const POST"),
  );
  for (const handler of [put, archive]) {
    assert.match(handler, /durable = \{ operationId: operation\.id, state: operation\.state \}/);
    assert.match(handler, /if \(durable\) \{[\s\S]*?return queued\(/);
  }
});

test("POST and PUT share catalog text limits before durable mutation", () => {
  assert.match(route, /name: catalogProductNameSchema/);
  assert.match(route, /color: catalogVariantColorSchema/);
  const post = route.slice(
    route.indexOf("async function postAuthorized"),
    route.indexOf("async function putAuthorized"),
  );
  const put = route.slice(
    route.indexOf("async function putAuthorized"),
    route.indexOf("async function deleteAuthorized"),
  );
  assert.ok(post.indexOf("productFormSchema.parse") < post.indexOf("prepareCreate"));
  assert.ok(put.indexOf("productFormSchema.parse") < put.indexOf("enqueueUpsert"));
});
