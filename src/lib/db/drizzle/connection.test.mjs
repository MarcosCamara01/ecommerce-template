import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Postgres reconnect scheduling never passes a stale negative delay", async () => {
  const [packageJson, connectionSource] = await Promise.all([
    readFile("node_modules/postgres/package.json", "utf8").then(JSON.parse),
    readFile("node_modules/postgres/src/connection.js", "utf8"),
  ]);

  assert.match(packageJson.version, /^3\.4\.(?:[89]|[1-9]\d+)$/);
  assert.match(
    connectionSource,
    /setTimeout\(connect,\s*closed(?:Date|Time)\s*\?\s*Math\.max\(0,/,
  );
});
