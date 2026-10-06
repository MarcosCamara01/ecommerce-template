import { expect } from "e2e";

import {
  asShopper,
  emptyBag,
  expectBag,
  forgetSaved,
  line,
  named,
  type Piece,
  pieceOnScreen,
  save,
  savedInStore,
  settled,
  test,
} from "./support/store";

test.describe("wishlist", { ...asShopper("wishlist"), tags: ["wishlist", "agent", "shopper", "writes"] }, () => {
  let piece: Piece;

  // Every test starts with nothing saved and nothing in the bag.
  test.beforeEach(async ({ app, api, agent, browser }) => {
    await forgetSaved(api);
    await emptyBag(api);
    await app.open("/new-in");
    piece = await pieceOnScreen({ browser, agent });
  });

  test("a shopper saves a piece for later", { tags: ["smoke"] }, async ({ app, api, agent, browser }) => {
    await agent.act("save {name} to the wishlist", { params: { name: piece.name } });
    await agent.assert(`${piece.name} is shown as saved to the wishlist`);
    expect(await savedInStore(api)).toEqual([piece.name.toLowerCase()]);

    await app.open("/wishlist");
    await settled(browser);
    await agent.assert(`the wishlist holds exactly one piece, ${piece.name}`);
  });

  test("the page of a piece saves it and forgets it", async ({ app, api, agent, browser }) => {
    await app.open(piece.href);
    await settled(browser);

    await agent.act("save this piece to the wishlist");
    await agent.assert("this piece is shown as saved to the wishlist");
    expect(await savedInStore(api)).toEqual([piece.name.toLowerCase()]);

    await agent.act("take this piece off the wishlist again");
    await agent.assert("this piece is shown as not saved to the wishlist");
    expect(await savedInStore(api)).toEqual([]);
  });

  test("a saved piece is bought from the wishlist", async ({ api, agent, browser }) => {
    const size = piece.sizes[piece.sizes.length - 1];
    await save(api, piece);

    await agent.act("open my wishlist and add {name} to the bag in size {size}", {
      params: { name: piece.name, size },
    });
    await expect(browser).toHaveURL("/wishlist");
    await agent.assert("the store shows that the bag now holds 1 item");
    await expectBag(api, [line(piece, size)]);
  });
});

// The way back from a removal is a notice that does not wait for anyone, so
// this one names the labels of today's interface.
test.describe("wishlist, to the letter", asShopper("wishlist"), () => {
  test("removing on the wishlist page can be undone", async ({ app, api, screen, browser }) => {
    await forgetSaved(api);
    await app.open("/new-in");
    const piece = await pieceOnScreen({ browser });
    await save(api, piece);
    await app.open("/wishlist");

    await screen.getByRole("button", { name: named(`Remove ${piece.name} from wishlist`) }).tap();
    await expect.poll(() => savedInStore(api)).toEqual([]);

    await screen.getByRole("button", "Undo").tap();
    await expect.poll(() => savedInStore(api)).toEqual([piece.name.toLowerCase()]);
  });
});
