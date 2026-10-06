import { expect } from "e2e";
import { z } from "zod";

import { type Piece, pieceOnScreen, piecesOnScreen, settled, test } from "./support/store";

/** The most telling word of a name: the longest one. */
const keyword = (name: string) =>
  name.split(/[^A-Za-z]+/).sort((a, b) => b.length - a.length)[0].toLowerCase();

test.describe("search", { tags: ["search", "agent"] }, () => {
  let piece: Piece;

  // The last piece of the catalog: the one a visitor is least likely to scroll to.
  test.beforeEach(async ({ app, agent, browser }) => {
    await app.open("/new-in");
    const pieces = await piecesOnScreen({ browser, agent });
    piece = pieces[pieces.length - 1];
    await app.open("/");
  });

  test("a visitor finds a piece by searching for it", { tags: ["smoke"] }, async ({ agent, browser }) => {
    await agent.act("search the store for {name} and open the page of that piece", {
      params: { name: piece.name },
    });

    await expect(browser).toHaveURL(new RegExp(`${piece.href.split("?")[0]}(\\?|$)`));
    await settled(browser);
    await agent.assert(`this is the page of ${piece.name}: the piece can be chosen in a size and added to the bag`);
  });

  test("every match of a search has a page of results", async ({ agent, browser }) => {
    const word = keyword(piece.name);

    await agent.act("search the store for {word} and open the page that shows all the results", {
      params: { word },
    });

    await expect(browser).toHaveURL(`/search?q=${word}`);
    const results = await piecesOnScreen({ browser, agent });
    expect(results.map((result) => result.name)).toContain(piece.name);
    const read = await agent.extract(
      "the word or words this page says it searched for, and the number of results it says it found",
      { schema: z.object({ searched: z.string(), found: z.number().int() }) },
    );
    expect(read.searched.toLowerCase()).toContain(word);
    expect(read.found).toBe(results.length);
  });

  test("a search with no match says so and suggests another", async ({ agent }) => {
    await agent.act("search the store for {word}", { params: { word: "zzqqxx" } });
    await agent.assert("the search found no piece for this word, says so, and suggests other things to search for");

    await agent.act("try the first suggestion the search offers instead");
    await agent.assert("the search is listing at least one piece that matches");
  });
});

// The keyboard has to be exact, and so do the names it is checked against.
test.describe("search, from the keyboard", { tags: ["search"] }, () => {
  let piece: Piece;

  test.beforeEach(async ({ app, browser }) => {
    await app.open("/new-in");
    piece = await pieceOnScreen({ browser });
  });

  test("a slash opens search and Enter opens the result the arrows chose", async ({ screen, browser }) => {
    await browser.keyboard.press("/");
    const dialog = screen.getByRole("dialog", "Search");
    const field = dialog.getByRole("combobox", "Search products");
    await expect(field).toBeFocused();
    await field.fill(keyword(piece.name));

    const results = dialog.getByRole("listbox", "Products").getByRole("option");
    await expect(results.first()).toHaveAttribute("aria-selected", "true");

    // Down moves to the second result, or stays on the only one.
    const index = (await results.count()) > 1 ? 1 : 0;
    await field.press("ArrowDown");
    await expect(results.nth(index)).toHaveAttribute("aria-selected", "true");
    const chosen = await results.nth(index).getByRole("link").getAttribute("href");

    await field.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(browser).toHaveURL(new RegExp(`${String(chosen).split("?")[0]}(\\?|$)`));
  });

  test("Escape closes search and gives focus back", async ({ screen, browser }) => {
    const open = screen.getByRole("banner").getByRole("button", "Search");
    await open.tap();
    const dialog = screen.getByRole("dialog", "Search");
    await expect(dialog).toBeVisible();

    await browser.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
  });
});
