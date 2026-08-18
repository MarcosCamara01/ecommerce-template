import postgres from "postgres";

async function main() {
  const userId = process.env.ADMIN_USER_ID;
  const schema = process.env.APP_DATABASE_SCHEMA ?? "app_private";
  const url = schema === "public"
    ? process.env.ADMIN_BOOTSTRAP_DATABASE_URL
    : process.env.MIGRATION_DATABASE_URL;

  if (!url) {
    throw new Error(
      schema === "public"
        ? "ADMIN_BOOTSTRAP_DATABASE_URL is required for the legacy public layout"
        : "MIGRATION_DATABASE_URL is required for the private layout",
    );
  }
  if (!userId) throw new Error("ADMIN_USER_ID is required");
  if (!new Set(["public", "app_private"]).has(schema)) {
    throw new Error("APP_DATABASE_SCHEMA must be public or app_private");
  }

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    if (schema === "app_private") {
      const [identity] = await sql`
        select current_user as current_user, session_user as session_user
      `;
      if (
        identity.current_user !== "app_migrator" ||
        identity.session_user !== "app_migrator"
      ) {
        throw new Error(
          "MIGRATION_DATABASE_URL must authenticate as app_migrator",
        );
      }
      await sql`set role app_owner`;
    }
    const rows = await sql`
      update ${sql(schema)}.${sql("user")}
      set role = 'admin', updated_at = now()
      where id = ${userId}
      returning id, role
    `;
    if (rows.length !== 1) {
      throw new Error(`No Better Auth user found for ADMIN_USER_ID=${userId}`);
    }
    console.log(`Admin bootstrap complete for stable user id ${rows[0].id}`);
  } finally {
    await sql`reset role`.catch(() => undefined);
    await sql.end();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
