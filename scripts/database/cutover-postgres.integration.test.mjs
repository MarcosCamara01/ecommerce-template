import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const POSTGRES_IMAGE = process.env.CUTOVER_TEST_POSTGRES_IMAGE ?? "postgres:17";
const TEST_DATABASE = "cutover_rehearsal";
const PROJECT_ROOT = process.cwd();
const dockerProbe = spawnSync(
  "docker",
  ["version", "--format", "{{.Server.Version}}"],
  { encoding: "utf8" },
);
const dockerUnavailable =
  dockerProbe.status !== 0 && !process.env.CI
    ? "Docker daemon is unavailable"
    : false;
const SET_ROLE_DENIED_PATTERN =
  /(permission denied to set role|must be member of role|must be able to set role)/i;
const LEGACY_AUTH_INPUT = randomBytes(24).toString("hex");
const LEGACY_CREDENTIAL_SALT = "cutover-smoke-salt";
const LEGACY_CREDENTIAL_HASH =
  `${LEGACY_CREDENTIAL_SALT}:` +
  scryptSync(
    LEGACY_AUTH_INPUT.normalize("NFKC"),
    LEGACY_CREDENTIAL_SALT,
    64,
    { N: 16_384, r: 16, p: 1, maxmem: 128 * 16_384 * 16 * 2 },
  ).toString("hex");
