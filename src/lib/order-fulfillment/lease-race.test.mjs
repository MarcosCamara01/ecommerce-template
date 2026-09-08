import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FulfillmentLeaseLostError,
  persistFailureUnlessLeaseLost,
} from "./lease-race.ts";

test("stale lease persistence is a benign lost race", async () => {
  assert.equal(
    await persistFailureUnlessLeaseLost(async () => {
      throw new FulfillmentLeaseLostError("reclaimed");
    }),
    false,
  );
});

test("real persistence failures still escape the sweep", async () => {
  await assert.rejects(
    persistFailureUnlessLeaseLost(async () => {
      throw new Error("database unavailable");
    }),
    /database unavailable/,
  );
});

test("work and effect sweeps both tolerate typed lease loss", async () => {
  const source = await readFile(new URL("./index.ts", import.meta.url), "utf8");
  assert.match(source, /error instanceof FulfillmentLeaseLostError\) continue/);
  assert.match(source, /error instanceof FulfillmentLeaseLostError\) return/);
  assert.equal((source.match(/persistFailureUnlessLeaseLost/g) ?? []).length >= 3, true);
});
