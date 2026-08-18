import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const baseline = await readFile(
  "drizzle/migrations/0002_runtime_grants.sql",
  "utf8",
);
const cutover = await readFile(
  "scripts/database/cutover-existing.sql",
  "utf8",
);
const verifier = await readFile("scripts/database/verify.ts", "utf8");

test("fresh and cutover grants omit product deletion", () => {
  for (const [name, sql] of [["fresh", baseline], ["cutover", cutover]]) {
    const deleteGrants = sql.match(
      /GRANT SELECT, INSERT, UPDATE, DELETE ON[\s\S]*?TO app_runtime;/g,
    ) ?? [];
    assert.equal(
      deleteGrants.some((grant) =>
        /app_private\.products_(?:items|variants)/.test(grant)
      ),
      false,
      `${name} database must not grant product DELETE`,
    );
    assert.match(
      sql,
      /GRANT SELECT, INSERT, UPDATE ON\s+app_private\.products_items,\s*app_private\.products_variants\s+TO app_runtime;/,
      `${name} database retains explicit catalog saga writes`,
    );
  }
});

test("an idempotent forward migration revokes legacy product deletion", async () => {
  const names = (await readdir("drizzle/migrations"))
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort();
  const upgrades = await Promise.all(
    names
      .filter((name) => Number(name.slice(0, 4)) > 7)
      .map((name) => readFile(`drizzle/migrations/${name}`, "utf8")),
  );
  assert.ok(
    upgrades.some((sql) =>
      /REVOKE DELETE ON\s+app_private\.products_items,\s*app_private\.products_variants\s+FROM app_runtime;/i.test(sql)
    ),
    "post-0007 migration must revoke DELETE for already-migrated databases",
  );
});

test("runtime verification expects and probes minimum product privileges", () => {
  assert.match(
    verifier,
    /products_items:\s*\["INSERT", "SELECT", "UPDATE"\]/,
  );
  assert.match(
    verifier,
    /products_variants:\s*\["INSERT", "SELECT", "UPDATE"\]/,
  );
  assert.match(verifier, /runtime product delete is denied/);
  assert.match(verifier, /runtime variant delete is denied/);
});

test("checkout intent grants make only the session binding mutable", () => {
  for (const sql of [baseline, cutover]) {
    assert.match(
      sql,
      /GRANT SELECT, INSERT ON app_private\.checkout_intents TO app_runtime;/,
    );
    assert.doesNotMatch(
      sql,
      /GRANT (?:SELECT, INSERT, )?UPDATE(?:\(checkout_session_id\))? ON app_private\.checkout_intents TO app_runtime;/,
    );
  }
  assert.match(cutover, /SECURITY DEFINER[\s\S]+bind_checkout_intent/i);
  assert.match(cutover, /GRANT EXECUTE ON FUNCTION app_private\.bind_checkout_intent/i);
  assert.match(verifier, /runtime checkout snapshot update is denied/);
  assert.match(verifier, /runtime direct checkout session update is denied/);
  assert.match(verifier, /checkout binding function matches the write-once contract/);
  assert.match(verifier, /runtime function grants match the exact allowlist/);
  assert.match(verifier, /runtime sequence grants match the exact allowlist/);
  assert.match(verifier, /default private-object ACLs are owner-only/);
  assert.doesNotMatch(verifier, /table_row\.relname in \('checkout_intents', 'stripe_event_receipts'\)/);
});

test("runtime can deduplicate receipts without reading webhook payloads", async () => {
  for (const sql of [baseline, cutover]) {
    assert.match(sql, /GRANT INSERT ON app_private\.stripe_event_receipts TO app_runtime/);
    assert.match(
      sql,
      /GRANT SELECT \(event_id\) ON app_private\.stripe_event_receipts TO app_runtime/,
    );
    const broadReadGrants =
      sql.match(/GRANT SELECT, INSERT ON[\s\S]*?TO app_runtime;/g) ?? [];
    assert.equal(
      broadReadGrants.some((grant) => grant.includes("stripe_event_receipts")),
      false,
    );
  }
  const migration = await readFile(
    "drizzle/migrations/0014_stripe-event-receipt-least-privilege.sql",
    "utf8",
  );
  assert.match(migration, /REVOKE SELECT ON app_private\.stripe_event_receipts/);
  assert.match(verifier, /runtime event receipt payload read is denied/);
  assert.match(verifier, /postgresErrorCode\(error\) !== "42501"/);
});
