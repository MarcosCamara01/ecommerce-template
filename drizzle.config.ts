import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl =
  process.env.SUPABASE_DB_URL ||
  process.env.DATABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_DB_URL;

if (!databaseUrl) {
  throw new Error("Falta SUPABASE_DB_URL o DATABASE_URL para Drizzle.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});

