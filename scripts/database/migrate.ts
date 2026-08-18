import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

class DirectMigratorDdlSucceeded extends Error {}

async function assertDirectMigratorDdlIsDenied(
  sql: ReturnType<typeof postgres>,
) {
  try {
    await sql.begin(async (tx) => {
      await tx.unsafe(
        "create table app_private.__migrator_direct_ddl_probe(id integer)",
      );
      throw new DirectMigratorDdlSucceeded();
    });
  } catch (error) {
    if (error instanceof DirectMigratorDdlSucceeded) {
      throw new Error("app_migrator can run private DDL before SET ROLE");
    }
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "42501"
    ) throw error;
  }
}

async function main() {
  const url = process.env.MIGRATION_DATABASE_URL;
  if (!url) throw new Error("MIGRATION_DATABASE_URL is required");

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

    await assertDirectMigratorDdlIsDenied(sql);
    await sql`set role app_owner`;
    await migrate(drizzle(sql), { migrationsFolder: "drizzle/migrations" });
  } finally {
    await sql`reset role`.catch(() => undefined);
    await sql.end();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
