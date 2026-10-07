import { expect } from "e2e";
import { z } from "zod";

import { formatEuros, named, type Piece, pieceOnScreen, piecesOnScreen, settled, test } from "./support/store";

test.describe("product page", { tags: ["product", "agent"] }, () => {
  let piece: Piece;

  // Whatever the store lists first, in at least two sizes.
  test.beforeEach(async ({ app, agent, browser }) => {
    await app.open("/new-in");
    piece = await pieceOnScreen({ browser, agent }, (candidate) => candidate.sizes.length > 1, "piece in two sizes");
    await app.open(piece.href);
    await settled(browser);
  });

  test("a shopper is shown what they need to decide on a piece", { tags: ["smoke"] }, async ({ agent }) => {
    const read = await agent.extract(
      "the name of the piece, its price in euros as a number, and every size that can be chosen right now",
      { schema: z.object({ name: z.string(), price: z.number(), sizes: z.array(z.string()) }) },
    );
    expect(read.name.toLowerCase()).toContain(piece.name.toLowerCase());
    expect(read.price).toBeCloseTo(piece.price, 2);
    expect(read.sizes).toEqual(expect.arrayContaining(piece.sizes));

    await agent.assert(
      "the page lets a shopper pick a color and a size, and has one clear button to add the piece to the bag that states its price; a size that is out of stock, if there is one, cannot be chosen",
    );
    // What only eyes can tell: the photo is a real photo, laid out properly.
    await agent.assert(
      "the product photo in view is loaded and shows the piece of clothing clearly; it is not broken, blank or stretched, and the name, price and button beside it are not cut off",
      { vision: true },
    );
  });

  test("choosing a size changes what the button adds", async ({ agent }) => {
    const [, second] = piece.sizes;

    await agent.act("choose size {size}", { params: { size: second } });
    await agent.assert(
      `size ${second} is the size chosen, and the button to add the piece says it will add size ${second} for ${formatEuros(piece.price)}`,
    );
  });

  test("choosing a color shows that color and keeps it in the address", async ({ app, agent, browser }) => {
    // The page of the first piece that comes in two colors.
    await app.open("/new-in");
    let colors: string[] = [];
    for (const candidate of (await piecesOnScreen({ browser, agent })).slice(0, 3)) {
      await app.open(candidate.href);
      await settled(browser);
      ({ colors } = await agent.extract(
        "the colors this piece comes in, each by its name alone, starting with the one that is chosen now",
        { schema: z.object({ colors: z.array(z.string()) }) },
      ));
      if (colors.length > 1) break;
    }
    test.skip(colors.length < 2, "none of the first three pieces comes in two colors");
    const color = colors[1];

    await agent.act("choose the color {color}", { params: { color } });
    await expect(browser).toHaveURL(new RegExp(`[?&]variant=${encodeURIComponent(color).replace(/%20/g, "(%20|\\+)")}`));
    await agent.assert(`${color} is the color chosen, and the photos are the ones of the piece in ${color}`);
  });

  test("a photo opens large, and the next one follows", async ({ agent, browser }) => {
    const { photos } = await agent.extract("how many photos of the piece the gallery of this page has", {
      schema: z.object({ photos: z.number().int() }),
    });
    test.skip(photos < 3, "the piece has fewer than three photos");

    await agent.act("enlarge the second photo of the piece");
    await agent.assert(`a large view of the photos is open, and its counter says photo 2 of ${photos}`);

    await agent.act("move on to the next photo");
    await agent.assert(`the counter of the large view of the photos says photo 3 of ${photos}`);

    await agent.act("close the photos and go back to the page of the piece");
    await settled(browser);
    await agent.assert("no large view of the photos is open: the page of the piece is showing, with its sizes and its button to add it");
  });

  test("the details of a piece open on request", async ({ agent }) => {
    await agent.act("open the Composition details");
    await agent.assert("the Composition details are open and their text can be read");
  });

  test("the pieces that go with it lead to their own pages", async ({ agent, browser }) => {
    const [related] = await piecesOnScreen({ browser, agent });
    expect(related.href).not.toBe(piece.href);

    await agent.act("open {name}, one of the pieces suggested to wear with this one", {
      params: { name: related.name },
    });
    await expect(browser).toHaveURL(new RegExp(`${related.href.split("?")[0]}(\\?|$)`));
    await settled(browser);
    await agent.assert(`this is the page of ${related.name}: the piece can be chosen in a size and added to the bag`);
  });
});

// Exact by nature: keys, pixels on screen, and notices that come and go. These
// tests name the labels of today's interface, because the labels are the point.
test.describe("product page, to the letter", { tags: ["product"] }, () => {
  let piece: Piece;

  test.beforeEach(async ({ app, browser }) => {
    await app.open("/new-in");
    piece = await pieceOnScreen({ browser });
    await app.open(piece.href);
    await settled(browser);
  });

  test("the photo viewer can be driven from the keyboard", async ({ screen, browser }) => {
    const photos = screen.getByRole("region", { name: /, photos$/ });
    await expect(photos.getByRole("button", { name: /^Enlarge photo 1 of \d+$/ })).toBeVisible();
    const total = await photos.getByRole("button", { name: /^Enlarge photo \d+ of \d+$/ }).count();
    test.skip(total < 3, "the piece has fewer than three photos");

    const second = photos.getByRole("button", `Enlarge photo 2 of ${total}`);
    await second.tap();
    const viewer = screen.getByRole("dialog", { name: /, photos$/ });
    const strip = viewer.getByRole("group", "Photos");
    await expect(strip.getByRole("button", "Photo 2")).toHaveAttribute("aria-current", "true");

    await browser.keyboard.press("ArrowRight");
    await expect(strip.getByRole("button", "Photo 3")).toHaveAttribute("aria-current", "true");
    await browser.keyboard.press("ArrowLeft");
    await expect(strip.getByRole("button", "Photo 2")).toHaveAttribute("aria-current", "true");

    // Escape closes it and hands focus back to the photo it came from.
    await browser.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await expect(second).toBeFocused();
  });

  test("the button to add stays in view while the photos scroll by", async ({ screen, browser }) => {
    // A laptop screen is short: the photos are taller than the window.
    await browser.setViewport({ width: 1440, height: 720 });
    const add = screen.getByRole("button", { name: /^Add \S+ to bag — / });
    const inView = async () => {
      const box = await add.boundingBox();
      const height = Number(await browser.evaluate(() => window.innerHeight));
      return box !== null && box.y >= 0 && box.y + box.height <= height;
    };
    await expect.poll(inView).toBe(true);

    const scrolled = await browser.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
      return window.scrollY;
    });
    expect(Number(scrolled)).toBeGreaterThan(0);
    await expect.poll(inView).toBe(true);
  });

  test("a visitor is asked to sign in before adding to the bag", async ({ screen }) => {
    await screen.getByRole("button", { name: /^Add \S+ to bag — / }).tap();

    await expect(screen.getByText("Sign in to add to your bag")).toBeVisible();
    await expect(screen.getByRole("banner").getByRole("button", "Bag")).toBeVisible();
  });

  test("a visitor is asked to sign in before saving a piece", async ({ screen }) => {
    const save = screen.getByRole("main").getByRole("button", { name: named(`Save ${piece.name} to wishlist`) });
    await save.tap();

    await expect(screen.getByText("Sign in to save to your wishlist")).toBeVisible();
    await expect(save).toHaveAttribute("aria-pressed", "false");
  });
});
