import assert from "node:assert/strict";
import test from "node:test";

import { verifyHostedExposure } from "./verify-hosted-exposure.mjs";

const projectRef = "abcdefghijklmnopqrst";
const environment = {
  SUPABASE_ACCESS_TOKEN: "management-test-token",
  SUPABASE_PROJECT_REF: projectRef,
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
};
const expectedBucket = {
  id: "product-images",
  name: "product-images",
  public: true,
  file_size_limit: 5 * 1024 * 1024,
  allowed_mime_types: ["image/webp", "image/jpeg", "image/png"],
};
const publicReadPolicy = {
  policyname: "Public read access",
  permissive: "PERMISSIVE",
  roles: "public",
  cmd: "SELECT",
  qual: "(bucket_id = 'product-images'::text)",
  with_check: null,
};
const endpoints = {
  postgrest: `https://api.supabase.com/v1/projects/${projectRef}/postgrest`,
  auth: `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
  buckets: `https://${projectRef}.supabase.co/storage/v1/bucket`,
  policies: `https://api.supabase.com/v1/projects/${projectRef}/database/query/read-only`,
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function createFetch(responses = {}) {
  const respond = {
    postgrest: () => jsonResponse({ db_schema: "" }),
    auth: () => jsonResponse({ disable_signup: true }),
    buckets: () => jsonResponse([expectedBucket]),
    policies: () => jsonResponse([publicReadPolicy]),
    ...responses,
  };
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    const endpoint = Object.keys(endpoints).find(
      (name) => endpoints[name] === String(url),
    );
    assert.ok(endpoint, `unexpected request to ${url}`);
    return respond[endpoint](options);
  };
  return { calls, fetchImpl };
}

async function verifyWith({ fetchImpl, timeoutMs = 100 } = {}) {
  return verifyHostedExposure({
    environment,
    fetchImpl,
    readConfiguration: async () => "schemas = []\n",
    timeoutMs,
    log: () => {},
  });
}

test("hosted exposure reads Data API, Auth, Storage bucket, and Storage policies without mutating", async () => {
  const { calls, fetchImpl } = createFetch({
    buckets: () =>
      jsonResponse([{ id: "unrelated", public: false }, expectedBucket]),
  });

  await verifyWith({ fetchImpl });

  assert.deepEqual(
    calls.map((call) => [call.options.method, call.url]),
    [
      ["GET", endpoints.postgrest],
      ["GET", endpoints.auth],
      ["GET", endpoints.buckets],
      ["POST", endpoints.policies],
    ],
  );
  for (const call of [calls[0], calls[1], calls[3]]) {
    assert.equal(
      new Headers(call.options.headers).get("authorization"),
      `Bearer ${environment.SUPABASE_ACCESS_TOKEN}`,
    );
  }
  const storageHeaders = new Headers(calls[2].options.headers);
  assert.equal(
    storageHeaders.get("authorization"),
    `Bearer ${environment.SUPABASE_SERVICE_ROLE_KEY}`,
  );
  assert.equal(
    storageHeaders.get("apikey"),
    environment.SUPABASE_SERVICE_ROLE_KEY,
  );
  const policyQuery = JSON.parse(calls[3].options.body).query;
  assert.match(policyQuery, /pg_catalog\.pg_policies/);
  assert.match(policyQuery, /schemaname = 'storage' and tablename = 'objects'/);
  for (const call of calls) {
    assert.ok(call.options.signal instanceof AbortSignal);
  }
});

test("hosted exposure fails closed before Auth and Storage when PostgREST drifts", async () => {
  const { calls, fetchImpl } = createFetch({
    postgrest: () => jsonResponse({ db_schema: "public,graphql_public" }),
  });

  await assert.rejects(
    verifyWith({ fetchImpl }),
    /Hosted Data API drift: expected \[\], received \[graphql_public,public\]/,
  );
  assert.equal(calls.length, 1);
});

test("hosted exposure rejects malformed PostgREST settings before Storage", async () => {
  const { calls, fetchImpl } = createFetch({
    postgrest: () => jsonResponse({ max_rows: 1_000 }),
  });

  await assert.rejects(
    verifyWith({ fetchImpl }),
    /Supabase Management API returned invalid PostgREST settings/,
  );
  assert.equal(calls.length, 1);
});

