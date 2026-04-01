import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const queryClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });
export { schema };
export type Database = typeof db;
export type RLSClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Sets the current user ID in PostgreSQL session for RLS policies */
export async function setCurrentUserId(
  client: RLSClient,
  userId: string | null | undefined
): Promise<void> {
  const value = userId || "";
  await client.execute(
    sql`SELECT set_config('app.current_user_id', ${value}, true)`,
  );
}

export async function clearCurrentUserId(client: RLSClient): Promise<void> {
  await client.execute(sql`SELECT set_config('app.current_user_id', '', true)`);
}

/**
 * Executes a database operation with user context set for RLS policies.
 * @example
 * const items = await withRLS(userId, () => db.select().from(cartItems));
 */
export async function withRLS<T>(
  userId: string | null | undefined,
  operation: (tx: RLSClient) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await setCurrentUserId(tx, userId);
    return operation(tx);
  });
}

/** Creates a database transaction with RLS context */
export async function withRLSTransaction<T>(
  userId: string,
  operation: (tx: RLSClient) => Promise<T>,
): Promise<T> {
  return withRLS(userId, operation);
}
