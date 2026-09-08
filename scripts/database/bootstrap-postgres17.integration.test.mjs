import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const POSTGRES_IMAGE =
  process.env.BOOTSTRAP_TEST_POSTGRES_IMAGE ?? "postgres:17";
const TEST_DATABASE = "bootstrap_rehearsal";
const PROJECT_ROOT = process.cwd();
const dockerProbe = spawnSync(
  "docker",
  ["version", "--format", "{{.Server.Version}}"],
  { encoding: "utf8" },
);
const dockerUnavailable = dockerProbe.status !== 0 && !process.env.CI
  ? "Docker daemon is unavailable"
  : false;
const SET_ROLE_DENIED_PATTERN =
  /(permission denied to set role|must be member of role|must be able to set role)/i;

function runDocker(args, options = {}) {
  return execFileSync("docker", args, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
    ...options,
  });
}

function runSql(containerName, sql, database = "postgres") {
  return runDocker(
    [
      "exec",
      "-i",
      containerName,
      "psql",
      "-X",
      "-q",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
      "-d",
      database,
    ],
    { input: sql },
  );
}

function runAsCreator(containerName, actorName, password, sql) {
  return spawnSync(
    "docker",
    [
      "exec",
      "-e",
      `PGPASSWORD=${password}`,
      "-i",
      containerName,
      "psql",
      "-X",
      "-q",
      "-v",
      "ON_ERROR_STOP=1",
      "-h",
      "127.0.0.1",
      "-U",
      actorName,
      "-d",
      TEST_DATABASE,
    ],
    {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      input: sql,
      maxBuffer: 4 * 1024 * 1024,
    },
  );
}

function query(containerName, sql, database = TEST_DATABASE) {
  return runDocker([
    "exec",
    containerName,
    "psql",
    "-X",
    "-A",
    "-t",
    "-U",
    "postgres",
    "-d",
    database,
    "-c",
    sql,
  ]).trim();
}

function runNpmScript(script, environment) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  return spawnSync(npm, ["run", script], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    env: { ...process.env, ...environment },
    maxBuffer: 4 * 1024 * 1024,
  });
}

async function waitUntilReady(containerName) {
  let consecutiveReadyChecks = 0;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = spawnSync(
      "docker",
      [
        "exec",
        containerName,
        "psql",
        "-X",
        "-A",
        "-t",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-c",
        "select 1",
      ],
      { encoding: "utf8" },
    );
    consecutiveReadyChecks = result.status === 0
      ? consecutiveReadyChecks + 1
      : 0;
    if (consecutiveReadyChecks === 3) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("PostgreSQL bootstrap test container did not become ready");
}

function stopAndRemove(containerName) {
  const stop = spawnSync("docker", ["stop", containerName], {
    encoding: "utf8",
  });
  const remove = spawnSync("docker", ["rm", "-v", containerName], {
    encoding: "utf8",
  });
  const inspection = spawnSync("docker", ["inspect", containerName], {
    encoding: "utf8",
  });
  const inspectionError = inspection.stderr?.trim() ?? "";

  if (inspection.status === 0) {
    throw new Error(
      `Docker cleanup left ${containerName} behind; ` +
        `stop status ${stop.status}, remove status ${remove.status}`,
    );
  }
  if (!/No such (object|container)/i.test(inspectionError)) {
    throw new Error(
      `Docker cleanup for ${containerName} could not be verified: ` +
        (inspectionError || `inspect status ${inspection.status}`),
    );
  }
}

function cleanupAfterTest(containerName, testError) {
  try {
    stopAndRemove(containerName);
  } catch (cleanupError) {
    if (testError) {
      throw new AggregateError(
        [testError, cleanupError],
        `Bootstrap integration failed and cleanup also failed for ${containerName}`,
      );
    }
    throw cleanupError;
  }
}

