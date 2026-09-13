console.error(
  "db:push is disabled. Generate a reviewed migration and run it with MIGRATION_DATABASE_URL.",
);
process.exitCode = 1;