const AUTH_ORIGIN = "http://127.0.0.1:3000";
const betterAuthSmokeHarness = String.raw`
const { auth } = await import("./src/utils/auth.ts");

const origin = process.env.APP_URL;
const email = "legacy-rehearsal@example.test";
const authInput = process.env.CUTOVER_SMOKE_INPUT;
const request = (path, init = {}) => new Request(origin + path, {
  ...init,
  headers: {
    origin,
    ...(init.body ? { "content-type": "application/json" } : {}),
    ...(init.headers ?? {}),
  },
});

const signIn = await auth.handler(request("/api/auth/sign-in/email", {
  method: "POST",
  body: JSON.stringify({ email, password: authInput }),
}));
if (signIn.status !== 200) {
  throw new Error("credential sign-in returned " + signIn.status);
}
const signedIn = await signIn.json();
if (signedIn.user?.id !== "legacy-rehearsal-user" || !signedIn.token) {
  throw new Error("credential sign-in returned the wrong principal or no token");
}
const setCookie = signIn.headers.get("set-cookie");
if (!setCookie) throw new Error("credential sign-in returned no session cookie");
const cookie = setCookie.split(";", 1)[0];

const sessionResponse = await auth.handler(request("/api/auth/get-session", {
  headers: { cookie },
}));
if (sessionResponse.status !== 200) {
  throw new Error("session lookup returned " + sessionResponse.status);
}
const session = await sessionResponse.json();
if (session?.user?.id !== "legacy-rehearsal-user") {
  throw new Error("session lookup did not preserve the authenticated principal");
}

const signOut = await auth.handler(request("/api/auth/sign-out", {
  method: "POST",
  headers: { cookie },
}));
if (signOut.status !== 200) {
  throw new Error("sign-out returned " + signOut.status);
}
const afterSignOut = await auth.handler(request("/api/auth/get-session", {
  headers: { cookie },
}));
if (afterSignOut.status !== 200 || await afterSignOut.json() !== null) {
  throw new Error("signed-out credential session remained active");
}

process.stdout.write(JSON.stringify({
  userId: signedIn.user.id,
  email: signedIn.user.email,
  sessionUserId: session.user.id,
  signedOut: true,
}), () => process.exit(0));
`;
const EXPECTED_LEGACY_STATE = {
  users: [
    {
      id: "legacy-rehearsal-user",
      name: "Legacy Rehearsal",
      email: "legacy-rehearsal@example.test",
      emailVerified: true,
      image: "https://example.test/legacy-avatar.webp",
      role: "user",
      banned: false,
      banReason: null,
      banExpires: null,
      createdAt: "2026-01-01T00:00:01.000000Z",
      updatedAt: "2026-01-01T00:00:02.000000Z",
    },
  ],
  accounts: [
    {
      id: "legacy-account",
      accountId: "legacy-rehearsal@example.test",
      providerId: "credential",
      userId: "legacy-rehearsal-user",
      accessToken: "synthetic-access-token",
      refreshToken: "synthetic-refresh-token",
      idToken: "synthetic-id-token",
      accessTokenExpiresAt: "2027-01-01T00:00:03.000000Z",
      refreshTokenExpiresAt: "2027-01-01T00:00:04.000000Z",
      scope: "openid profile email",
      password: LEGACY_CREDENTIAL_HASH,
      createdAt: "2026-01-01T00:00:05.000000Z",
      updatedAt: "2026-01-01T00:00:06.000000Z",
    },
  ],
  sessions: [
    {
      id: "legacy-session",
      token: "legacy-session-token",
      userId: "legacy-rehearsal-user",
      expiresAt: "2027-01-01T00:00:07.000000Z",
      createdAt: "2026-01-01T00:00:08.000000Z",
      updatedAt: "2026-01-01T00:00:09.000000Z",
      impersonatedBy: "legacy-operator",
      ipAddress: "192.0.2.10",
      userAgent: "cutover-rehearsal-agent",
    },
  ],
  verifications: [
    {
      id: "legacy-verification",
      identifier: "legacy-rehearsal@example.test",
      value: "synthetic-verification",
      expiresAt: "2027-01-01T00:00:10.000000Z",
      createdAt: "2026-01-01T00:00:11.000000Z",
      updatedAt: "2026-01-01T00:00:12.000000Z",
    },
  ],
  products: [
    {
      id: 1,
      name: "Legacy Rehearsal Product",
      description: "Historical cutover sentinel",
      price: 42.5,
      category: "t-shirts",
      img: "https://example.test/legacy-rehearsal.webp",
    },
  ],
  variants: [
    {
      id: 1,
      productId: 1,
      stripeId: "price_legacy_rehearsal",
      color: "Black",
      sizes: ["M"],
      images: ["https://example.test/legacy-rehearsal.webp"],
    },
  ],
  cart: [
    {
      id: 1,
      userId: "legacy-rehearsal-user",
      variantId: 1,
      quantity: 2,
      size: "M",
      stripeId: "price_legacy_rehearsal",
    },
  ],
  wishlist: [
    {
      id: 1,
      userId: "legacy-rehearsal-user",
      productId: 1,
    },
  ],
  orders: [
    {
      id: 1,
      userId: "legacy-rehearsal-user",
      orderNumber: 2026083001,
      status: "confirmed",
    },
  ],
  customers: [
    {
      id: 1,
      orderId: 1,
      name: "Legacy Rehearsal",
      email: "legacy-rehearsal@example.test",
      phone: "+34000000000",
      address: {
        city: "Madrid",
        line1: "QA Street 1",
        country: "ES",
        postal_code: "28001",
      },
      stripeOrderId: "cs_test_legacy_rehearsal",
      totalPrice: 8500,
      currency: "eur",
    },
  ],
  lines: [
    {
      id: 1,
      orderId: 1,
      variantId: 1,
      quantity: 2,
      size: "M",
      unitAmount: 4250,
      currency: "eur",
      productName: "Legacy Rehearsal Product",
      variantColor: "Black",
      imageUrl: "https://example.test/legacy-rehearsal.webp",
    },
  ],
  priceEvidence: [
    {
      orderProductId: 1,
      stripeSessionId: "cs_test_legacy_rehearsal",
      stripeLineItemId: "li_legacy_rehearsal",
      unitAmount: 4250,
      currency: "eur",
    },
  ],
};

function runDocker(args, options = {}) {
  return execFileSync("docker", args, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
    ...options,
  });
}