test(
  "PostgreSQL 17 creator administration is accepted without retaining data access",
  { skip: dockerUnavailable },
  async () => {
    assert.equal(
      dockerProbe.status,
      0,
      "The PostgreSQL bootstrap integration requires Docker in CI",
    );
    const suffix = `${process.pid}-${randomBytes(5).toString("hex")}`;
    const containerName = `ecommerce-bootstrap-integration-${suffix}`;
    const superPassword = randomBytes(24).toString("hex");
    const creatorPassword = randomBytes(24).toString("hex");
    const migratorPassword = randomBytes(24).toString("hex");
    const runtimePassword = randomBytes(24).toString("hex");
    const bootstrap = readFileSync(
      "scripts/database/bootstrap-roles.sql",
      "utf8",
    );
    let containerCreated = false;
    let testError;

    try {
      try {
        runDocker(
          [
            "run",
            "-d",
            "--name",
            containerName,
            "--pull",
            "missing",
            "-p",
            "127.0.0.1::5432",
            "--env",
            "POSTGRES_PASSWORD",
            POSTGRES_IMAGE,
          ],
          { env: { ...process.env, POSTGRES_PASSWORD: superPassword } },
        );
        containerCreated = true;
      } catch (error) {
        containerCreated =
          spawnSync("docker", ["inspect", containerName], {
            encoding: "utf8",
          }).status === 0;
        throw error;
      }
      await waitUntilReady(containerName);

      const postgresIsSuperuser = query(
        containerName,
        "select rolsuper from pg_roles where rolname = 'postgres'",
        "postgres",
      ) === "t";
      const actorName = postgresIsSuperuser ? "hosted_admin" : "postgres";
      const actorPassword = postgresIsSuperuser
        ? creatorPassword
        : superPassword;
      if (postgresIsSuperuser) {
        runSql(
          containerName,
          `create role hosted_admin login password '${creatorPassword}' createrole;`,
        );
      }
      runDocker([
        "exec",
        containerName,
        "createdb",
        "-U",
        "postgres",
        ...(postgresIsSuperuser ? ["-O", actorName] : []),
        TEST_DATABASE,
      ]);

      for (let run = 0; run < 2; run += 1) {
        const result = runAsCreator(
          containerName,
          actorName,
          actorPassword,
          bootstrap,
        );
        assert.equal(result.status, 0, result.stderr);
      }

      const serverVersion = Number(query(
        containerName,
        "select current_setting('server_version_num')",
      ));
      let verifierEnvironment;
      if (serverVersion >= 160000) {
        const memberships = query(
          containerName,
          `
            select string_agg(
              concat_ws(':',
                parent.rolname,
                member.rolname,
                grantor.rolsuper,
                membership.admin_option,
                membership.inherit_option,
                membership.set_option
              ),
              ',' order by parent.rolname, member.rolname, grantor.rolname
            )
            from pg_auth_members membership
            join pg_roles parent on parent.oid = membership.roleid
            join pg_roles member on member.oid = membership.member
            join pg_roles grantor on grantor.oid = membership.grantor
            where parent.rolname in (
              'app_owner', 'app_migrator', 'app_runtime'
            )
          `,
        );
        assert.equal(
          memberships,
          [
            `app_migrator:${actorName}:t:t:f:f`,
            "app_owner:app_migrator:f:f:f:t",
            `app_owner:${actorName}:t:t:f:f`,
            `app_runtime:${actorName}:t:t:f:f`,
          ].join(","),
        );
      } else {
        assert.equal(
          query(
            containerName,
            `
              select string_agg(
                concat_ws(':',
                  parent.rolname,
                  member.rolname,
                  grantor.rolsuper,
                  membership.admin_option
                ),
                ',' order by parent.rolname, member.rolname, grantor.rolname
              )
              from pg_auth_members membership
              join pg_roles parent on parent.oid = membership.roleid
              join pg_roles member on member.oid = membership.member
              join pg_roles grantor on grantor.oid = membership.grantor
              where parent.rolname in (
                'app_owner', 'app_migrator', 'app_runtime'
              )
            `,
          ),
          "app_owner:app_migrator:f:f",
        );
      }

      const retainedOwnerAccess = runAsCreator(
        containerName,
        actorName,
        actorPassword,
        "set role app_owner;",
      );
      assert.notEqual(retainedOwnerAccess.status, 0);
      assert.match(retainedOwnerAccess.stderr, SET_ROLE_DENIED_PATTERN);

      if (serverVersion >= 160000 && postgresIsSuperuser) {
        runSql(
          containerName,
          `
            alter role app_migrator password '${migratorPassword}';
            alter role app_runtime password '${runtimePassword}';
          `,
          TEST_DATABASE,
        );
        const portBinding = runDocker([
          "port",
          containerName,
          "5432/tcp",
        ]).trim();
        const port = portBinding.slice(portBinding.lastIndexOf(":") + 1);
        verifierEnvironment = {
          VERIFY_DATABASE_URL:
            `postgresql://app_runtime:${runtimePassword}` +
            `@127.0.0.1:${port}/${TEST_DATABASE}`,
        };
        const migrate = runNpmScript("db:migrate", {
          MIGRATION_DATABASE_URL:
            `postgresql://app_migrator:${migratorPassword}` +
            `@127.0.0.1:${port}/${TEST_DATABASE}`,
        });
        assert.equal(migrate.status, 0, migrate.stderr || migrate.stdout);
        const canonical = runNpmScript("db:verify", verifierEnvironment);
        assert.equal(canonical.status, 0, canonical.stderr || canonical.stdout);
      }

      const unsafeGrant = runAsCreator(
        containerName,
        actorName,
        actorPassword,
        serverVersion >= 160000
          ? `grant app_owner to ${actorName} ` +
            "with set true, inherit false, admin false;"
          : `grant app_owner to ${actorName} with admin option;`,
      );
      assert.equal(unsafeGrant.status, 0, unsafeGrant.stderr);
      const rejected = runAsCreator(
        containerName,
        actorName,
        actorPassword,
        bootstrap,
      );
      assert.notEqual(rejected.status, 0);
      assert.match(rejected.stderr, /Unexpected app_owner membership detected/);

      if (serverVersion >= 160000 && postgresIsSuperuser) {
        runSql(
          containerName,
          `
            revoke app_owner from app_migrator granted by ${actorName};
            grant app_owner to app_migrator
              with admin false, inherit false, set true;
            revoke app_owner from ${actorName} granted by ${actorName};
            revoke app_owner from ${actorName} granted by postgres;
            create role rogue_creator login createrole;
            grant app_owner to rogue_creator
              with admin true, inherit false, set false;
          `,
          TEST_DATABASE,
        );
        const compromised = runNpmScript("db:verify", verifierEnvironment);
        const verifierOutput = `${compromised.stdout}\n${compromised.stderr}`;
        assert.notEqual(compromised.status, 0, verifierOutput);
        assert.match(
          verifierOutput,
          /FAIL app_owner has only the migrator and optional database-owner creator administration/,
        );
      }
    } catch (error) {
      testError = error;
      throw error;
    } finally {
      if (containerCreated) cleanupAfterTest(containerName, testError);
    }
  },
);

