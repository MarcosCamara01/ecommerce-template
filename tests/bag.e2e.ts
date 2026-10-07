import { expect } from "e2e";

import {
  asShopper,
  emptyBag,
  expectBag,
  formatEuros,
  line,
  type Piece,
  pieceOnScreen,
  putInBag,
  SECTIONS,
  settled,
  test,
} from "./support/store";

// What the shopper sees is judged by the agent. What the store recorded (which
// pieces, how many, at what price) is read from its API: money is not left to
// anybody's judgment.

test.describe("bag", { ...asShopper("bag"), tags: ["bag", "agent", "shopper", "writes"] }, () => {
  let piece: Piece;

  // Every test starts with an empty bag, on the listing, with a piece in two sizes.
  test.beforeEach(async ({ app, api, agent, browser }) => {
    await emptyBag(api);
    await app.open("/new-in");
    piece = await pieceOnScreen({ browser, agent }, (candidate) => candidate.sizes.length > 1, "piece in two sizes");
  });

  test("a shopper adds a piece from its page", { tags: ["smoke"] }, async ({ app, api, agent, browser }) => {
    const size = piece.sizes[1];
    await app.open(piece.href);
    await settled(browser);

    await agent.act("add this piece to the bag in size {size}", { params: { size } });
    await agent.assert("the store shows that the bag now holds 1 item");
    await expectBag(api, [line(piece, size)]);
  });

  test("a card adds a size without leaving the listing", async ({ api, agent, browser }) => {
    const [size] = piece.sizes;

    await agent.act("add {name} to the bag in size {size} without leaving this page", {
      params: { name: piece.name, size },
    });
    await expect(browser).toHaveURL("/new-in");
    await agent.assert("the store shows that the bag now holds 1 item");
    await expectBag(api, [line(piece, size)]);
  });

  test("an outfit goes in the bag and the bag adds up", async ({ app, api, agent, browser }) => {
    const outfit = [];
    for (const { path } of SECTIONS.slice(0, 2)) {
      await app.open(path);
      outfit.push(await pieceOnScreen({ browser, agent }));
    }
    const [top, bottom] = outfit;

    await app.open("/new-in");
    await agent.act("add {name} to the bag in size {size}", { params: { name: top.name, size: top.sizes[0] } });
    await agent.assert("the store shows that the bag now holds 1 item");
    await agent.act("add {name} to the bag in size {size}", {
      params: { name: bottom.name, size: bottom.sizes[0] },
    });
    await agent.assert("the store shows that the bag now holds 2 items");
    await expectBag(api, [line(top, top.sizes[0]), line(bottom, bottom.sizes[0])]);

    await app.open("/cart");
    await settled(browser);
    await agent.assert(
      `the bag lists exactly two pieces, ${top.name} and ${bottom.name}, and its total is ${formatEuros(top.price + bottom.price)}`,
    );
  });

  test("the bag page changes quantities, removes lines and keeps the total right", async ({ app, api, agent, browser }) => {
    const [small, large] = piece.sizes;
    await putInBag(api, piece, small);
    await putInBag(api, piece, large);
    await app.open("/cart");
    await settled(browser);

    await agent.act("I want two of the size {size} one: add one more of it", { params: { size: small } });
    await agent.assert(
      `the bag lists ${piece.name} in size ${small} with a quantity of 2 and in size ${large} with a quantity of 1, and its total is ${formatEuros(piece.price * 3)}`,
    );
    await expectBag(api, [line(piece, small, 2), line(piece, large)]);

    await agent.act("remove the size {size} line from the bag", { params: { size: large } });
    await agent.assert(
      `the bag lists one line only, ${piece.name} in size ${small} with a quantity of 2, and its total is ${formatEuros(piece.price * 2)}`,
    );
    await expectBag(api, [line(piece, small, 2)]);

    await agent.act("on second thought one is enough: take one away from the size {size} line", {
      params: { size: small },
    });
    await agent.assert(
      `the bag lists one line only, ${piece.name} in size ${small} with a quantity of 1, and its total is ${formatEuros(piece.price)}`,
    );
    await expectBag(api, [line(piece, small)]);
  });

  test("a bag that is emptied says so and points back to the store", async ({ app, api, agent, browser }) => {
    await putInBag(api, piece, piece.sizes[0]);
    await app.open("/cart");
    await settled(browser);

    await agent.act("remove everything from the bag");
    await agent.assert("the page says the bag is empty and offers a way back into the store");
    await expectBag(api, []);

    await agent.act("go and see what is new in the store, with the link the empty bag offers");
    await expect(browser).toHaveURL("/new-in");
  });

  test("the bag is still there on the next visit", async ({ app, api, agent, browser }) => {
    await putInBag(api, piece, piece.sizes[0]);
    await putInBag(api, piece, piece.sizes[1]);

    // A new visit: the browser comes back with nothing but its cookies.
    await app.restart();
    await settled(browser);
    await agent.assert("the store shows that the bag holds 2 items");
    await expectBag(api, [line(piece, piece.sizes[0]), line(piece, piece.sizes[1])]);
  });

  test("checkout sends the lines of the bag and follows where Stripe says", async ({ app, api, agent, browser }) => {
    await putInBag(api, piece, piece.sizes[0]);
    await putInBag(api, piece, piece.sizes[1]);
    await app.open("/cart");
    await settled(browser);

    // Stripe is stood in for: the store has to post the bag and go where it is told.
    const after = "/help/delivery?after=checkout";
    let sent: { cartItemIds?: unknown[] } = {};
    await browser.route("**/api/stripe/payment", async (route) => {
      sent = JSON.parse(route.request.postData ?? "{}");
      await route.fulfill({ json: { url: new URL(after, app.baseUrl).href } });
    });

    await agent.act("check out the bag");
    await expect(browser).toHaveURL(after);
    expect(sent.cartItemIds).toHaveLength(2);
  });
});
