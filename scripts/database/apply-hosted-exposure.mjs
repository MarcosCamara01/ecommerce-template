import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function runProcess(executable, args, options) {
  return new Promise((resolveProcess, rejectProcess) => {
    const child = spawn(executable, args, {
      cwd: options.projectRoot,
      env: options.environment,
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", rejectProcess);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolveProcess();
        return;
      }
      rejectProcess(
        new Error(
          signal
            ? `Hosted exposure command stopped by ${signal}`
            : `Hosted exposure command exited with code ${String(code)}`,
        ),
      );
    });
  });
}

function requiredEnvironment(environment) {
  const accessToken = environment.SUPABASE_ACCESS_TOKEN?.trim();
  const projectRef = environment.SUPABASE_PROJECT_REF?.trim();
  const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!accessToken || !projectRef || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, and " +
        "SUPABASE_SERVICE_ROLE_KEY are required",
    );
  }
  if (!/^[a-z0-9]{20}$/.test(projectRef)) {
    throw new Error(
      "SUPABASE_PROJECT_REF must be a 20-character lowercase project reference",
    );
  }
  return { projectRef };
}

function environmentWithoutServiceRole(environment) {
  const configPushEnvironment = { ...environment };
  delete configPushEnvironment.SUPABASE_SERVICE_ROLE_KEY;
  return configPushEnvironment;
}

export async function applyHostedExposureConfiguration({
  environment = process.env,
  nodeExecutable = process.execPath,
  projectRoot = process.cwd(),
  runProcess: execute = runProcess,
  verifyExposure = ({ environment: verifyEnvironment, projectRoot: verifyRoot }) =>
    runProcess(
      process.execPath,
      [resolve(verifyRoot, "scripts/database/verify-hosted-exposure.mjs")],
      { environment: verifyEnvironment, projectRoot: verifyRoot },
    ),
} = {}) {
  const { projectRef } = requiredEnvironment(environment);
  const supabaseEntrypoint = resolve(
    projectRoot,
    "node_modules",
    "supabase",
    "dist",
    "supabase.js",
  );

  await execute(
    nodeExecutable,
    [
      supabaseEntrypoint,
      "config",
      "push",
      "--project-ref",
      projectRef,
      "--yes",
    ],
    {
      environment: environmentWithoutServiceRole(environment),
      projectRoot,
    },
  );
  await verifyExposure({ environment, projectRoot });
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  void applyHostedExposureConfiguration().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
