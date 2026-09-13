import assert from "node:assert/strict";
import test from "node:test";

import { assertSameLoopbackDatabaseTargets } from "./database-target.ts";

test("runtime and cleanup credentials may differ for the same database", () => {
  assert.doesNotThrow(() =>
    assertSameLoopbackDatabaseTargets(
      "postgres://runtime:one@127.0.0.1:55432/postgres",
      "postgres://admin:two@127.0.0.1:55432/postgres",
    ),
  );
});

test("cleanup rejects a different port, host, protocol, or database", () => {
  const runtime = "postgres://runtime:one@127.0.0.1:55432/postgres";
  for (const candidate of [
    "postgres://admin:two@127.0.0.1:5432/postgres",
    "postgres://admin:two@localhost:55432/postgres",
    "https://127.0.0.1:55432/postgres",
    "postgres://admin:two@127.0.0.1:55432/other",
  ]) {
    assert.throws(() => assertSameLoopbackDatabaseTargets(runtime, candidate));
  }
});