function runSql(
  containerName,
  sql,
  database = TEST_DATABASE,
  user = "postgres",
) {
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
      user,
      "-d",
      database,
    ],
    { input: sql },
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

function removeContainer(containerName) {
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

async function waitUntilReady(containerName) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
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
        TEST_DATABASE,
        "-c",
        "select 1",
      ],
      { encoding: "utf8" },
    );
    if (result.status === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("PostgreSQL cutover test container did not become ready");
}

async function withPostgresContainer(label, operation) {
  const suffix = `${process.pid}-${randomBytes(5).toString("hex")}`;
  const containerName = `ecommerce-${label}-${suffix}`;
  const superPassword = randomBytes(24).toString("hex");
  let containerCreated = false;
  let operationError;
  let result;

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
          "--env",
          `POSTGRES_DB=${TEST_DATABASE}`,
          POSTGRES_IMAGE,
        ],
        {
          env: { ...process.env, POSTGRES_PASSWORD: superPassword },
        },
      );
      containerCreated = true;
    } catch (error) {
      containerCreated =
        spawnSync("docker", ["inspect", containerName], { encoding: "utf8" })
          .status === 0;
      throw error;
    }

    await waitUntilReady(containerName);
    const portBinding = runDocker(["port", containerName, "5432/tcp"]).trim();
    const portMatch = portBinding.match(/127\.0\.0\.1:(\d+)/);
    assert.ok(portMatch, `Unexpected Docker port binding: ${portBinding}`);
    result = await operation({
      containerName,
      port: Number(portMatch[1]),
      superPassword,
    });
  } catch (error) {
    operationError = error;
  }

  let cleanupError;
  if (containerCreated) {
    try {
      removeContainer(containerName);
    } catch (error) {
      cleanupError = error;
    }
  }

  if (operationError && cleanupError) {
    throw new AggregateError(
      [operationError, cleanupError],
      "PostgreSQL cutover operation and Docker cleanup both failed",
    );
  }
  if (operationError) throw operationError;
  if (cleanupError) throw cleanupError;
  return result;
}