test(
  "PostgreSQL 15 verifier rejects a CREATEROLE admin as a direct app_owner member",
  { skip: dockerUnavailable },
  async () => {
    assert.equal(
      dockerProbe.status,
      0,
      "The PostgreSQL bootstrap integration requires Docker in CI",
    );
    const suffix = `${process.pid}-${randomBytes(5).toString("hex")}`;
    const containerName = `ecommerce-bootstrap-pg15-verifier-${suffix}`;
    const superPassword = randomBytes(24).toString("hex");
    const creatorPassword = randomBytes(24).toString("hex");
    const migratorPassword = randomBytes(24).toString("hex");
    const runtimePassword = randomBytes(24).toString("hex");
    const bootstrap = readFileSync(
      "scripts/database/bootstrap-roles.sql",
      "utf8",
    );
    let containerCreated = false;
    let testError;

    try {
      try {
        runDocker(
          [
            "run",
            "-d",
            "--name",
            containerName,
            "--pull",
            "missing",
            "-p",
            "127.0.0.1::5432",
            "--env",
            "POSTGRES_PASSWORD",
            "postgres:15",
          ],
          { env: { ...process.env, POSTGRES_PASSWORD: superPassword } },
        );
        containerCreated = true;
      } catch (error) {
        containerCreated =
          spawnSync("docker", ["inspect", containerName], {
            encoding: "utf8",
          }).status === 0;
        throw error;
      }
      await waitUntilReady(containerName);

      runSql(
        containerName,
        `create role hosted_admin login password '${creatorPassword}' createrole;`,
      );
      runDocker([
        "exec",
        containerName,
        "createdb",
        "-U",
        "postgres",
        "-O",
        "hosted_admin",
        TEST_DATABASE,
      ]);
      const bootstrapResult = runAsCreator(
        containerName,
        "hosted_admin",
        creatorPassword,
        bootstrap,
      );
      assert.equal(bootstrapResult.status, 0, bootstrapResult.stderr);
      runSql(
        containerName,
        `
          alter role app_migrator password '${migratorPassword}';
          alter role app_runtime password '${runtimePassword}';
        `,
        TEST_DATABASE,
      );

      const portBinding = runDocker([
        "port",
        containerName,
        "5432/tcp",
      ]).trim();
      const port = portBinding.slice(portBinding.lastIndexOf(":") + 1);
      const migrate = runNpmScript("db:migrate", {
        MIGRATION_DATABASE_URL:
          `postgresql://app_migrator:${migratorPassword}` +
          `@127.0.0.1:${port}/${TEST_DATABASE}`,
      });
      assert.equal(migrate.status, 0, migrate.stderr || migrate.stdout);

      const verifierEnvironment = {
        VERIFY_DATABASE_URL:
          `postgresql://app_runtime:${runtimePassword}` +
          `@127.0.0.1:${port}/${TEST_DATABASE}`,
      };
      const canonical = runNpmScript("db:verify", verifierEnvironment);
      assert.equal(canonical.status, 0, canonical.stderr || canonical.stdout);

      runSql(
        containerName,
        `
          create role rogue_creator login inherit createrole;
          grant app_owner to rogue_creator with admin option;
        `,
        TEST_DATABASE,
      );
      const compromised = runNpmScript("db:verify", verifierEnvironment);
      const verifierOutput = `${compromised.stdout}\n${compromised.stderr}`;
      assert.notEqual(compromised.status, 0, verifierOutput);
      assert.match(
        verifierOutput,
        /FAIL app_owner has only the migrator and optional database-owner creator administration/,
      );
      assert.match(
        verifierOutput,
        /FAIL no other role can reach app_owner membership: rogue_creator/,
      );
    } catch (error) {
      testError = error;
      throw error;
    } finally {
      if (containerCreated) cleanupAfterTest(containerName, testError);
    }
  },
);
