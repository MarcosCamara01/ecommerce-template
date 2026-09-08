import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

import {
  canonicalizeCheckExpression,
  compareSchemaContract,
  inspectDatabaseStructure,
  loadSchemaContract,
} from "./schema-contract.ts";

test("SQL migrations use UTF-8 without a byte-order mark", async () => {
  const migrations = (await readdir("drizzle/migrations"))
    .filter((file) => file.endsWith(".sql"));

  for (const migration of migrations) {
    const contents = await readFile(`drizzle/migrations/${migration}`);
    assert.notDeepEqual(
      Array.from(contents.subarray(0, 3)),
      [0xef, 0xbb, 0xbf],
      `${migration} must not begin with a UTF-8 BOM`,
    );
  }
});

test("schema constraint identifiers fit PostgreSQL's 63-byte limit", async () => {
  const contract = await loadSchemaContract();

  for (const constraint of contract.constraints) {
    assert.ok(
      Buffer.byteLength(constraint, "utf8") <= 63,
      `${constraint} exceeds PostgreSQL's identifier limit`,
    );
  }
});

test("existing-database cutover backfills durable order status and display snapshots", async () => {
  const cutover = await readFile("scripts/database/cutover-existing.sql", "utf8");
  assert.match(cutover, /ADD COLUMN IF NOT EXISTS status text DEFAULT 'confirmed' NOT NULL/i);
  assert.match(cutover, /ADD COLUMN IF NOT EXISTS product_name text/i);
  assert.match(cutover, /SET product_name = product\.name[\s\S]+variant_color = variant\.color[\s\S]+image_url = coalesce\(variant\.images\[1\], product\.img\)/i);
  assert.match(cutover, /Historical order display backfill is incomplete/i);
  assert.match(cutover, /order_status_valid/i);
});

test("existing-database cutover materializes or structurally validates every canonical index", async () => {
  const contract = await loadSchemaContract();
  const cutover = await readFile(
    "scripts/database/cutover-existing.sql",
    "utf8",
  );

  assert.doesNotMatch(cutover, /DROP\s+SCHEMA[^;]+CASCADE/i);
  assert.match(cutover, /DROP\s+SCHEMA\s+IF\s+EXISTS\s+app\s+RESTRICT/i);
  for (const indexName of contract.indexes) {
    assert.match(cutover, new RegExp(`['"]${indexName}['"]`, "i"));
  }
  assert.doesNotMatch(cutover, /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS/i);
  assert.match(cutover, /FROM pg_index metadata/i);
  assert.match(cutover, /metadata\.indkey/i);
  assert.match(cutover, /metadata\.indoption/i);
  assert.match(cutover, /opclass_row\.opcdefault/i);
  assert.match(cutover, /non-canonical definition/i);
});

test("existing-database cutover materializes durable catalog archive identity", async () => {
  const cutover = await readFile(
    "scripts/database/cutover-existing.sql",
    "utf8",
  );

  assert.match(
    cutover,
    /ALTER TABLE app_private\.products_items[\s\S]*?ADD COLUMN IF NOT EXISTS archived_at timestamptz/i,
  );
  assert.match(
    cutover,
    /ALTER TABLE app_private\.products_variants[\s\S]*?ADD COLUMN IF NOT EXISTS archived_at timestamptz/i,
  );
  assert.match(cutover, /'idx_products_archived_at'/i);
  assert.match(cutover, /'idx_variants_archived_at'/i);
});