function legacyFingerprint(containerName, schema) {
  const isPublic = schema === "public";
  const evidence =
    schema === "public"
      ? "public.cutover_order_price_evidence"
      : "app_private.historical_order_price_evidence";
  const evidenceExists =
    query(containerName, `select to_regclass('${evidence}') is not null`) ===
    "t";
  const orderStatus = isPublic ? "'confirmed'" : "orders.status";
  const customerCurrency = isPublic
    ? evidenceExists
      ? `(
        select lower(price.currency)
        from ${evidence} price
        where price.stripe_session_id = customers.stripe_order_id
      )`
      : "null::text"
    : "customers.currency";
  const lineFacts = isPublic
    ? evidenceExists
      ? {
          unitAmount: "price.unit_amount",
          currency: "lower(price.currency)",
          productName: "product.name",
          variantColor: "variant.color",
          imageUrl: "coalesce(variant.images[1], product.img)",
          joins: `
          join public.products_variants variant on variant.id = lines.variant_id
          join public.products_items product on product.id = variant.product_id
          left join ${evidence} price on price.order_product_id = lines.id
        `,
        }
      : {
          unitAmount: "null::bigint",
          currency: "null::text",
          productName: "product.name",
          variantColor: "variant.color",
          imageUrl: "coalesce(variant.images[1], product.img)",
          joins: `
          join public.products_variants variant on variant.id = lines.variant_id
          join public.products_items product on product.id = variant.product_id
        `,
        }
    : {
        unitAmount: "lines.unit_amount",
        currency: "lines.currency",
        productName: "lines.product_name",
        variantColor: "lines.variant_color",
        imageUrl: "lines.image_url",
        joins: "",
      };

  return JSON.parse(
    query(
      containerName,
      `
    select jsonb_build_object(
      'users', (
        select jsonb_agg(jsonb_build_object(
          'id', users.id,
          'name', users.name,
          'email', users.email,
          'emailVerified', users.email_verified,
          'image', users.image,
          'role', users.role,
          'banned', users.banned,
          'banReason', users.ban_reason,
          'banExpires', to_char(
            users.ban_expires at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          ),
          'createdAt', to_char(
            users.created_at at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          ),
          'updatedAt', to_char(
            users.updated_at at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          )
        ) order by users.id)
        from ${schema}."user" users
      ),
      'accounts', (
        select jsonb_agg(jsonb_build_object(
          'id', accounts.id,
          'accountId', accounts.account_id,
          'providerId', accounts.provider_id,
          'userId', accounts.user_id,
          'accessToken', accounts.access_token,
          'refreshToken', accounts.refresh_token,
          'idToken', accounts.id_token,
          'accessTokenExpiresAt', to_char(
            accounts.access_token_expires_at at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          ),
          'refreshTokenExpiresAt', to_char(
            accounts.refresh_token_expires_at at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          ),
          'scope', accounts.scope,
          'password', accounts.password,
          'createdAt', to_char(
            accounts.created_at at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          ),
          'updatedAt', to_char(
            accounts.updated_at at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          )
        ) order by accounts.id)
        from ${schema}.account accounts
      ),
      'sessions', (
        select jsonb_agg(jsonb_build_object(
          'id', sessions.id,
          'token', sessions.token,
          'userId', sessions.user_id,
          'expiresAt', to_char(
            sessions.expires_at at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          ),
          'createdAt', to_char(
            sessions.created_at at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          ),
          'updatedAt', to_char(
            sessions.updated_at at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          ),
          'impersonatedBy', sessions.impersonated_by,
          'ipAddress', sessions.ip_address,
          'userAgent', sessions.user_agent
        ) order by sessions.id)
        from ${schema}.session sessions
      ),
      'verifications', (
        select jsonb_agg(jsonb_build_object(
          'id', verifications.id,
          'identifier', verifications.identifier,
          'value', verifications.value,
          'expiresAt', to_char(
            verifications.expires_at at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          ),
          'createdAt', to_char(
            verifications.created_at at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          ),
          'updatedAt', to_char(
            verifications.updated_at at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          )
        ) order by verifications.id)
        from ${schema}.verification verifications
      ),
      'products', (
        select jsonb_agg(jsonb_build_object(
          'id', products.id,
          'name', products.name,
          'description', products.description,
          'price', products.price,
          'category', products.category,
          'img', products.img
        ) order by products.id)
        from ${schema}.products_items products
      ),
      'variants', (
        select jsonb_agg(jsonb_build_object(
          'id', variants.id,
          'productId', variants.product_id,
          'stripeId', variants.stripe_id,
          'color', variants.color,
          'sizes', variants.sizes,
          'images', variants.images
        ) order by variants.id)
        from ${schema}.products_variants variants
      ),
      'cart', (
        select jsonb_agg(jsonb_build_object(
          'id', cart.id,
          'userId', cart.user_id,
          'variantId', cart.variant_id,
          'quantity', cart.quantity,
          'size', cart.size,
          'stripeId', cart.stripe_id
        ) order by cart.id)
        from ${schema}.cart_items cart
      ),
      'wishlist', (
        select jsonb_agg(jsonb_build_object(
          'id', wishlist.id,
          'userId', wishlist.user_id,
          'productId', wishlist.product_id
        ) order by wishlist.id)
        from ${schema}.wishlist wishlist
      ),
      'orders', (
        select jsonb_agg(jsonb_build_object(
          'id', orders.id,
          'userId', orders.user_id,
          'orderNumber', orders.order_number,
          'status', ${orderStatus}
        ) order by orders.id)
        from ${schema}.order_items orders
      ),
      'customers', (
        select jsonb_agg(jsonb_build_object(
          'id', customers.id,
          'orderId', customers.order_id,
          'name', customers.name,
          'email', customers.email,
          'phone', customers.phone,
          'address', customers.address,
          'stripeOrderId', customers.stripe_order_id,
          'totalPrice', customers.total_price,
          'currency', ${customerCurrency}
        ) order by customers.id)
        from ${schema}.customer_info customers
      ),
      'lines', (
        select jsonb_agg(jsonb_build_object(
          'id', lines.id,
          'orderId', lines.order_id,
          'variantId', lines.variant_id,
          'quantity', lines.quantity,
          'size', lines.size,
          'unitAmount', ${lineFacts.unitAmount},
          'currency', ${lineFacts.currency},
          'productName', ${lineFacts.productName},
          'variantColor', ${lineFacts.variantColor},
          'imageUrl', ${lineFacts.imageUrl}
        ) order by lines.id)
        from ${schema}.order_products lines
        ${lineFacts.joins}
      ),
      'priceEvidence', ${
        evidenceExists
          ? `(
        select jsonb_agg(jsonb_build_object(
          'orderProductId', price.order_product_id,
          'stripeSessionId', price.stripe_session_id,
          'stripeLineItemId', price.stripe_line_item_id,
          'unitAmount', price.unit_amount,
          'currency', lower(price.currency)
        ) order by price.order_product_id)
        from ${evidence} price
      )`
          : "null::jsonb"
      }
    )::text
  `,
    ),
  );
}

