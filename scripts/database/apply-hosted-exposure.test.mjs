import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";

import { applyHostedExposureConfiguration } from "./apply-hosted-exposure.mjs";

test("hosted exposure is verified only after the pinned config is pushed", async () => {
  const events = [];
  const nodeExecutable = resolve("test-runtime", "node");
  const projectRoot = resolve("test-project");
  const environment = {
    SUPABASE_ACCESS_TOKEN: "test-token",
    SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
  };
  let configPushEnvironment;
  let verifierEnvironment;

  await applyHostedExposureConfiguration({
    environment,
    nodeExecutable,
    projectRoot,
    runProcess: async (executable, args, options) => {
      configPushEnvironment = options.environment;
      events.push({ kind: "push", executable, args });
    },
    verifyExposure: async ({ environment: receivedEnvironment }) => {
      verifierEnvironment = receivedEnvironment;
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
  assert.equal(configPushEnvironment.SUPABASE_ACCESS_TOKEN, "test-token");
  assert.equal(configPushEnvironment.SUPABASE_SERVICE_ROLE_KEY, undefined);
  assert.equal(
    verifierEnvironment.SUPABASE_SERVICE_ROLE_KEY,
    environment.SUPABASE_SERVICE_ROLE_KEY,
  );
});

test("hosted exposure validates every verifier credential before config push", async (t) => {
  for (const testCase of [
    {
      name: "missing service role",
      environment: {
        SUPABASE_ACCESS_TOKEN: "test-token",
        SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
      },
      expected: /SUPABASE_SERVICE_ROLE_KEY/,
    },
    {
      name: "unsafe project ref",
      environment: {
        SUPABASE_ACCESS_TOKEN: "test-token",
        SUPABASE_PROJECT_REF: "attacker.example",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
      },
      expected: /20-character lowercase project reference/,
    },
  ]) {
    await t.test(testCase.name, async () => {
      let mutated = false;
      await assert.rejects(
        applyHostedExposureConfiguration({
          environment: testCase.environment,
          runProcess: async () => {
            mutated = true;
          },
          verifyExposure: async () => {
            mutated = true;
          },
        }),
        testCase.expected,
      );
      assert.equal(mutated, false);
    });
  }
});
