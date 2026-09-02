import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";

import { findViolationsInSource } from "./verify-architecture.mjs";

const root = join(process.cwd(), "architecture-fixture");
const importer = join(root, "src", "app", "api", "example", "route.ts");

test("architecture checks resolve alias and relative database imports", () => {
  for (const source of [
    'import { db } from "@/lib/db/drizzle/connection";',
    'import { db } from "../../../lib/db/drizzle/connection";',
    'const repository = await import("../../../lib/db/drizzle/repositories/orders.repository");',
  ]) {
    assert.deepEqual(
      findViolationsInSource({ importer, source, projectRoot: root }),
      ["src/app/api/example/route.ts"],
    );
  }
});

test("application imports outside the persistence boundary remain allowed", () => {
  assert.deepEqual(
    findViolationsInSource({
      importer,
      source: 'import { dataAccess } from "@/lib/data-access";',
      projectRoot: root,
    }),
    [],
  );
});

test("runtime Drizzle table objects are internal while types and validators are public", () => {
  const cases = [
    ['import type { Product } from "@/lib/db/drizzle/schema";', []],
    ['import { ProductSizeZod } from "@/lib/db/drizzle/schema";', []],
    [
      'import { productsItems } from "@/lib/db/drizzle/schema";',
      ["src/app/api/example/route.ts (Drizzle schema object import)"],
    ],
    [
      'const schema = await import("@/lib/db/drizzle/schema");',
      ["src/app/api/example/route.ts (Drizzle schema object import)"],
    ],
  ];
  for (const [source, expected] of cases) {
    assert.deepEqual(
      findViolationsInSource({ importer, source, projectRoot: root }),
      expected,
    );
  }
});

test("raw catalog persistence is importable only by its guarded service", () => {
  const source = 'import { catalogSyncRepository } from "@/lib/data-access/catalog-sync.repository";';
  assert.deepEqual(
    findViolationsInSource({ importer, source, projectRoot: root }),
    ["src/app/api/example/route.ts"],
  );
  assert.deepEqual(
    findViolationsInSource({
      importer: join(root, "src", "lib", "catalog-sync", "service.ts"),
      source,
      projectRoot: root,
    }),
    [],
  );
  assert.deepEqual(
    findViolationsInSource({
      importer: join(root, "src", "lib", "data-access", "other.ts"),
      source,
      projectRoot: root,
    }),
    ["src/lib/data-access/other.ts"],
  );
});

test("catalog service receives no blanket database exemption", () => {
  assert.deepEqual(
    findViolationsInSource({
      importer: join(root, "src", "lib", "catalog-sync", "service.ts"),
      source: 'import { db } from "@/lib/db/drizzle/connection";',
      projectRoot: root,
    }),
    ["src/lib/catalog-sync/service.ts"],
  );
});

test("catalog System Principal construction is owned by catalog sync", () => {
  const factoryImport =
    'import { getCatalogSyncSystemPrincipal } from "@/lib/catalog-sync/system-principal";';
  assert.deepEqual(
    findViolationsInSource({
      importer: join(root, "src", "app", "api", "cron", "catalog-sync", "route.ts"),
      source: factoryImport,
      projectRoot: root,
    }),
    [],
  );
  assert.deepEqual(
    findViolationsInSource({ importer, source: factoryImport, projectRoot: root }),
    ["src/app/api/example/route.ts (Catalog System Principal factory import)"],
  );
});