function resetPreparedPriceEvidence(containerName, user = "postgres") {
  runSql(
    containerName,
    "drop table if exists public.cutover_order_price_evidence;",
    TEST_DATABASE,
    user,
  );
  runSql(
    containerName,
    readFileSync("scripts/database/prepare-cutover-price-evidence.sql", "utf8"),
    TEST_DATABASE,
    user,
  );
  runSql(
    containerName,
    `
      insert into public.cutover_order_price_evidence (
        order_product_id,
        stripe_session_id,
        stripe_line_item_id,
        unit_amount,
        currency
      )
      select
        line.id,
        customer.stripe_order_id,
        'li_legacy_rehearsal',
        4250,
        'eur'
      from public.order_products line
      join public.customer_info customer
        on customer.order_id = line.order_id;
    `,
    TEST_DATABASE,
    user,
  );
}

function runDatabaseVerifier(port, runtimePassword) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(npm, ["run", "db:verify"], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    env: {
      ...process.env,
      VERIFY_DATABASE_URL:
        `postgresql://app_runtime:${runtimePassword}` +
        `@127.0.0.1:${port}/${TEST_DATABASE}`,
    },
  });
}

function runBetterAuthCredentialSmoke({
  databasePassword,
  databaseUser,
  layout,
  port,
}) {
  const result = spawnSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "tsx",
      "--input-type=module",
      "--eval",
      betterAuthSmokeHarness,
    ],
    {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      timeout: 20_000,
      env: {
        PATH: process.env.PATH,
        NODE_ENV: "test",
        DATABASE_URL:
          `postgresql://${databaseUser}:${databasePassword}` +
          `@127.0.0.1:${port}/${TEST_DATABASE}`,
        AUTH_DATABASE_LAYOUT: layout,
        APP_URL: AUTH_ORIGIN,
        BETTER_AUTH_URL: AUTH_ORIGIN,
        NEXT_PUBLIC_APP_URL: AUTH_ORIGIN,
        BETTER_AUTH_SECRET: ["cutover-test", "x".repeat(32)].join("-"),
        GOOGLE_AUTH_ENABLED: "false",
        NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: "false",
        CUTOVER_SMOKE_INPUT: LEGACY_AUTH_INPUT,
      },
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  assert.equal(
    result.status,
    0,
    result.stderr ||
      result.stdout ||
      `Better Auth smoke ended with ${result.signal}`,
  );
  return JSON.parse(result.stdout);
}

