import assert from "node:assert/strict";
import test from "node:test";

import { applyHostedExposureConfiguration } from "./apply-hosted-exposure.mjs";

test("hosted exposure is verified only after the pinned config is pushed", async () => {
  const events = [];

  await applyHostedExposureConfiguration({
    environment: {
      SUPABASE_ACCESS_TOKEN: "test-token",
      SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
    },
    nodeExecutable: "C:\\node.exe",
    projectRoot: "C:\\repo",
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
      executable: "C:\\node.exe",
      args: [
        "C:\\repo\\node_modules\\supabase\\dist\\supabase.js",
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
