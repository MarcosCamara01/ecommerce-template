import { expect } from "e2e";

import { asShopper, test } from "./support/store";

const json = { "content-type": "application/json" };

test.describe("API, for a visitor", { tags: ["api"] }, () => {
  test("the bag and the wishlist are not readable or writable", async ({ api }) => {
    for (const path of ["/api/user/cart", "/api/user/wishlist"]) {
      for (const init of [{ method: "GET" }, { method: "POST", headers: json, body: "{}" }, { method: "DELETE" }]) {
        const response = await api(path, init);
        expect(response.status, `${init.method} ${path}`).toBe(401);
        expect(await response.json()).toEqual({ error: "authentication_required" });
      }
    }
  });

  test("a checkout cannot be started or looked up", async ({ api }) => {
    const started = await api("/api/stripe/payment", { method: "POST", headers: json, body: JSON.stringify({ cartItemIds: [1] }) });
    expect(started.status).toBe(401);

    const lookedUp = await api("/api/stripe/checkout_sessions?session_id=cs_test_none");
    expect(lookedUp.status).toBe(401);
  });

  test("the catalog cannot be changed", async ({ api }) => {
    const response = await api("/api/admin/products", { method: "POST", headers: json, body: "{}" });
    expect(response.status).toBe(401);
  });

  test("the scheduled jobs do nothing for a caller without their credential", async ({ api }) => {
    for (const path of ["/api/cron/fulfillment", "/api/cron/catalog-sync"]) {
      const response = await api(path);
      // 401 when the job is configured, 503 when the store has no cron secret.
      expect([401, 503], path).toContain(response.status);
      expect(await response.json()).toHaveProperty("error");
    }
  });

  test("the session endpoint has nothing to say and is never cached", async ({ api }) => {
    const response = await api("/api/auth/get-session");
    expect(response.status).toBe(200);
    expect(await response.json()).toBeNull();
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});

test.describe("API, for a shopper", asShopper("account"), () => {
  test("the bag and the wishlist answer privately", async ({ app, api }) => {
    await app.open("/");
    for (const path of ["/api/user/cart", "/api/user/cart?view=details", "/api/user/wishlist"]) {
      const response = await api(path);
      expect(response.status, path).toBe(200);
      // What one shopper owns must never be kept by a shared cache.
      expect(response.headers.get("cache-control"), path).toBe("private, no-store");
      expect(await response.json()).toMatchObject({ items: expect.any(Array) });
    }
  });

  test("the catalog still cannot be changed", async ({ app, api }) => {
    await app.open("/");
    const response = await api("/api/admin/products", { method: "POST", headers: json, body: "{}" });
    expect([401, 403]).toContain(response.status);
  });

  test("a bag line that is not theirs cannot be removed", async ({ app, api }) => {
    await app.open("/");
    const response = await api("/api/user/cart?itemId=999999999", { method: "DELETE" });
    expect(response.status).toBe(404);
  });
});