test("hosted exposure fails closed before Storage when GoTrue sign-up is open", async () => {
  const { calls, fetchImpl } = createFetch({
    auth: () =>
      jsonResponse({ disable_signup: false, mailer_autoconfirm: true }),
  });

  await assert.rejects(
    verifyWith({ fetchImpl }),
    /Hosted Auth drift: GoTrue sign-up must be disabled \(\[auth\] enable_signup = false\)/,
  );
  assert.deepEqual(
    calls.map((call) => call.url),
    [endpoints.postgrest, endpoints.auth],
  );
});

test("hosted exposure rejects malformed Auth settings before Storage", async () => {
  const { calls, fetchImpl } = createFetch({
    auth: () => jsonResponse({ site_url: "https://example.test" }),
  });

  await assert.rejects(
    verifyWith({ fetchImpl }),
    /Supabase Management API returned invalid Auth settings/,
  );
  assert.equal(calls.length, 2);
});

test("hosted exposure requires the product-images bucket", async () => {
  const { fetchImpl } = createFetch({ buckets: () => jsonResponse([]) });

  await assert.rejects(
    verifyWith({ fetchImpl }),
    /Hosted Storage drift: required bucket product-images is missing/,
  );
});

test("hosted exposure rejects every incorrect product-images bucket setting", async (t) => {
  const cases = [
    {
      name: "private bucket",
      bucket: { ...expectedBucket, public: false },
      expected: /product-images must be public/,
    },
    {
      name: "wrong byte limit",
      bucket: { ...expectedBucket, file_size_limit: 5_000_000 },
      expected: /product-images file_size_limit must be 5242880 bytes/,
    },
    {
      name: "extra MIME type",
      bucket: {
        ...expectedBucket,
        allowed_mime_types: [
          ...expectedBucket.allowed_mime_types,
          "image/gif",
        ],
      },
      expected:
        /product-images allowed_mime_types must be exactly \[image\/jpeg,image\/png,image\/webp\]/,
    },
    {
      name: "missing MIME type",
      bucket: {
        ...expectedBucket,
        allowed_mime_types: ["image/jpeg", "image/png"],
      },
      expected:
        /product-images allowed_mime_types must be exactly \[image\/jpeg,image\/png,image\/webp\]/,
    },
    {
      name: "duplicate MIME type",
      bucket: {
        ...expectedBucket,
        allowed_mime_types: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/webp",
        ],
      },
      expected:
        /product-images allowed_mime_types must be exactly \[image\/jpeg,image\/png,image\/webp\]/,
    },
  ];

  for (const testCase of cases) {
    await t.test(testCase.name, async () => {
      const { fetchImpl } = createFetch({
        buckets: () => jsonResponse([testCase.bucket]),
      });
      await assert.rejects(verifyWith({ fetchImpl }), testCase.expected);
    });
  }
});

test("hosted exposure rejects malformed Storage success responses", async () => {
  const { fetchImpl } = createFetch({
    buckets: () => jsonResponse({ buckets: [expectedBucket] }),
  });

  await assert.rejects(
    verifyWith({ fetchImpl }),
    /Supabase Storage API returned an invalid bucket list/,
  );
});

test("hosted exposure accepts only public read of product-images on storage.objects", async (t) => {
  const cases = [
    {
      name: "authenticated upload policy still present",
      rows: [
        {
          policyname: "Allow authenticated uploads",
          permissive: "PERMISSIVE",
          roles: "public",
          cmd: "INSERT",
          qual: null,
          with_check: "(auth.role() = 'authenticated'::text)",
        },
        publicReadPolicy,
      ],
      received:
        `"Allow authenticated uploads" PERMISSIVE INSERT TO public WITH CHECK (auth.role() = 'authenticated'::text); ` +
        `"Public read access" PERMISSIVE SELECT TO public USING (bucket_id = 'product-images'::text)`,
    },
    {
      name: "authenticated delete policy added",
      rows: [
        publicReadPolicy,
        {
          policyname: "Allow authenticated deletes",
          permissive: "PERMISSIVE",
          roles: "authenticated",
          cmd: "DELETE",
          qual: "(bucket_id = 'product-images'::text)",
          with_check: null,
        },
      ],
      received:
        `"Allow authenticated deletes" PERMISSIVE DELETE TO authenticated USING (bucket_id = 'product-images'::text); ` +
        `"Public read access" PERMISSIVE SELECT TO public USING (bucket_id = 'product-images'::text)`,
    },
    {
      name: "public read widened to every bucket",
      rows: [{ ...publicReadPolicy, qual: "true" }],
      received: `"Public read access" PERMISSIVE SELECT TO public USING true`,
    },
    {
      name: "public read policy missing",
      rows: [],
      received: "",
    },
  ];

  for (const testCase of cases) {
    await t.test(testCase.name, async () => {
      const { fetchImpl } = createFetch({
        policies: () => jsonResponse(testCase.rows),
      });
      await assert.rejects(verifyWith({ fetchImpl }), (error) => {
        assert.equal(
          error.message,
          `Hosted Storage drift: storage.objects policies must be exactly ` +
            `["Public read access" PERMISSIVE SELECT TO public USING (bucket_id = 'product-images'::text)], ` +
            `received [${testCase.received}]`,
        );
        return true;
      });
    });
  }
});