test("fresh migrations and existing-database cutover preserve catalog preparation commands", async () => {
  const [cutover, model] = await Promise.all([
    readFile("scripts/database/cutover-existing.sql", "utf8"),
    readFile("src/lib/catalog-sync/model.ts", "utf8"),
  ]);

  assert.match(
    cutover,
    /catalog_sync_state AS ENUM \('preparing', 'cancelling', 'pending', 'processing'/i,
  );
  assert.match(
    cutover,
    /ADD VALUE IF NOT EXISTS 'preparing' BEFORE 'pending'/i,
  );
  assert.match(cutover, /request_hash text/i);
  assert.match(model, /"preparing"/);
  assert.match(model, /"cancelled"/);
  assert.match(
    cutover,
    /state::text IN \('succeeded', 'cancelled'\)/i,
  );
  assert.match(cutover, /CREATE TABLE IF NOT EXISTS app_private\.catalog_sync_replay_audit/i);
  assert.match(cutover, /GRANT INSERT ON app_private\.catalog_sync_replay_audit TO app_runtime/i);
});

test("missing index detection survives later PL/pgSQL queries", async () => {
  const cutover = await readFile(
    "scripts/database/cutover-existing.sql",
    "utf8",
  );
  const indexInspection = cutover.indexOf("FROM pg_index metadata");
  const capturedResult = cutover.indexOf("named_index_exists := FOUND", indexInspection);
  const quotedColumns = cutover.indexOf("SELECT string_agg", indexInspection);
  const existenceBranch = cutover.indexOf("IF named_index_exists THEN", quotedColumns);

  assert.ok(indexInspection >= 0, "the named index must be inspected through pg_index");
  assert.ok(
    capturedResult > indexInspection && capturedResult < quotedColumns,
    "pg_index FOUND must be captured before another SELECT overwrites it",
  );
  assert.ok(
    existenceBranch > quotedColumns,
    "the materialization branch must use the captured pg_index result",
  );
  assert.doesNotMatch(
    cutover.slice(quotedColumns, existenceBranch + "IF named_index_exists THEN".length),
    /IF FOUND THEN/i,
  );
});

test("fresh migrations and existing-database cutover enforce OAuth account uniqueness", async () => {
  const contract = await loadSchemaContract();
  const definition = contract.indexDefinitions.find((candidate) =>
    candidate.startsWith("idx_account_provider_account:")
  );
  const migrationFiles = (await readdir("drizzle/migrations"))
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort();
  const freshMigrations = (
    await Promise.all(
      migrationFiles.map((name) =>
        readFile(`drizzle/migrations/${name}`, "utf8")
      ),
    )
  ).join("\n");
  const cutover = await readFile(
    "scripts/database/cutover-existing.sql",
    "utf8",
  );

  assert.ok(definition, "the OAuth account index must exist in the schema contract");
  assert.match(definition, /"unique":true/);
  assert.match(
    freshMigrations,
    /CREATE UNIQUE INDEX "idx_account_provider_account"/i,
  );
  assert.match(
    cutover,
    /GROUP BY provider_id, account_id[\s\S]*?HAVING count\(\*\) > 1[\s\S]*?OAuth account uniqueness cutover aborted/i,
  );
  assert.match(
    cutover,
    /expected_index\.index_name = 'idx_account_provider_account'/i,
  );
  assert.match(
    cutover,
    /actual_index\.is_unique IS DISTINCT FROM expected_is_unique/i,
  );
  assert.match(cutover, /CREATE UNIQUE INDEX %I ON app_private\.%I/i);
});

test("structural contract preserves and compares unique NULL semantics", async () => {
  const contract = await loadSchemaContract();
  const nullableUnique = contract.constraintDefinitions.find((definition) =>
    definition.startsWith("checkout_intent_session_unique:")
  );
  const explicitUnique = contract.indexDefinitions.find((definition) =>
    definition.startsWith("idx_account_provider_account:")
  );
  const nonUnique = contract.indexDefinitions.find((definition) =>
    definition.startsWith("idx_fulfillment_work_claim:")
  );

  assert.match(
    nullableUnique ?? "",
    /"nullsNotDistinct":false/,
    "the nullable checkout-session unique keeps NULLS DISTINCT and permits multiple NULLs",
  );
  assert.match(explicitUnique ?? "", /"nullsNotDistinct":false/);
  assert.doesNotMatch(
    nonUnique ?? "",
    /nullsNotDistinct/,
    "NULL uniqueness semantics must not affect non-unique indexes",
  );

  const wrongConstraint = {
    ...contract,
    constraintDefinitions: contract.constraintDefinitions.map((definition) =>
      definition === nullableUnique
        ? definition.replace(
          '"nullsNotDistinct":false',
          '"nullsNotDistinct":true',
        )
        : definition
    ),
  };
  assert.match(
    compareSchemaContract(contract, wrongConstraint).join("; "),
    /constraintDefinitions differ/,
  );

  const wrongIndex = {
    ...contract,
    indexDefinitions: contract.indexDefinitions.map((definition) =>
      definition === explicitUnique
        ? definition.replace(
          '"nullsNotDistinct":false',
          '"nullsNotDistinct":true',
        )
        : definition
    ),
  };
  assert.match(
    compareSchemaContract(contract, wrongIndex).join("; "),
    /indexDefinitions differ/,
  );
});

test("database inspection and cutover require PostgreSQL NULL-semantics metadata", async () => {
  const [source, cutover] = await Promise.all([
    readFile("scripts/database/schema-contract.ts", "utf8"),
    readFile("scripts/database/cutover-existing.sql", "utf8"),
  ]);

  assert.match(source, /metadata\.indnullsnotdistinct as nulls_not_distinct/i);
  assert.match(
    source,
    /backing_index\.indnullsnotdistinct as nulls_not_distinct/i,
  );
  assert.match(source, /requires PostgreSQL 15\+ catalog support/i);
  assert.match(cutover, /metadata\.indnullsnotdistinct AS nulls_not_distinct/i);
  assert.match(
    cutover,
    /backing_index\.indnullsnotdistinct AS nulls_not_distinct/i,
  );
  assert.match(cutover, /non-canonical NULL uniqueness semantics/i);

  await assert.rejects(
    inspectDatabaseStructure({
      unsafe: async (query) => query.includes("indnullsnotdistinct")
        ? [{ supported: false }]
        : [],
    }),
    /requires PostgreSQL 15\+ catalog support/,
  );
});

test("existing-database cutover preserves historical Stripe price evidence", async () => {
  const cutover = await readFile("scripts/database/cutover-existing.sql", "utf8");
  const preparation = await readFile(
    "scripts/database/prepare-cutover-price-evidence.sql",
    "utf8",
  );

  assert.doesNotMatch(cutover, /products_items\s+pi[\s\S]+pi\.price/i);
  assert.match(cutover, /public\.cutover_order_price_evidence/i);
  assert.match(cutover, /historical_order_price_evidence/i);
  assert.match(
    cutover,
    /SELECT EXISTS\s*\(\s*SELECT 1 FROM app_private\.order_products\s*\) INTO historical_lines/i,
  );
  assert.match(
    cutover,
    /op\.unit_amount IS NOT NULL AND op\.unit_amount <> evidence\.unit_amount/i,
  );
  assert.match(preparation, /Stripe Checkout Session line-item responses/i);
  assert.match(cutover, /CONSTRAINT\s+order_unit_amount_nonnegative/i);
  assert.match(cutover, /conflicting_existing_evidence/i);
  assert.match(cutover, /IS DISTINCT FROM ROW/i);
  assert.match(cutover, /conflicts with archived evidence/i);
  assert.match(cutover, /ON CONFLICT \(order_product_id\) DO NOTHING/i);
});

test("database bootstrap removes implicit PUBLIC function execution", async () => {
  const bootstrap = await readFile("scripts/database/bootstrap-roles.sql", "utf8");
  assert.match(
    bootstrap,
    /ALTER DEFAULT PRIVILEGES[\s\S]+REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC/i,
  );
  assert.match(
    bootstrap,
    /REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC, app_runtime/i,
  );
  assert.match(
    bootstrap,
    /to_regprocedure\([\s\S]*?bind_checkout_intent\(text,text,text\)[\s\S]*?GRANT EXECUTE/,
  );
});

test("existing-database cutover removes every unrecognized private ACL", async () => {
  const [cutover, verifier] = await Promise.all([
    readFile("scripts/database/cutover-existing.sql", "utf8"),
    readFile("scripts/database/verify.ts", "utf8"),
  ]);
  assert.match(cutover, /rolname NOT IN \('app_owner', 'app_runtime'\)/);
  assert.match(cutover, /REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA app_private/);
  assert.match(cutover, /ALTER FUNCTION %s OWNER TO app_owner/);
  assert.match(cutover, /REVOKE ALL PRIVILEGES \(%s\) ON TABLE app_private\.%I/);
  assert.match(cutover, /REVOKE ALL PRIVILEGES ON SCHEMA app_private/);
  assert.match(verifier, /private object ACL grantees match the exact allowlist/);
  assert.match(verifier, /grantee not in \('app_owner', 'app_runtime'\)/);
});

test("migrator reaches private DDL only by assuming app_owner", async () => {
  const [bootstrap, migration, migrateScript] = await Promise.all([
    readFile("scripts/database/bootstrap-roles.sql", "utf8"),
    readFile("drizzle/migrations/0016_migrator-schema-least-privilege.sql", "utf8"),
    readFile("scripts/database/migrate.ts", "utf8"),
  ]);
  assert.match(
    bootstrap,
    /ALTER ROLE app_migrator NOINHERIT[\s\S]*?REVOKE app_owner FROM app_migrator[\s\S]*?GRANT app_owner TO app_migrator/,
  );
  assert.match(bootstrap, /ALTER ROLE app_migrator NOINHERIT/);
  assert.match(bootstrap, /ALTER DEFAULT PRIVILEGES FOR ROLE app_owner\s+REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC/);
  assert.match(bootstrap, /REVOKE ALL ON SCHEMA app_private FROM app_migrator/);
  assert.match(migration, /REVOKE ALL ON SCHEMA app_private FROM app_migrator/);
  assert.match(migrateScript, /__migrator_direct_ddl_probe/);
  assert.match(migrateScript, /session_user !== "app_migrator"/);
  assert.match(migrateScript, /error\.code !== "42501"/);
  assert.match(
    migrateScript,
    /drizzle-orm\/postgres-js\/migrator/,
  );
  assert.match(bootstrap, /app_owner must not be a member of other roles/);
  assert.ok(
    migrateScript.indexOf("assertDirectMigratorDdlIsDenied") <
      migrateScript.indexOf("set role app_owner"),
  );
  assert.ok(
    migrateScript.indexOf("set role app_owner") <
      migrateScript.indexOf("await migrate"),
  );
});

test("private admin bootstrap verifies migrator and assumes app_owner", async () => {
  const source = await readFile("scripts/bootstrap-admin.ts", "utf8");
  assert.match(source, /identity\.current_user !== "app_migrator"/);
  assert.match(source, /identity\.session_user !== "app_migrator"/);
  assert.match(source, /set role app_owner[\s\S]*?update \$\{sql\(schema\)\}/i);
  assert.match(source, /reset role/);
});

test("database CREATE belongs only to the explicit owner role", async () => {
  const [bootstrap, verifier] = await Promise.all([
    readFile("scripts/database/bootstrap-roles.sql", "utf8"),
    readFile("scripts/database/verify.ts", "utf8"),
  ]);
  assert.match(bootstrap, /REVOKE CREATE ON DATABASE %I FROM PUBLIC, app_migrator, app_runtime/);
  assert.match(bootstrap, /GRANT CREATE ON DATABASE %I TO app_owner/);
  assert.match(verifier, /database CREATE is reserved for app_owner/);
  assert.match(verifier, /session_user === "app_runtime"/);
});

test("database bootstrap pre-creates the app_owner migration ledger schema", async () => {
  const [bootstrap, migrate, markApplied] = await Promise.all([
    readFile("scripts/database/bootstrap-roles.sql", "utf8"),
    readFile("scripts/database/migrate.ts", "utf8"),
    readFile("scripts/database/mark-migrations-applied.ts", "utf8"),
  ]);

  assert.match(
    bootstrap,
    /CREATE SCHEMA IF NOT EXISTS drizzle AUTHORIZATION app_owner/i,
  );
  assert.match(bootstrap, /ALTER SCHEMA drizzle OWNER TO app_owner/i);
  assert.match(
    bootstrap,
    /REVOKE ALL ON SCHEMA drizzle FROM PUBLIC, app_runtime/i,
  );
  assert.match(migrate, /set role app_owner[\s\S]+migrate\(/i);
  assert.match(
    markApplied,
    /set role app_owner[\s\S]+drizzle\.__drizzle_migrations/i,
  );
});

test("cutover marking certifies SQL-only checkout binding artifacts", async () => {
  const markApplied = await readFile(
    "scripts/database/mark-migrations-applied.ts",
    "utf8",
  );
  assert.match(markApplied, /inspectCheckoutBinding\(sql\)/);
  assert.match(markApplied, /checkoutBindingContractFailures/);
  assert.ok(
    markApplied.indexOf("checkoutBindingContractFailures") <
      markApplied.indexOf("drizzle.__drizzle_migrations"),
    "function certification must precede migration ledger writes",
  );
});

test("database bootstrap transfers every existing ledger relation before revoking access", async () => {
  const bootstrap = await readFile("scripts/database/bootstrap-roles.sql", "utf8");
  const schemaOwnership = bootstrap.indexOf(
    "ALTER SCHEMA drizzle OWNER TO app_owner",
  );
  const relationTransfer = bootstrap.indexOf(
    "class_row.relkind IN ('r', 'p', 'v', 'm', 'f')",
  );
  const sequenceTransfer = bootstrap.indexOf(
    "ALTER SEQUENCE drizzle.%I OWNER TO app_owner",
  );
  const ownershipPostcondition = bootstrap.indexOf(
    "Drizzle objects are not owned by app_owner",
  );
  const accessRevocation = bootstrap.indexOf(
    "REVOKE ALL ON SCHEMA drizzle FROM PUBLIC, app_runtime",
  );

  assert.ok(schemaOwnership >= 0, "the ledger schema must be transferred");
  assert.ok(
    schemaOwnership < relationTransfer &&
      relationTransfer < sequenceTransfer &&
      sequenceTransfer < ownershipPostcondition &&
      ownershipPostcondition < accessRevocation,
    "tables, views, sequences, and indexes must be verified before access is revoked",
  );
  assert.match(
    bootstrap,
    /class_row\.relkind IN \('r', 'p', 'v', 'm', 'f', 'S', 'i', 'I'\)/,
  );
  assert.match(
    bootstrap,
    /REVOKE ALL ON ALL TABLES IN SCHEMA drizzle FROM PUBLIC, app_runtime/,
  );
  assert.match(
    bootstrap,
    /REVOKE ALL ON ALL SEQUENCES IN SCHEMA drizzle FROM PUBLIC, app_runtime/,
  );
});

test("temporary price evidence remains with one documented cutover actor", async () => {
  const [preparation, cutover, runbook] = await Promise.all([
    readFile("scripts/database/prepare-cutover-price-evidence.sql", "utf8"),
    readFile("scripts/database/cutover-existing.sql", "utf8"),
    readFile("docs/runbooks/database-cutover.md", "utf8"),
  ]);

  assert.doesNotMatch(
    preparation,
    /ALTER TABLE public\.cutover_order_price_evidence OWNER TO app_owner/i,
  );
  const actorGuard = preparation.indexOf("FOREACH object_name IN ARRAY");
  const evidenceCreation = preparation.indexOf(
    "CREATE TABLE IF NOT EXISTS public.cutover_order_price_evidence",
  );
  assert.ok(actorGuard >= 0, "legacy-owner guard must exist");
  assert.ok(
    actorGuard < evidenceCreation,
    "legacy-owner guard must run before temporary evidence creation",
  );
  assert.match(preparation, /owned by %, not cutover actor %/i);
  assert.match(
    preparation,
    /REVOKE ALL ON public\.cutover_order_price_evidence FROM PUBLIC, app_runtime/i,
  );
  assert.match(cutover, /evidence_owner IS DISTINCT FROM current_user/i);
  assert.match(runbook, /same legacy-owner\/cutover actor/i);
});

test("cutover accepts only complete archived evidence when prepared evidence is absent", async () => {
  const cutover = await readFile("scripts/database/cutover-existing.sql", "utf8");

  assert.match(
    cutover,
    /IF to_regclass\('public\.cutover_order_price_evidence'\) IS NOT NULL[\s\S]+ELSIF to_regclass\('app_private\.historical_order_price_evidence'\) IS NOT NULL/i,
  );
  assert.match(cutover, /Archived historical Stripe price evidence is incomplete or inconsistent/i);
  assert.match(cutover, /Prepared or fully archived Stripe price evidence is required/i);
  assert.match(
    cutover,
    /op\.unit_amount IS DISTINCT FROM evidence\.unit_amount[\s\S]+lower\(op\.currency\) IS DISTINCT FROM lower\(evidence\.currency\)/i,
  );
});

test("fresh migration and cutover expose identical sequence capabilities", async () => {
  const fresh = await readFile("drizzle/migrations/0002_runtime_grants.sql", "utf8");
  const cutover = await readFile("scripts/database/cutover-existing.sql", "utf8");
  const auditGrants = await readFile(
    "drizzle/migrations/0004_fulfillment_replay_audit_grants.sql",
    "utf8",
  );

  for (const sql of [fresh, cutover, auditGrants]) {
    assert.match(sql, /GRANT USAGE(?: ON|\s+ON)/i);
    assert.doesNotMatch(sql, /GRANT USAGE\s*,\s*SELECT ON/i);
  }
});

test("schema comparison rejects a constraint with the right name and wrong definition", () => {
  const base = {
    tables: ["order_products"],
    columns: [],
    indexes: [],
    indexDefinitions: [],
    constraints: ["order_unit_amount_nonnegative"],
    enums: [],
  };
  const failures = compareSchemaContract(
    {
      ...base,
      constraintDefinitions: [
        "order_unit_amount_nonnegative:check(unit_amount >= 0)",
      ],
    },
    {
      ...base,
      constraintDefinitions: [
        "order_unit_amount_nonnegative:check(true)",
      ],
    },
  );
  assert.equal(failures.length, 1);
  assert.match(failures[0], /constraintDefinitions differ/);
});

test("constraint contract rejects NOT VALID and wrong deferrability metadata", async () => {
  const expectedContract = await loadSchemaContract();
  for (const definition of expectedContract.constraintDefinitions) {
    assert.match(definition, /"validated":true/);
    assert.match(definition, /"deferrable":false/);
    assert.match(definition, /"initiallyDeferred":false/);
  }

  const inspectedCanonicalConstraint = await inspectDatabaseStructure(
    fakeConstraintDatabase({
      validated: true,
      deferrable: false,
      initiallyDeferred: false,
    }),
  );
  assert.equal(
    inspectedCanonicalConstraint.constraintDefinitions[0],
    expectedContract.constraintDefinitions.find((definition) =>
      definition.startsWith("quantity_positive:")
    ),
    "snapshot and inspected constraints must serialize to the same ordered descriptor",
  );

  const variants = [
    { validated: false, deferrable: false, initiallyDeferred: false },
    { validated: true, deferrable: true, initiallyDeferred: false },
    { validated: true, deferrable: true, initiallyDeferred: true },
  ];
  for (const metadata of variants) {
    const actual = await inspectDatabaseStructure(fakeConstraintDatabase(metadata));
    const expected = {
      ...actual,
      constraintDefinitions: actual.constraintDefinitions.map((definition) =>
        definition
          .replace(`"validated":${metadata.validated}`, '"validated":true')
          .replace(`"deferrable":${metadata.deferrable}`, '"deferrable":false')
          .replace(
            `"initiallyDeferred":${metadata.initiallyDeferred}`,
            '"initiallyDeferred":false',
          )
      ),
    };
    assert.match(
      compareSchemaContract(expected, actual).join("; "),
      /constraintDefinitions differ/,
    );
  }
});

test("cutover validates pre-existing checks and foreign keys before certification", async () => {
  const cutover = await readFile("scripts/database/cutover-existing.sql", "utf8");
  const validatedConstraintTypes = cutover.match(
    /constraint_row\.contype IN \(([^)]+)\)/i,
  )?.[1] ?? "";
  assert.match(validatedConstraintTypes, /'c'/i);
  assert.match(validatedConstraintTypes, /'f'/i);
  assert.match(cutover, /constraint_row\.convalidated AS validated/i);
  assert.match(cutover, /constraint_row\.condeferrable AS deferrable/i);
  assert.match(cutover, /constraint_row\.condeferred AS initially_deferred/i);
  assert.match(cutover, /ALTER TABLE %s VALIDATE CONSTRAINT %I/i);
  assert.match(cutover, /non-canonical deferrability semantics/i);
});

test("schema comparison rejects a same-named index with the wrong definition", () => {
  const base = {
    tables: ["fulfillment_work"],
    columns: [],
    indexes: ["idx_fulfillment_work_claim"],
    constraints: [],
    constraintDefinitions: [],
    enums: [],
  };
  const failures = compareSchemaContract(
    { ...base, indexDefinitions: ["idx_fulfillment_work_claim:state,next_attempt_at"] },
    { ...base, indexDefinitions: ["idx_fulfillment_work_claim:state,lease_owner"] },
  );
  assert.equal(failures.length, 1);
  assert.match(failures[0], /indexDefinitions differ/);
});

test("schema inspection includes extra indexes regardless of their name", async () => {
  const source = await readFile("scripts/database/schema-contract.ts", "utf8");
  assert.doesNotMatch(source, /index_row\.relname\s+like/i);
  assert.match(
    source,
    /not exists\s*\([\s\S]*?from pg_constraint backing_constraint[\s\S]*?backing_constraint\.conindid = metadata\.indexrelid[\s\S]*?\)/i,
  );

  const expected = {
    tables: ["user"],
    columns: [],
    indexes: ["idx_user_email"],
    indexDefinitions: ["idx_user_email:canonical"],
    constraints: ["user_email_unique"],
    constraintDefinitions: ["user_email_unique:canonical"],
    enums: [],
  };
  const actual = {
    ...expected,
    indexes: [...expected.indexes, "legacyEmailUniqueness"].sort(),
    indexDefinitions: [
      ...expected.indexDefinitions,
      'legacyEmailUniqueness:{"table":"user","unique":true}',
    ].sort(),
  };
  const failures = compareSchemaContract(expected, actual);

  assert.match(failures.join("; "), /indexes differ/);
  assert.match(failures.join("; "), /indexDefinitions differ/);
  assert.match(failures.join("; "), /legacyEmailUniqueness/);
});

test("constraint-backed indexes are excluded structurally and not double-counted", async () => {
  const source = await readFile("scripts/database/schema-contract.ts", "utf8");
  const contract = await loadSchemaContract();

  assert.match(
    source,
    /backing_constraint\.conindid = metadata\.indexrelid/i,
  );
  assert.ok(contract.constraints.includes("user_email_unique"));
  assert.ok(
    !contract.indexes.includes("user_email_unique"),
    "the UNIQUE constraint backing index must remain represented only as a constraint",
  );
  assert.ok(contract.indexes.includes("idx_user_email"));
});

test("check expressions compare semantically across PostgreSQL rewrites", () => {
  assert.equal(
    canonicalizeCheckExpression(
      '(("app_private"."order_products"."unit_amount")::bigint >= (0)::bigint)',
    ),
    canonicalizeCheckExpression("unit_amount >= 0"),
  );
  assert.equal(
    canonicalizeCheckExpression("target_kind in ('work', 'effect')"),
    canonicalizeCheckExpression(
      "target_kind = ANY (ARRAY['effect'::text, 'work'::text])",
    ),
  );
  assert.equal(
    canonicalizeCheckExpression("char_length(btrim(reason)) between 1 and 500"),
    canonicalizeCheckExpression(
      "char_length(btrim(reason)) >= 1 AND char_length(btrim(reason)) <= 500",
    ),
  );
  assert.notEqual(
    canonicalizeCheckExpression("quantity > 0"),
    canonicalizeCheckExpression("quantity >= 0"),
  );
});

test("cutover rejects non-canonical check definitions instead of trusting names", async () => {
  const cutover = await readFile("scripts/database/cutover-existing.sql", "utf8");
  assert.match(cutover, /pg_get_expr\(constraint_row\.conbin/i);
  assert.match(cutover, /non-canonical definition/i);
});

test("default function ACL verification fails closed without a private-schema row", async () => {
  const verify = await readFile("scripts/database/verify.ts", "utf8");

  assert.match(
    verify,
    /coalesce\(\s*defaults\.defaclacl,\s*acldefault\('f', owner_role\.oid\)\s*\)/i,
    "a missing pg_default_acl row must use PostgreSQL's PUBLIC-executable default",
  );
  assert.match(
    verify,
    /defaults\.defaclnamespace\s*=\s*private_schema\.oid/i,
    "an ACL from another namespace must not satisfy the private-schema contract",
  );
  assert.match(verify, /where nspname = 'app_private'/i);
});

test("default function ACL verification accepts only the canonical owner-only rows", async () => {
  const [verify, bootstrap] = await Promise.all([
    readFile("scripts/database/verify.ts", "utf8"),
    readFile("scripts/database/bootstrap-roles.sql", "utf8"),
  ]);

  assert.match(verify, /app_owner:app_owner:EXECUTE/);
  assert.match(verify, /app_migrator:app_migrator:EXECUTE/);
  assert.match(
    verify,
    /JSON\.stringify\(actualDefaultFunctionPrivileges\)[\s\S]+JSON\.stringify\(expectedDefaultFunctionPrivileges\)/i,
  );
  assert.match(
    bootstrap,
    /FOREACH owner_role IN ARRAY ARRAY\['app_owner', 'app_migrator'\]/i,
  );
  assert.match(
    bootstrap,
    /REVOKE ALL ON FUNCTIONS FROM %I[\s\S]+GRANT EXECUTE ON FUNCTIONS TO %I/i,
  );
});

test("bootstrap accepts only PostgreSQL's exact creator administration grant", async () => {
  const bootstrap = await readFile("scripts/database/bootstrap-roles.sql", "utf8");
  const membershipGuard = bootstrap.indexOf(
    "WITH RECURSIVE prospective_app_owner_members",
  );
  const intendedGrant = bootstrap.indexOf("GRANT app_owner TO app_migrator");

  assert.ok(membershipGuard >= 0, "the recursive membership guard must exist");
  assert.ok(
    membershipGuard < intendedGrant,
    "unexpected membership must abort before the intended grant",
  );
  assert.match(
    bootstrap,
    /granted_role\.rolname IN \('app_owner', 'app_migrator'\)/i,
  );
  assert.match(bootstrap, /member_role\.rolname\s*=\s*current_user/i);
  assert.match(bootstrap, /grantor_role\.rolsuper/i);
  assert.match(bootstrap, /membership\.admin_option/i);
  assert.match(bootstrap, /NOT membership\.inherit_option/i);
  assert.match(bootstrap, /NOT membership\.set_option/i);
  assert.match(
    bootstrap,
    /membership\.inherit_option\s+OR\s+membership\.set_option/i,
  );
  assert.match(bootstrap, /member_role\.rolname <> 'app_migrator'/i);
  assert.match(bootstrap, /Unexpected app_owner membership detected/i);
});

test("bootstrap scopes temporary owner access to one transaction", async () => {
  const bootstrap = await readFile("scripts/database/bootstrap-roles.sql", "utf8");
  const transaction = bootstrap.indexOf("\nBEGIN;\n");
  const temporaryGrant = bootstrap.indexOf(
    "GRANT app_owner, app_migrator TO %I WITH SET TRUE, INHERIT TRUE, ADMIN FALSE",
  );
  const temporaryRevoke = bootstrap.indexOf(
    "REVOKE app_owner, app_migrator FROM %I GRANTED BY %I",
  );
  const commit = bootstrap.lastIndexOf("\nCOMMIT;");

  assert.ok(transaction >= 0, "bootstrap must start an explicit transaction");
  assert.ok(temporaryGrant > transaction, "temporary SET access must be granted in the transaction");
  assert.ok(temporaryRevoke > temporaryGrant, "the actor's own grant must be revoked");
  assert.ok(commit > temporaryRevoke, "the cleanup must precede commit");
});

test("cutover auth smoke generates its input only at runtime", async () => {
  const integration = await readFile(
    "scripts/database/cutover-postgres.integration.test.mjs",
    "utf8",
  );

  assert.match(
    integration,
    /const LEGACY_AUTH_INPUT\s*=\s*randomBytes\(24\)\.toString\("hex"\)/,
  );
  assert.doesNotMatch(
    integration,
    /\["cutover", "credential", "smoke"\]/,
  );
});

test("app_owner verification distinguishes administration from usable membership", async () => {
  const verify = await readFile("scripts/database/verify.ts", "utf8");

  assert.match(verify, /membership\.inherit_option/i);
  assert.match(verify, /membership\.set_option/i);
  assert.match(verify, /grantor_role\.rolsuper/i);
  assert.match(
    verify,
    /canonicalAppOwnerMembers[\s\S]+member_name === "app_migrator"[\s\S]+admin_option === false/i,
  );
  assert.match(
    verify,
    /canonicalAppOwnerMembers[\s\S]+!hasPerGrantMembershipOptions[\s\S]+inherit_option === false[\s\S]+set_option === true/i,
  );
  assert.match(verify, /canonicalAppOwnerMembers\.length === 1/i);
  assert.match(verify, /creatorAdministrativeMembers\.length <= 1/i);
  assert.match(
    verify,
    /membership\.member_name === databaseFacts\.owner_name/i,
  );
  assert.match(verify, /member_can_create_roles === true/i);
  assert.match(verify, /with recursive app_owner_members\(member_oid\)/i);
  assert.match(
    verify,
    /membership\.inherit_option\s+or\s+membership\.set_option/i,
  );
  assert.match(verify, /member_role\.rolname <> 'app_migrator'/i);
  assert.match(verify, /unexpectedAppOwnerMembers\.length === 0/i);
});

function fakeConstraintDatabase(metadata) {
  return {
    unsafe: async (query) => {
      if (query.includes("attname = 'indnullsnotdistinct'")) {
        return [{ supported: true }];
      }
      if (query.includes("from pg_index metadata")) return [];
      if (query.includes("from pg_constraint constraint_row")) {
        return [{
          constraint_name: "quantity_positive",
          table_name: "cart_items",
          constraint_type: "c",
          columns: [],
          referenced_schema: null,
          referenced_table: null,
          referenced_columns: [],
          update_action: "a",
          delete_action: "a",
          check_expression: "quantity > 0",
          validated: metadata.validated,
          deferrable: metadata.deferrable,
          initially_deferred: metadata.initiallyDeferred,
        }];
      }
      return [];
    },
  };
}
