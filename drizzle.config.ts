import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/drizzle/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DRIZZLE_OWNER_DATABASE_URL ??
      process.env.MIGRATION_DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