test("hosted exposure rejects malformed Storage policy rows", async (t) => {
  for (const testCase of [
    { name: "not a row list", body: { result: [publicReadPolicy] } },
    {
      name: "roles returned as an array",
      body: [{ ...publicReadPolicy, roles: ["public"] }],
    },
    { name: "missing policy name", body: [{ ...publicReadPolicy, policyname: undefined }] },
  ]) {
    await t.test(testCase.name, async () => {
      const { fetchImpl } = createFetch({
        policies: () => jsonResponse(testCase.body),
      });
      await assert.rejects(
        verifyWith({ fetchImpl }),
        /Supabase Management API returned invalid Storage policies/,
      );
    });
  }
});

test("hosted exposure times out Storage reads without exposing credentials", async () => {
  const { fetchImpl } = createFetch({
    buckets: (options) =>
      new Promise((resolve, reject) => {
        options.signal.addEventListener(
          "abort",
          () => reject(options.signal.reason),
          { once: true },
        );
      }),
  });

  await assert.rejects(
    verifyWith({ fetchImpl, timeoutMs: 5 }),
    (error) => {
      assert.equal(error.message, "Supabase Storage API request timed out");
      assert.doesNotMatch(
        error.message,
        new RegExp(environment.SUPABASE_SERVICE_ROLE_KEY),
      );
      return true;
    },
  );
});

test("hosted exposure sanitizes network and HTTP failures", async (t) => {
  await t.test("Storage network error", async () => {
    const { fetchImpl } = createFetch({
      buckets: () => {
        throw new Error(
          `upstream leaked ${environment.SUPABASE_SERVICE_ROLE_KEY} and private body`,
        );
      },
    });

    await assert.rejects(verifyWith({ fetchImpl }), (error) => {
      assert.equal(error.message, "Supabase Storage API request failed");
      assert.doesNotMatch(error.message, /service-role-test-key|private body/);
      return true;
    });
  });

  await t.test("Storage HTTP error", async () => {
    const { fetchImpl } = createFetch({
      buckets: () =>
        new Response(
          JSON.stringify({ secret: environment.SUPABASE_SERVICE_ROLE_KEY }),
          { status: 503 },
        ),
    });

    await assert.rejects(verifyWith({ fetchImpl }), (error) => {
      assert.equal(error.message, "Supabase Storage API returned 503");
      assert.doesNotMatch(error.message, /service-role-test-key|secret/);
      return true;
    });
  });

  await t.test("read-only query HTTP error", async () => {
    const { fetchImpl } = createFetch({
      policies: () =>
        new Response(
          JSON.stringify({ message: `token ${environment.SUPABASE_ACCESS_TOKEN}` }),
          { status: 403 },
        ),
    });

    await assert.rejects(verifyWith({ fetchImpl }), (error) => {
      assert.equal(error.message, "Supabase Management query API returned 403");
      assert.doesNotMatch(error.message, /management-test-token/);
      return true;
    });
  });
});

test("hosted exposure requires a service role and a safe hosted project ref", async (t) => {
  await t.test("missing service role", async () => {
    await assert.rejects(
      verifyHostedExposure({
        environment: {
          SUPABASE_ACCESS_TOKEN: environment.SUPABASE_ACCESS_TOKEN,
          SUPABASE_PROJECT_REF: projectRef,
        },
        fetchImpl: async () => {
          assert.fail("verification must not call an API without all credentials");
        },
      }),
      /SUPABASE_SERVICE_ROLE_KEY is required/,
    );
  });

  await t.test("unsafe project ref", async () => {
    await assert.rejects(
      verifyHostedExposure({
        environment: {
          ...environment,
          SUPABASE_PROJECT_REF: "attacker.example",
        },
        fetchImpl: async () => {
          assert.fail("verification must not send credentials to an unsafe host");
        },
      }),
      /SUPABASE_PROJECT_REF must be a 20-character lowercase project reference/,
    );
  });
});
