import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { appOwnerStudioUrl } from "./studio-url.ts";

test("Studio assumes app_owner without changing authenticated credentials", () => {
  const value = new URL(appOwnerStudioUrl(
    "postgres://app_migrator:secret@localhost:5432/store?sslmode=disable",
  ));
  assert.equal(value.username, "app_migrator");
  assert.equal(value.searchParams.get("sslmode"), "disable");
  assert.equal(value.searchParams.get("options"), "-c role=app_owner");
});

test("Studio rejects caller-supplied role assumption", () => {
  assert.throws(() => appOwnerStudioUrl(
    "postgres://app_migrator:secret@localhost/store?options=-c%20role%3Dpostgres",
  ));
});

test("db:studio and db:pull share the verified owner-role wrapper", async () => {
  const [packageSource, configSource, studioSource, pullSource, wrapperSource] = await Promise.all([
    readFile("package.json", "utf8"),
    readFile("drizzle.config.ts", "utf8"),
    readFile("scripts/database/studio.ts", "utf8"),
    readFile("scripts/database/pull.ts", "utf8"),
    readFile("scripts/database/owner-role-tool.ts", "utf8"),
  ]);
  assert.match(packageSource, /"db:studio": "tsx scripts\/database\/studio\.ts"/);
  assert.match(packageSource, /"db:pull": "tsx scripts\/database\/pull\.ts"/);
  assert.match(configSource, /DRIZZLE_OWNER_DATABASE_URL/);
  assert.match(studioSource, /verifiedAppOwnerUrl/);
  assert.match(pullSource, /verifiedAppOwnerUrl/);
  assert.match(wrapperSource, /session_user !== "app_migrator"/);
  assert.match(wrapperSource, /identity\.current_user !== "app_owner"/);
});
