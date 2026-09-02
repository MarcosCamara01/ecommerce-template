import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Postgres stays on a release containing the reconnect-delay fix", async () => {
  const [packageJson, packageLock] = await Promise.all([
    readFile("package.json", "utf8").then(JSON.parse),
    readFile("package-lock.json", "utf8").then(JSON.parse),
  ]);

  const declaredVersion = packageJson.dependencies?.postgres;
  const lockedVersion = packageLock.packages?.["node_modules/postgres"]?.version;

  assert.equal(typeof declaredVersion, "string");
  assert.equal(typeof lockedVersion, "string");
  const declaredMinimum = parseVersion(declaredVersion, /^\^(\d+)\.(\d+)\.(\d+)$/);
  const locked = parseVersion(lockedVersion, /^(\d+)\.(\d+)\.(\d+)$/);
  assert.ok(
    versionAtLeast(declaredMinimum, [3, 4, 9]),
    `postgres dependency floor ${declaredVersion} must include the reconnect-delay fix`,
  );
  assert.ok(
    versionAtLeast(locked, [3, 4, 9]),
    `locked postgres ${lockedVersion} must include the reconnect-delay fix`,
  );
});

function parseVersion(value, pattern) {
  const match = value.match(pattern);
  assert.ok(match, `Expected a supported semantic version, received ${value}`);
  return match.slice(1).map(Number);
}

function versionAtLeast(actual, minimum) {
  return actual.some((part, index) =>
    part > minimum[index] &&
    actual.slice(0, index).every((value, prefix) => value === minimum[prefix])
  ) || actual.every((part, index) => part === minimum[index]);
}
