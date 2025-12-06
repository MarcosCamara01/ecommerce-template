import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var drizzlePool: Pool | undefined;
  // eslint-disable-next-line no-var
  var drizzleDb: NodePgDatabase<typeof schema> | undefined;
}

function createPool() {
  const connectionString =
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_DB_URL ||
    "postgres://postgres:postgres@localhost:5432/postgres";

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
}

export async function getPool(): Promise<Pool> {
  if (globalThis.drizzlePool) return globalThis.drizzlePool;
  const pool = createPool();

  if (process.env.NODE_ENV !== "production") {
    globalThis.drizzlePool = pool;
  }
  return pool;
}

export async function getDb(): Promise<NodePgDatabase<typeof schema>> {
  if (globalThis.drizzleDb) return globalThis.drizzleDb;
  const pool = await getPool();

  const db = drizzle(pool, {
    schema,
    logger: process.env.NODE_ENV === "development",
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.drizzleDb = db;
  }

  return db;
}

export { schema };

