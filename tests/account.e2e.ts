import { expect, unique } from "e2e";

import { asShopper, HAS_CUSTOMER, NEEDS_CUSTOMER, settled, shopperInStore, test } from "./support/store";

test.describe("account", { ...asShopper("account"), tags: ["account", "agent", "shopper", "writes"] }, () => {
  test("a shopper finds their orders and their wishlist", { tags: ["smoke"] }, async ({ app, agent, browser }) => {
    await app.open("/");

    await agent.act("open the page that lists my orders");
    await expect(browser).toHaveURL("/orders");
    await settled(browser);
    // A shopper who signed up a moment ago has bought nothing yet.
    await agent.assert("the page says there are no orders yet and offers a way to start shopping");

    await agent.act("from the account links of this page, go to my wishlist");
    await expect(browser).toHaveURL("/wishlist");
  });

  test("a shopper changes their name", async ({ app, api, agent, browser }) => {
    const name = `Renamed ${Date.now().toString(36)}`;
    await app.open("/");

    await agent.act("change the name on my profile to {name} and save it", { params: { name: unique(name) } });
    await expect(browser).toHaveURL("/");

    // The store knows the shopper by the new name.
    await expect.poll(async () => (await shopperInStore(api))?.name).toBe(name);
  });
});

test.describe(
  "orders of a returning customer",
  HAS_CUSTOMER
    ? { session: "customer", tags: ["account", "agent", "customer"] }
    : { skip: NEEDS_CUSTOMER, tags: ["account", "agent", "customer"] },
  () => {
    test("past orders are listed, newest first, each with its status", async ({ app, agent, browser }) => {
      await app.open("/orders");
      await settled(browser);

      await agent.assert(
        "the page lists past orders from the most recent to the oldest, and each one shows its number, when it was placed and where it stands",
      );
    });

    test("an order opens with what was bought and a way to buy it again", async ({ app, agent, browser }) => {
      await app.open("/orders");
      await settled(browser);

      await agent.act("open my most recent order");
      await expect(browser).toHaveURL(/\/orders\/\d+$/);
      await settled(browser);
      await agent.assert(
        "the page shows where the order stands and lists the pieces bought, each with its price and a way to buy it again",
      );

      await agent.act("go back to the list of all my orders");
      await expect(browser).toHaveURL("/orders");
    });

    test("an order that is not theirs is not found", async ({ app, agent, browser }) => {
      await app.open("/orders/999999999");
      await settled(browser);

      await agent.assert("the page says the order was not found and offers a way back to the orders; it shows no pieces of any order");
    });
  },
);
