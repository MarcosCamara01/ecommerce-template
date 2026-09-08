import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

import {
  compareSchemaContract,
  inspectDatabaseStructure,
  loadSchemaContract,
} from "./schema-contract";
import {
  checkoutBindingContractFailures,
  inspectCheckoutBinding,
} from "./checkout-binding-contract";

async function main() {
  if (process.env.CONFIRM_DATABASE_CUTOVER !== "MARK_MIGRATIONS_APPLIED") {
    throw new Error(
      "Set CONFIRM_DATABASE_CUTOVER=MARK_MIGRATIONS_APPLIED after the cutover evidence passes",
    );
  }
  const url = process.env.MIGRATION_DATABASE_URL;
  if (!url) throw new Error("MIGRATION_DATABASE_URL is required");

  const journal = JSON.parse(
    await readFile(join("drizzle", "migrations", "meta", "_journal.json"), "utf8"),
  ) as { entries: Array<{ tag: string; when: number }> };
  const migrations = await Promise.all(
    journal.entries.map(async (entry) => {
      const source = await readFile(
        join("drizzle", "migrations", `${entry.tag}.sql`),
        "utf8",
      );
      return {
        hash: createHash("sha256").update(source).digest("hex"),
        createdAt: entry.when,
      };
    }),
  );

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    const [identity] = await sql`
      select current_user as current_user, session_user as session_user
    `;
    if (
      identity.current_user !== "app_migrator" ||
      identity.session_user !== "app_migrator"
    ) {
      throw new Error("MIGRATION_DATABASE_URL must authenticate as app_migrator");
    }
    await sql`set role app_owner`;

    const expectedSchema = await loadSchemaContract();
    const contractFailures = compareSchemaContract(
      expectedSchema,
      await inspectDatabaseStructure(sql),
    );
    contractFailures.push(
      ...checkoutBindingContractFailures(await inspectCheckoutBinding(sql)),
    );
    if (contractFailures.length > 0) {
      throw new Error(
        `Refusing to mark migrations: ${contractFailures.join("; ")}`,
      );
    }
    const publicTables = await sql`
      select count(*)::int as count from pg_tables
      where schemaname = 'public' and tablename = any(${expectedSchema.tables})
    `;
    if (publicTables[0].count !== 0) {
      throw new Error("Refusing to mark migrations while application tables remain public");
    }

    await sql.begin(async (tx) => {
      await tx`create schema if not exists drizzle authorization app_owner`;
      await tx`
        create table if not exists drizzle.__drizzle_migrations (
          id serial primary key,
          hash text not null,
          created_at bigint
        )
      `;
      for (const migration of migrations) {
        const conflicts = await tx`
          select hash from drizzle.__drizzle_migrations
          where created_at = ${migration.createdAt}
        `;
        if (conflicts.some((row) => row.hash !== migration.hash)) {
          throw new Error(`Migration timestamp collision at ${migration.createdAt}`);
        }
        await tx`
          insert into drizzle.__drizzle_migrations(hash, created_at)
          select ${migration.hash}, ${migration.createdAt}
          where not exists (
            select 1 from drizzle.__drizzle_migrations
            where hash = ${migration.hash} and created_at = ${migration.createdAt}
          )
        `;
      }
    });
    console.log(`Marked ${migrations.length} reviewed migrations as applied`);
  } finally {
    await sql`reset role`.catch(() => undefined);
    await sql.end();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
