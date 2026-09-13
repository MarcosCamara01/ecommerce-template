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

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function createFetch({
  managementResponse = jsonResponse({ db_schema: "" }),
  storageResponse = jsonResponse([expectedBucket]),
} = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    return calls.length === 1 ? managementResponse : storageResponse;
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

test("hosted exposure verifies the Data API before the exact Storage bucket contract", async () => {
  const { calls, fetchImpl } = createFetch({
    storageResponse: jsonResponse([
      { id: "unrelated", public: false },
      expectedBucket,
    ]),
  });

  await verifyWith({ fetchImpl });

  assert.equal(calls.length, 2);
  assert.equal(
    calls[0].url,
    `https://api.supabase.com/v1/projects/${projectRef}/postgrest`,
  );
  assert.equal(calls[0].options.method, "GET");
  assert.equal(
    new Headers(calls[0].options.headers).get("authorization"),
    `Bearer ${environment.SUPABASE_ACCESS_TOKEN}`,
  );
  assert.equal(
    calls[1].url,
    `https://${projectRef}.supabase.co/storage/v1/bucket`,
  );
  assert.equal(calls[1].options.method, "GET");
  const storageHeaders = new Headers(calls[1].options.headers);
  assert.equal(
    storageHeaders.get("authorization"),
    `Bearer ${environment.SUPABASE_SERVICE_ROLE_KEY}`,
  );
  assert.equal(
    storageHeaders.get("apikey"),
    environment.SUPABASE_SERVICE_ROLE_KEY,
  );
  assert.ok(calls[1].options.signal instanceof AbortSignal);
});

test("hosted exposure fails closed before Storage when PostgREST drifts", async () => {
  const { calls, fetchImpl } = createFetch({
    managementResponse: jsonResponse({ db_schema: "public" }),
  });

  await assert.rejects(
    verifyWith({ fetchImpl }),
    /Hosted Data API drift: expected \[\], received \[public\]/,
  );
  assert.equal(calls.length, 1);
});

test("hosted exposure rejects malformed PostgREST settings before Storage", async () => {
  const { calls, fetchImpl } = createFetch({
    managementResponse: jsonResponse({ max_rows: 1_000 }),
  });

  await assert.rejects(
    verifyWith({ fetchImpl }),
    /Supabase Management API returned invalid PostgREST settings/,
  );
  assert.equal(calls.length, 1);
});

test("hosted exposure requires the product-images bucket", async () => {
  const { fetchImpl } = createFetch({ storageResponse: jsonResponse([]) });

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
        storageResponse: jsonResponse([testCase.bucket]),
      });
      await assert.rejects(verifyWith({ fetchImpl }), testCase.expected);
    });
  }
});

test("hosted exposure rejects malformed Storage success responses", async () => {
  const { fetchImpl } = createFetch({
    storageResponse: jsonResponse({ buckets: [expectedBucket] }),
  });

  await assert.rejects(
    verifyWith({ fetchImpl }),
    /Supabase Storage API returned an invalid bucket list/,
  );
});

test("hosted exposure times out Storage reads without exposing credentials", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push(String(url));
    if (calls.length === 1) return jsonResponse({ db_schema: "" });
    return new Promise((resolve, reject) => {
      options.signal.addEventListener(
        "abort",
        () => reject(options.signal.reason),
        { once: true },
      );
    });
  };

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

test("hosted exposure sanitizes Storage network and HTTP failures", async (t) => {
  await t.test("network error", async () => {
    const { fetchImpl } = createFetch();
    let callCount = 0;
    const failingFetch = async (...args) => {
      callCount += 1;
      if (callCount === 1) return fetchImpl(...args);
      throw new Error(
        `upstream leaked ${environment.SUPABASE_SERVICE_ROLE_KEY} and private body`,
      );
    };

    await assert.rejects(verifyWith({ fetchImpl: failingFetch }), (error) => {
      assert.equal(error.message, "Supabase Storage API request failed");
      assert.doesNotMatch(error.message, /service-role-test-key|private body/);
      return true;
    });
  });

  await t.test("HTTP error", async () => {
    const { fetchImpl } = createFetch({
      storageResponse: new Response(
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
