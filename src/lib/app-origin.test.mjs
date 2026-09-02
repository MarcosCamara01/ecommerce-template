import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalRequestRedirect,
  getCanonicalAppOrigin,
} from "./app-origin.ts";

test("canonical origin accepts a matching server-only application URL", () => {
  assert.equal(
    getCanonicalAppOrigin({
      APP_URL: "https://shop.example.test/",
      BETTER_AUTH_URL: "https://shop.example.test",
      NEXT_PUBLIC_APP_URL: "https://shop.example.test/",
    }),
    "https://shop.example.test",
  );
});

test("preview origin prefers the concrete branch URL over production configuration", () => {
  assert.equal(
    getCanonicalAppOrigin({
      VERCEL_ENV: "preview",
      VERCEL_BRANCH_URL: "feature-auth.example.vercel.app",
      VERCEL_URL: "deployment.example.vercel.app",
      APP_URL: "https://shop.example.test",
      BETTER_AUTH_URL: "https://shop.example.test",
      NEXT_PUBLIC_APP_URL: "https://shop.example.test",
    }),
    "https://feature-auth.example.vercel.app",
  );
});

test("preview origin falls back to the concrete deployment URL", () => {
  assert.equal(
    getCanonicalAppOrigin({
      VERCEL_ENV: "preview",
      VERCEL_URL: "deployment.example.vercel.app",
      APP_URL: "https://shop.example.test",
      BETTER_AUTH_URL: "https://shop.example.test",
      NEXT_PUBLIC_APP_URL: "https://shop.example.test",
    }),
    "https://deployment.example.vercel.app",
  );
});

test("production ignores preview hosts and keeps its configured origin", () => {
  assert.equal(
    getCanonicalAppOrigin({
      VERCEL_ENV: "production",
      VERCEL_BRANCH_URL: "feature-auth.example.vercel.app",
      VERCEL_URL: "deployment.example.vercel.app",
      APP_URL: "https://shop.example.test",
      BETTER_AUTH_URL: "https://shop.example.test",
      NEXT_PUBLIC_APP_URL: "https://shop.example.test",
    }),
    "https://shop.example.test",
  );
});

test("canonical origin rejects divergent configured application origins", () => {
  assert.throws(
    () => getCanonicalAppOrigin({
      APP_URL: "https://shop.example.test",
      BETTER_AUTH_URL: "https://auth.example.test",
      NEXT_PUBLIC_APP_URL: "https://public.example.test",
    }),
    /configured application origins must match/i,
  );
});

test("canonical origin keeps compatible configured fallbacks", () => {
  assert.equal(
    getCanonicalAppOrigin({ BETTER_AUTH_URL: "http://localhost:3100" }),
    "http://localhost:3100",
  );
  assert.equal(
    getCanonicalAppOrigin({ NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3100" }),
    "http://127.0.0.1:3100",
  );
});

test("canonical origin rejects missing or non-origin values", () => {
  for (const environment of [
    {},
    { APP_URL: "ftp://shop.example.test" },
    { APP_URL: "https://user:pass@shop.example.test" },
    { APP_URL: "https://shop.example.test/store" },
    { APP_URL: "https://shop.example.test?tenant=one" },
    { APP_URL: "https://shop.example.test#checkout" },
  ]) {
    assert.throws(() => getCanonicalAppOrigin(environment), /application origin/i);
  }
});

test("preview origin fails closed for missing or invalid deployment hosts", () => {
  for (const environment of [
    {
      VERCEL_ENV: "preview",
      APP_URL: "https://shop.example.test",
      BETTER_AUTH_URL: "https://shop.example.test",
      NEXT_PUBLIC_APP_URL: "https://shop.example.test",
    },
    {
      VERCEL_ENV: "preview",
      VERCEL_BRANCH_URL: "feature.example.vercel.app/path",
    },
    {
      VERCEL_ENV: "preview",
      VERCEL_URL: "https://deployment.example.vercel.app",
    },
  ]) {
    assert.throws(() => getCanonicalAppOrigin(environment), /application origin/i);
  }
});

test("alternate hosts redirect to the canonical origin without losing the path", () => {
  assert.equal(
    canonicalRequestRedirect(
      new URL("http://127.0.0.1:3100/cart?from=checkout"),
      "127.0.0.1:3100",
      "http",
      { APP_URL: "http://localhost:3100" },
    )?.href,
    "http://localhost:3100/cart?from=checkout",
  );
  assert.equal(
    canonicalRequestRedirect(
      new URL("http://localhost:3000/cart"),
      "localhost:3100",
      "http",
      { APP_URL: "http://localhost:3100" },
    ),
    null,
  );
});

test("same-host HTTP requests redirect to the canonical HTTPS origin", () => {
  assert.equal(
    canonicalRequestRedirect(
      new URL("http://shop.example.test/checkout"),
      "shop.example.test",
      "http",
      { APP_URL: "https://shop.example.test" },
    )?.href,
    "https://shop.example.test/checkout",
  );
  assert.equal(
    canonicalRequestRedirect(
      new URL("http://internal:3000/checkout"),
      "shop.example.test",
      "https",
      { APP_URL: "https://shop.example.test" },
    ),
    null,
  );
});
