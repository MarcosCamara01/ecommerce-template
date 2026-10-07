import { expect } from "e2e";

import {
  asShopper,
  emptyBag,
  expectBag,
  line,
  pieceOnScreen,
  piecesOnScreen,
  SECTIONS,
  settled,
  test,
} from "./support/store";

// A narrow window, not a phone: the layout is what is under test here.
const PHONE = { width: 390, height: 844 };

test.describe("on a phone", { tags: ["phone", "agent"] }, () => {
  test.beforeEach(async ({ browser }) => {
    await browser.setViewport(PHONE);
  });

  test("the sections are reached through a menu", { tags: ["smoke"] }, async ({ app, agent, browser }) => {
    const { label, path } = SECTIONS[1];
    await app.open("/");
    await settled(browser);
    await agent.assert(
      "the bar at the top of the page has a button that opens a navigation menu, and that bar does not itself list T-shirts, Pants and Sweatshirts as links",
    );

    await agent.act("open the menu and go to the {section} section", { params: { section: label } });
    await expect(browser).toHaveURL(path);
    await settled(browser);
    await agent.assert(`the menu is closed and the page is the ${label} section, listing its pieces`);
  });

  test("the cheapest piece can be put first from the filter sheet", async ({ app, agent, browser }) => {
    await app.open("/new-in");
    const cheapestFirst = (await piecesOnScreen({ browser, agent })).map((piece) => piece.price).sort((a, b) => a - b);

    await agent.act("sort the pieces so the cheapest comes first, then close the filter");
    await settled(browser);
    await agent.assert("nothing covers the listing, and it shows the pieces two to a row", { vision: true });
    expect((await piecesOnScreen({ browser, agent })).map((piece) => piece.price)).toEqual(cheapestFirst);
  });

  test("the bag is one tap away", async ({ app, agent, browser }) => {
    await app.open("/");

    await agent.act("open the bag");
    await expect(browser).toHaveURL("/cart");
  });
});

test.describe("on a phone, as a shopper", { ...asShopper("phone"), tags: ["phone", "agent", "shopper", "writes"] }, () => {
  test("a piece is added and found in the bag", async ({ app, api, agent, browser }) => {
    await browser.setViewport(PHONE);
    await emptyBag(api);
    await app.open("/new-in");
    const piece = await pieceOnScreen({ browser, agent });
    const [size] = piece.sizes;
    await app.open(piece.href);
    await settled(browser);

    await agent.act("add this piece to the bag in size {size}", { params: { size } });
    await agent.assert("the store confirms that the piece was added, or shows that the bag now holds 1 item");
    await expectBag(api, [line(piece, size)]);

    await agent.act("open the bag");
    await expect(browser).toHaveURL("/cart");
    await settled(browser);
    await agent.assert(`the bag lists one line, ${piece.name} in size ${size}`);
  });
});
