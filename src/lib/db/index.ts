// Database exports
// Drizzle ORM (primary)
export * from "./drizzle";

// Supabase clients (for auth and storage compatibility)
export {
  createClient,
  createCacheableClient,
  createServiceClient,
} from "./supabase/server";
export { createClient as createBrowserClient } from "./supabase/client";
