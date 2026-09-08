import {
  runDrizzleOwnerCommand,
  verifiedAppOwnerUrl,
} from "./owner-role-tool";

async function main() {
  const rawUrl = process.env.MIGRATION_DATABASE_URL;
  if (!rawUrl) throw new Error("MIGRATION_DATABASE_URL is required");
  const ownerUrl = await verifiedAppOwnerUrl(rawUrl);
  if (process.argv.includes("--check")) {
    console.log("Drizzle introspection owner-role boundary: PASS");
    return;
  }
  const exitCode = await runDrizzleOwnerCommand(["introspect"], ownerUrl);
  if (exitCode !== 0) process.exitCode = exitCode;
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
