import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  NOT_FOUND_INTERNAL_PATH,
  pathShould404,
} from "./unknown-path.ts";

describe("pathShould404", () => {
  it("keeps real storefront and app routes", () => {
    for (const pathname of [
      "/",
      "/login",
      "/register",
      "/search",
      "/help/delivery",
      "/help/returns",
      "/cart",
      "/wishlist",
      "/orders",
      "/orders/42",
      "/result",
      "/admin",
      "/admin/products/create",
      "/api/auth/callback",
      "/t-shirts",
      "/pants",
      "/sweatshirts",
      "/t-shirts/1",
      "/pants/99",
      "/sweatshirts/3",
    ]) {
      assert.equal(pathShould404(pathname), false, pathname);
    }
  });

  it("flags unknown paths swallowed by [category] as 404", () => {
    for (const pathname of [
      "/nonexistentpage",
      "/checkout",
      "/checkout/",
      "/account",
      "/foo/bar",
      "/login/foo",
      "/register/foo",
      "/search/foo",
      "/cart/foo",
      "/wishlist/foo",
      "/result/foo",
      "/orders/not-a-number",
      "/admin/unknown",
      "/api/email",
      "/api/unknown",
      "/t-shirts/0",
      "/pants/-1",
      "/sweatshirts/1e2",
      "/t-shirts/not-a-number",
      "/t-shirts/1/extra",
      "/robots.txt",
      "/__/not-found/fallback",
    ]) {
      assert.equal(pathShould404(pathname), true, pathname);
    }
  });

  it("does not intercept the internal rewrite target", () => {
    assert.equal(pathShould404(NOT_FOUND_INTERNAL_PATH), false);
  });

  it("uses a 3-segment rewrite target so dynamic store routes cannot match it", () => {
    const segments = NOT_FOUND_INTERNAL_PATH.split("/").filter(Boolean);
    assert.equal(segments.length, 3);
  });
});
