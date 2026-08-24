import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";

import { applyHostedExposureConfiguration } from "./apply-hosted-exposure.mjs";

test("hosted exposure is verified only after the pinned config is pushed", async () => {
  const events = [];
  const nodeExecutable = resolve("test-runtime", "node");
  const projectRoot = resolve("test-project");

  await applyHostedExposureConfiguration({
    environment: {
      SUPABASE_ACCESS_TOKEN: "test-token",
      SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
    },
    nodeExecutable,
    projectRoot,
    runProcess: async (executable, args) => {
      events.push({ kind: "push", executable, args });
    },
    verifyExposure: async () => {
      events.push({ kind: "verify" });
    },
  });

  assert.deepEqual(events, [
    {
      kind: "push",
      executable: nodeExecutable,
      args: [
        resolve(projectRoot, "node_modules", "supabase", "dist", "supabase.js"),
        "config",
        "push",
        "--project-ref",
        "abcdefghijklmnopqrst",
        "--yes",
      ],
    },
    { kind: "verify" },
  ]);
});
