import assert from "node:assert/strict";
import test from "node:test";

import { pairImagePreviews } from "./image-preview.ts";

test("preview completion order never changes the submitted file pairing", async () => {
  const files = [{ name: "first" }, { name: "second" }];
  const resolvers = new Map();
  const paired = pairImagePreviews(
    files,
    (file) => new Promise((resolve) => resolvers.set(file.name, resolve)),
  );

  resolvers.get("second")("preview-second");
  await Promise.resolve();
  resolvers.get("first")("preview-first");

  assert.deepEqual(await paired, [
    { file: files[0], preview: "preview-first" },
    { file: files[1], preview: "preview-second" },
  ]);
});