function prepareLegacyDatabase(containerName, user = "postgres") {
  const legacyFixture = readFileSync(
    "scripts/database/fixtures/legacy-cutover.sql",
    "utf8",
  );
  assert.match(legacyFixture, /__CUTOVER_CREDENTIAL_HASH__/);
  runSql(
    containerName,
    legacyFixture.replaceAll(
      "__CUTOVER_CREDENTIAL_HASH__",
      LEGACY_CREDENTIAL_HASH,
    ),
    TEST_DATABASE,
    user,
  );
  runSql(
    containerName,
    readFileSync("scripts/database/prepare-auth-adapter.sql", "utf8"),
    TEST_DATABASE,
    user,
  );
  runSql(
    containerName,
    `
      update public.session
      set impersonated_by = 'legacy-operator'
      where id = 'legacy-session';
    `,
    TEST_DATABASE,
    user,
  );
  resetPreparedPriceEvidence(containerName, user);
}

test(
  "existing-database cutover normalizes legacy indexes and foreign keys without changing historical orders",
  { skip: dockerUnavailable },
  async () => {
    assert.equal(
      dockerProbe.status,
      0,
      "The PostgreSQL cutover integration requires Docker in CI",
    );
    const migratorPassword = randomBytes(24).toString("hex");
    const runtimePassword = randomBytes(24).toString("hex");
    await withPostgresContainer(
      "cutover-integration",
      async ({ containerName, port, superPassword }) => {
        runSql(
          containerName,
          readFileSync("scripts/database/bootstrap-roles.sql", "utf8"),
        );
        runSql(
          containerName,
          `
          alter role app_migrator password '${migratorPassword}';
          alter role app_runtime password '${runtimePassword}';
        `,
        );
        prepareLegacyDatabase(containerName);

        assert.deepEqual(
          runBetterAuthCredentialSmoke({
            databasePassword: superPassword,
            databaseUser: "postgres",
            layout: "public",
            port,
          }),
          {
            userId: "legacy-rehearsal-user",
            email: "legacy-rehearsal@example.test",
            sessionUserId: "legacy-rehearsal-user",
            signedOut: true,
          },
        );

        assert.equal(
          query(
            containerName,
            `
          select pg_typeof(array_agg(attribute.attname))::text
          from pg_index metadata
          join pg_class index_row on index_row.oid = metadata.indexrelid
          join lateral unnest(metadata.indkey) with ordinality
            as key_row(attnum, ordinality) on true
          join pg_attribute attribute
            on attribute.attrelid = metadata.indrelid
            and attribute.attnum = key_row.attnum
          where index_row.relname = 'idx_order_items_user_id'
        `,
          ),
          "name[]",
        );
        assert.equal(
          query(
            containerName,
            `
          select constraint_row.confdeltype::text ||
            constraint_row.confupdtype::text
          from pg_constraint constraint_row
          where constraint_row.conrelid = 'public.order_items'::regclass
            and constraint_row.conname = 'order_items_user_id_fkey'
        `,
          ),
          "cc",
        );

        assert.deepEqual(
          legacyFingerprint(containerName, "public"),
          EXPECTED_LEGACY_STATE,
        );

        runSql(
          containerName,
          readFileSync("scripts/database/cutover-existing.sql", "utf8"),
        );

        runDatabaseVerifier(port, runtimePassword);
        assert.deepEqual(
          runBetterAuthCredentialSmoke({
            databasePassword: runtimePassword,
            databaseUser: "app_runtime",
            layout: "app_private",
            port,
          }),
          {
            userId: "legacy-rehearsal-user",
            email: "legacy-rehearsal@example.test",
            sessionUserId: "legacy-rehearsal-user",
            signedOut: true,
          },
        );
        assert.equal(
          query(
            containerName,
            `
          select constraint_row.confdeltype::text ||
            constraint_row.confupdtype::text
          from pg_constraint constraint_row
          where constraint_row.conrelid = 'app_private.order_items'::regclass
            and constraint_row.conname = 'order_items_user_id_fkey'
        `,
          ),
          "rc",
        );
        assert.deepEqual(
          legacyFingerprint(containerName, "app_private"),
          EXPECTED_LEGACY_STATE,
        );
        const canonicalArtifactOids = query(
          containerName,
          `
        select concat_ws('|',
          (
            select constraint_row.oid
            from pg_constraint constraint_row
            where constraint_row.conrelid =
              'app_private.order_items'::regclass
              and constraint_row.conname = 'order_items_user_id_fkey'
          ),
          'app_private.idx_order_items_user_id'::regclass::oid
        )
      `,
        );

        runSql(
          containerName,
          readFileSync("scripts/database/cutover-existing.sql", "utf8"),
        );
        runDatabaseVerifier(port, runtimePassword);
        assert.deepEqual(
          legacyFingerprint(containerName, "app_private"),
          EXPECTED_LEGACY_STATE,
        );
        assert.equal(
          query(
            containerName,
            `
          select concat_ws('|',
            (
              select constraint_row.oid
              from pg_constraint constraint_row
              where constraint_row.conrelid =
                'app_private.order_items'::regclass
                and constraint_row.conname = 'order_items_user_id_fkey'
            ),
            'app_private.idx_order_items_user_id'::regclass::oid
          )
        `,
          ),
          canonicalArtifactOids,
        );
      },
    );
  },
);

