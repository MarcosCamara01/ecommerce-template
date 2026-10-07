import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const here = (path) => new URL(path, import.meta.url);

async function sources(directory) {
  const entries = await readdir(here(directory), { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) return sources(path);
      return /\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [path] : [];
    }),
  );
  return nested.flat();
}

const list = (text, pattern) => text.match(pattern)[1].match(/"[^"]+"/g);

test("the sizes the browser lists are the sizes of the schema", async () => {
  const constants = await readFile(here("./constants/sizes.ts"), "utf8");
  const schema = await readFile(here("./lib/db/drizzle/schema/products.ts"), "utf8");

  const sizes = list(constants, /PRODUCT_SIZES = \[([^\]]+)\]/);
  assert.deepEqual(sizes, list(schema, /enum\("sizes", \[([^\]]+)\]/));
  assert.deepEqual(sizes, list(schema, /ProductSizeZod = z\.enum\(\[([^\]]+)\]\)/));
});

test("components and hooks take only types from the database schema", async () => {
  // A value imported from the schema brings the tables, the ORM and the
  // validation library into the browser on every page (it was 90 KB of
  // gzipped script). Types cost nothing: they are erased.
  const files = [...(await sources("./components")), ...(await sources("./hooks"))];
  const offenders = [];

  for (const file of files) {
    const text = await readFile(here(file), "utf8");
    const imports = text.matchAll(
      /import\s+(type\s+)?\{([^}]*)\}\s+from\s+"(@\/lib\/db\/drizzle\/schema[^"]*|drizzle-orm[^"]*|drizzle-zod)"/g,
    );
    for (const [, typeOnly, names, source] of imports) {
      if (typeOnly) continue;
      const values = names
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name && !name.startsWith("type "));
      if (values.length > 0) offenders.push(`${file}: ${values.join(", ")} from ${source}`);
    }
  }

  assert.deepEqual(offenders, []);
});
