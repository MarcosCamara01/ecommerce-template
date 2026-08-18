type DatabaseTarget = Readonly<{
  protocol: string;
  hostname: string;
  port: string;
  database: string;
}>;

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function parseLoopbackDatabaseTarget(value: string): DatabaseTarget {
  const parsed = new URL(value);
  const protocol = parsed.protocol === "postgresql:" ? "postgres:" : parsed.protocol;
  if (protocol !== "postgres:") {
    throw new Error("Runtime database URLs must use postgres protocol");
  }
  const hostname = parsed.hostname.toLowerCase();
  if (!LOOPBACK_HOSTS.has(hostname)) {
    throw new Error("Runtime concurrency probes are restricted to a loopback database");
  }
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (!database || database.includes("/")) {
    throw new Error("Runtime database URL must name exactly one database");
  }
  return {
    protocol,
    hostname,
    port: parsed.port || "5432",
    database,
  };
}

export function assertSameLoopbackDatabaseTargets(
  runtimeUrl: string,
  adminUrl: string,
): void {
  const runtime = parseLoopbackDatabaseTarget(runtimeUrl);
  const admin = parseLoopbackDatabaseTarget(adminUrl);
  if (
    runtime.protocol !== admin.protocol ||
    runtime.hostname !== admin.hostname ||
    runtime.port !== admin.port ||
    runtime.database !== admin.database
  ) {
    throw new Error(
      "Runtime cleanup credential must target the same loopback host, port, protocol, and database",
    );
  }
}