test(
  "missing, incomplete, and conflicting price evidence abort without changing legacy data",
  { skip: dockerUnavailable },
  async (context) => {
    assert.equal(
      dockerProbe.status,
      0,
      "The PostgreSQL cutover integration requires Docker in CI",
    );
    await withPostgresContainer(
      "cutover-evidence-failures",
      async ({ containerName, port, superPassword }) => {
        runSql(
          containerName,
          readFileSync("scripts/database/bootstrap-roles.sql", "utf8"),
        );
        prepareLegacyDatabase(containerName);

        const cases = [
          {
            name: "missing evidence table",
            mutate: "drop table public.cutover_order_price_evidence;",
            expected:
              /Prepared or fully archived Stripe price evidence is required/,
          },
          {
            name: "incomplete evidence coverage",
            mutate: "delete from public.cutover_order_price_evidence;",
            expected:
              /Prepared historical Stripe price evidence is incomplete or inconsistent/,
          },
          {
            name: "conflicting checkout session",
            mutate:
              "update public.cutover_order_price_evidence " +
              "set stripe_session_id = 'cs_test_conflict';",
            expected:
              /Prepared historical Stripe price evidence is incomplete or inconsistent/,
          },
        ];

        for (const testCase of cases) {
          await context.test(testCase.name, () => {
            resetPreparedPriceEvidence(containerName);
            runSql(containerName, testCase.mutate);
            const before = legacyFingerprint(containerName, "public");

            assert.throws(
              () => {
                runSql(
                  containerName,
                  readFileSync("scripts/database/cutover-existing.sql", "utf8"),
                );
              },
              (error) => {
                assert.match(
                  String(error.stderr ?? error.message),
                  testCase.expected,
                );
                return true;
              },
            );

            assert.deepEqual(
              legacyFingerprint(containerName, "public"),
              before,
              "failed cutover must preserve every legacy fingerprint field",
            );
            assert.equal(
              query(
                containerName,
                `
                  select count(*)
                  from pg_tables
                  where schemaname = 'app_private'
                    and tablename = any(array[
                      'user', 'session', 'account', 'verification',
                      'products_items', 'products_variants', 'cart_items',
                      'wishlist', 'order_items', 'customer_info', 'order_products'
                    ])
                `,
              ),
              "0",
            );
          });
        }

        assert.deepEqual(
          runBetterAuthCredentialSmoke({
            databasePassword: superPassword,
            databaseUser: "postgres",
            layout: "public",
            port,
          }),
          {
            userId: "legacy-rehearsal-user",
            email: "legacy-rehearsal@example.test",
            sessionUserId: "legacy-rehearsal-user",
            signedOut: true,
          },
          "every failed cutover must leave legacy credential auth usable",
        );
      },
    );
  },
);

