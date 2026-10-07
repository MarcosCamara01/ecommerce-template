import { expect } from "e2e";

import { HAS_ADMIN, NEEDS_ADMIN, pieceOnScreen, settled, test } from "./support/store";

// Looking only: saving a product uploads its photos to storage, which a
// test run must not do. The agent is told so with every goal.
const admin = {
  tags: ["admin", "agent"],
  agentContext:
    "This is the admin area of the store. Nothing may be saved here: never press Create Product, Update Product or any button that submits the form.",
};

test.describe(
  "admin",
  HAS_ADMIN ? { session: "admin", ...admin } : { skip: NEEDS_ADMIN, ...admin },
  () => {
    test("the new product form asks for what a piece needs", async ({ app, agent, browser }) => {
      await app.open("/admin/products/create");
      await settled(browser);

      await agent.assert(
        "this is a form to create a product: it asks for a name, a description, a price, a category and a main image, and it has exactly one variant, with a color, sizes and images",
      );

      // Variants can be added and taken away before anything is saved.
      await agent.act("add another variant to the product");
      await agent.assert("the form now has exactly two variants");

      await agent.act("remove the second variant again");
      await agent.assert("the form has exactly one variant");
    });

    test("a piece offers its editor, filled with what it has", async ({ app, agent, browser }) => {
      await app.open("/new-in");
      const piece = await pieceOnScreen({ browser, agent });
      await app.open(piece.href);
      await settled(browser);

      await agent.act("open the editor of this piece");
      await expect(browser).toHaveURL(/\/admin\/products\/\d+\/edit$/);
      await settled(browser);
      await agent.assert(
        `this is a form to edit a product, and its name field already holds "${piece.name}", whatever the letter case`,
      );
    });
  },
);
