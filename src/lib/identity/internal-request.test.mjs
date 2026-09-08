import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  InternalIdentityError,
  internalIdentityErrorHttpStatus,
  requireCronCredentialFromHeaders,
} from "./internal-request.ts";

test("cron credentials fail closed when the server is not configured", () => {
  assert.throws(
    () => requireCronCredentialFromHeaders(new Headers(), {}),
    (error) => {
      assert.ok(error instanceof InternalIdentityError);
      assert.equal(error.code, "not_configured");
      assert.equal(internalIdentityErrorHttpStatus(error), 503);
      return true;
    },
  );
});

test("cron credentials reject a missing or incorrect bearer token", () => {
  for (const authorization of [null, "Bearer wrong"] ) {
    const headers = new Headers();
    if (authorization) headers.set("authorization", authorization);

    assert.throws(
      () => requireCronCredentialFromHeaders(headers, { CRON_SECRET: "expected" }),
      (error) => {
        assert.ok(error instanceof InternalIdentityError);
        assert.equal(error.code, "authentication_required");
        assert.equal(internalIdentityErrorHttpStatus(error), 401);
        return true;
      },
    );
  }
});

test("cron credentials accept only the configured bearer token", () => {
  const headers = new Headers({ authorization: "Bearer expected" });

  assert.doesNotThrow(() =>
    requireCronCredentialFromHeaders(headers, { CRON_SECRET: "expected" }),
  );
});

test("cron routes share one HTTP credential adapter", async () => {
  const routes = await Promise.all([
    readFile("src/app/api/cron/catalog-sync/route.ts", "utf8"),
    readFile("src/app/api/cron/fulfillment/route.ts", "utf8"),
  ]);
  for (const route of routes) {
    assert.match(route, /internalCredentialFailure/);
    assert.doesNotMatch(route, /InternalIdentityError|requireCronCredentialFromHeaders/);
  }
});
