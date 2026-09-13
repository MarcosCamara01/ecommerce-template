import { spawn } from "node:child_process";

import postgres from "postgres";

import { appOwnerStudioUrl } from "./studio-url";

export async function verifiedAppOwnerUrl(rawUrl: string): Promise<string> {
  const migratorSql = postgres(rawUrl, { max: 1, prepare: false });
  try {
    const [identity] = await migratorSql`
      select current_user as current_user, session_user as session_user
    `;
    if (
      identity.current_user !== "app_migrator" ||
      identity.session_user !== "app_migrator"
    ) {
      throw new Error("MIGRATION_DATABASE_URL must authenticate as app_migrator");
    }
  } finally {
    await migratorSql.end();
  }

  const ownerUrl = appOwnerStudioUrl(rawUrl);
  const ownerSql = postgres(ownerUrl, { max: 1, prepare: false });
  try {
    const [identity] = await ownerSql`
      select current_user as current_user, session_user as session_user
    `;
    if (
      identity.current_user !== "app_owner" ||
      identity.session_user !== "app_migrator"
    ) {
      throw new Error("Database tool connection did not assume app_owner safely");
    }
  } finally {
    await ownerSql.end();
  }
  return ownerUrl;
}

export async function runDrizzleOwnerCommand(
  args: string[],
  ownerUrl: string,
): Promise<number> {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  return new Promise<number>((resolve, reject) => {
    const child = spawn(command, ["drizzle-kit", ...args], {
      stdio: "inherit",
      env: {
        ...process.env,
        DRIZZLE_OWNER_DATABASE_URL: ownerUrl,
      },
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
}
