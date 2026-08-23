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
