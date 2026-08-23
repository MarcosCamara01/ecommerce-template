import assert from "node:assert/strict";
import test from "node:test";

import { releaseReadinessFailures } from "./release-readiness.mjs";

test("production release requires all external evidence", () => {
  assert.deepEqual(releaseReadinessFailures({ VERCEL_ENV: "production" }), [
    "RELEASE_CUTOVER_EVIDENCE",
    "RELEASE_HOSTED_EXPOSURE_EVIDENCE",
    "RELEASE_CREDENTIAL_ROTATION_EVIDENCE",
  ]);
});

test("preview and local builds do not require production evidence", () => {
  assert.deepEqual(releaseReadinessFailures({ VERCEL_ENV: "preview" }), []);
  assert.deepEqual(releaseReadinessFailures({}), []);
});

test("production accepts non-empty evidence references", () => {
  assert.deepEqual(releaseReadinessFailures({
    VERCEL_ENV: "production",
    RELEASE_CUTOVER_EVIDENCE: "runbook://restore-2026-08-19",
    RELEASE_HOSTED_EXPOSURE_EVIDENCE: "report://hosted-exposure-2026-08-19",
    RELEASE_CREDENTIAL_ROTATION_EVIDENCE: "audit://rotation-2026-08-19",
  }), []);
});