test(
  "a non-superuser legacy owner without SET capability fails cutover atomically",
  { skip: dockerUnavailable },
  async (context) => {
    assert.equal(
      dockerProbe.status,
      0,
      "The PostgreSQL cutover integration requires Docker in CI",
    );
    await withPostgresContainer(
      "cutover-actor-limit",
      async ({ containerName }) => {
        const serverVersion = Number(
          query(
            containerName,
            `
          select current_setting('server_version_num')
        `,
          ),
        );
        if (serverVersion < 160000) {
          context.skip("PostgreSQL 15 has no separate membership SET option");
          return;
        }

        const actor = "legacy_cutover_actor";
        runSql(
          containerName,
          `
          create role ${actor}
            login noinherit createrole nocreatedb noreplication;
          create role app_owner nologin noinherit;
          create role app_migrator
            login noinherit nocreatedb nocreaterole noreplication;
          create role app_runtime
            login noinherit nocreatedb nocreaterole noreplication;
          alter database ${TEST_DATABASE} owner to ${actor};
          grant app_owner, app_migrator to ${actor}
            with admin true, inherit false, set false;
        `,
        );
        runSql(
          containerName,
          readFileSync("scripts/database/bootstrap-roles.sql", "utf8"),
          TEST_DATABASE,
          actor,
        );
        prepareLegacyDatabase(containerName, actor);

        assert.equal(
          query(
            containerName,
            `
            select concat_ws('|',
              membership.admin_option,
              membership.inherit_option,
              membership.set_option,
              grantor.rolsuper
            )
            from pg_auth_members membership
            join pg_roles granted_role
              on granted_role.oid = membership.roleid
            join pg_roles member_role
              on member_role.oid = membership.member
            join pg_roles grantor on grantor.oid = membership.grantor
            where granted_role.rolname = 'app_owner'
              and member_role.rolname = '${actor}'
          `,
          ),
          "t|f|f|t",
        );
        assert.deepEqual(
          legacyFingerprint(containerName, "public"),
          EXPECTED_LEGACY_STATE,
        );

        assert.throws(
          () => {
            runSql(
              containerName,
              "begin; set local role app_owner; rollback;",
              TEST_DATABASE,
              actor,
            );
          },
          (error) => {
            assert.match(
              String(error.stderr ?? error.message),
              SET_ROLE_DENIED_PATTERN,
            );
            return true;
          },
        );

        assert.throws(
          () => {
            runSql(
              containerName,
              readFileSync("scripts/database/cutover-existing.sql", "utf8"),
              TEST_DATABASE,
              actor,
            );
          },
          (error) => {
            assert.match(
              String(error.stderr ?? error.message),
              SET_ROLE_DENIED_PATTERN,
            );
            return true;
          },
        );
        assert.equal(
          query(
            containerName,
            `
            select count(*)
            from pg_tables
            where schemaname = 'public'
              and tablename = any(array[
                'user', 'session', 'account', 'verification',
                'products_items', 'products_variants', 'cart_items',
                'wishlist', 'order_items', 'customer_info', 'order_products'
              ])
          `,
          ),
          "11",
        );
        assert.equal(
          query(
            containerName,
            `
            select count(*)
            from pg_tables
            where schemaname = 'app_private'
              and tablename = any(array[
                'user', 'session', 'account', 'verification',
                'products_items', 'products_variants', 'cart_items',
                'wishlist', 'order_items', 'customer_info', 'order_products'
              ])
          `,
          ),
          "0",
        );
        assert.deepEqual(
          legacyFingerprint(containerName, "public"),
          EXPECTED_LEGACY_STATE,
        );
      },
    );
  },
);
