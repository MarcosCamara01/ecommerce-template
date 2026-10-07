import { expect } from "e2e";
import { z } from "zod";

import { piecesOnScreen, SECTIONS, settled, test } from "./support/store";

// The agent is told what a visitor wants and is asked whether it happened.
// No goal says how the page is built and no check names a label of it, so a
// redesign that keeps the store working keeps these tests green. Where the
// answer is data (a price list, a count), the code compares it.

test.describe("storefront", { tags: ["storefront", "agent"] }, () => {
  test("the home page presents the store", { tags: ["smoke"] }, async ({ app, agent, browser }) => {
    await app.open("/");
    await settled(browser);

    const seen = await agent.extract(
      "the names of the links in the main navigation, and the name and the price in euros of the piece featured at the top of the page",
      {
        schema: z.object({
          navigation: z.array(z.string()),
          featured: z.object({ name: z.string(), price: z.number() }),
        }),
      },
    );
    // The names of the sections are the store's own words: they are held to.
    expect(seen.navigation).toEqual(
      expect.arrayContaining(["New arrivals", ...SECTIONS.map((section) => section.label)]),
    );
    expect(seen.featured.name).toBeTruthy();
    expect(seen.featured.price).toBeGreaterThan(0);

    await agent.assert(
      "this is the front page of a clothing store: it shows pieces with their photos and prices, it features one piece that can be added to the bag from here, and nothing looks broken or empty",
      { vision: true },
    );
  });

  test("the navigation reaches every section", { tags: ["smoke"] }, async ({ app, agent, browser }) => {
    await app.open("/");

    for (const { label, path } of SECTIONS) {
      await agent.act("go to the {section} section", { params: { section: label } });
      await expect(browser).toHaveURL(path);
      await settled(browser);
      // Which link is the current one is a matter of how it is painted.
      await agent.assert(
        `this page is the ${label} section of the store: it lists pieces, and the navigation at the top highlights ${label} as the section the visitor is in`,
        { vision: true },
      );
    }

    await agent.act("go back to the home page of the store");
    await expect(browser).toHaveURL("/");
  });

  test("a section tells a visitor what it sells", async ({ app, agent, browser }) => {
    await app.open(SECTIONS[0].path);
    const pieces = await piecesOnScreen({ browser, agent });
    await settled(browser);

    const read = await agent.extract(
      "how many pieces this section lists, the name and the price in euros of the first one, and the number written beside this section's name in the row of section tabs",
      {
        schema: z.object({
          pieces: z.number().int(),
          first: z.object({ name: z.string(), price: z.number() }),
          tab: z.number().int(),
        }),
      },
    );
    expect(read.pieces).toBe(pieces.length);
    expect(read.first.name.toLowerCase()).toContain(pieces[0].name.toLowerCase());
    expect(read.first.price).toBeCloseTo(pieces[0].price, 2);
    expect(read.tab).toBe(pieces.length);
  });

  test("the cheapest and the dearest piece can be put first", async ({ app, agent, browser }) => {
    await app.open("/new-in");
    const prices = async () => (await piecesOnScreen({ browser, agent })).map((piece) => piece.price);
    const cheapestFirst = [...(await prices())].sort((a, b) => a - b);

    await agent.act("sort the pieces so the cheapest comes first");
    await agent.assert("the listing is sorted by price from the cheapest piece to the most expensive, and the sort control says so");
    expect(await prices()).toEqual(cheapestFirst);

    await agent.act("now sort them so the most expensive comes first");
    await agent.assert("the listing is sorted by price from the most expensive piece to the cheapest, and the sort control says so");
    expect(await prices()).toEqual([...cheapestFirst].reverse());
  });

  test("a visitor sees only the pieces in their size", async ({ app, agent, browser }) => {
    await app.open("/new-in");
    const all = await piecesOnScreen({ browser, agent });

    // The size the fewest cards offer, so the filter has work to do.
    const offered = new Map<string, number>();
    for (const size of all.flatMap((piece) => piece.sizes)) {
      offered.set(size, (offered.get(size) ?? 0) + 1);
    }
    const [size] = Array.from(offered).sort((a, b) => a[1] - b[1])[0];

    await agent.act("show only the pieces that come in size {size}", { params: { size } });
    await agent.assert(`the listing is filtered by size, and the size it is filtered by is ${size}`);
    const kept = (await piecesOnScreen({ browser, agent })).map((piece) => piece.name);
    expect(kept.length).toBeGreaterThan(0);
    expect(kept.length).toBeLessThanOrEqual(all.length);
    for (const piece of all.filter((candidate) => candidate.sizes.includes(size))) {
      expect(kept, `${piece.name} comes in ${size}`).toContain(piece.name);
    }

    await agent.act("show the pieces of every size again");
    await agent.assert("the listing is not filtered by any size");
    expect(await piecesOnScreen({ browser, agent })).toHaveLength(all.length);
  });

  test("the grid shows three or four pieces a row", async ({ app, agent, browser }) => {
    await app.open("/new-in");
    await settled(browser);

    await agent.act("show three pieces per row instead of four");
    await settled(browser);
    await agent.assert("the grid of pieces shows exactly three pieces in each row", { vision: true });

    await agent.act("go back to four pieces per row");
    await settled(browser);
    await agent.assert("the grid of pieces shows exactly four pieces in each row", { vision: true });
  });

  test("the store can be read in the dark, and remembers it", async ({ app, agent, browser }) => {
    await app.open("/");
    await settled(browser);

    await agent.act("switch the store to its dark theme");
    await agent.assert("the store is shown in a dark theme: a dark background with light text", { vision: true });

    await browser.reload();
    await settled(browser);
    await agent.assert("the store is shown in a dark theme: a dark background with light text", { vision: true });

    await agent.act("switch the store back to its light theme");
    await agent.assert("the store is shown in a light theme: a light background with dark text", { vision: true });
  });

  test("help answers sizes and returns", async ({ app, agent, browser }) => {
    await app.open("/");

    await agent.act("find the size guide of the store");
    await expect(browser).toHaveURL("/help/size-guide");

    await agent.act("in the size chart, look up size L");
    // The template ships the chart with the merchant's blanks still in it,
    // so the choice is judged, not the measurements.
    await agent.assert("L is the size chosen in the size chart");

    await agent.act("open the help page about returns");
    await expect(browser).toHaveURL("/help/returns");
    // The template ships the policy with the merchant's blanks still in it,
    // so the steps are judged, not the terms.
    await agent.assert(
      "the page lays out a return as steps a shopper can follow: starting it, sending the piece back, and getting the refund; placeholder text in brackets is acceptable",
    );
  });

  test("an address that leads nowhere says so and offers a way back", async ({ app, agent, browser }) => {
    // A page that was never there, and a section the store does not have.
    for (const path of ["/this-page-does-not-exist", "/hats"]) {
      await app.open(path);
      await settled(browser);
      await agent.assert("the page tells the visitor that this address was not found and offers a way back into the store");
    }

    await agent.act("go back to the home page with the link the page offers");
    await expect(browser).toHaveURL("/");
  });
});

// Plain facts no model needs to be asked about.
test.describe("storefront, by the numbers", { tags: ["storefront"] }, () => {
  test("new arrivals holds the whole catalog", async ({ app, browser }) => {
    let total = 0;
    for (const { path } of SECTIONS) {
      await app.open(path);
      const pieces = await piecesOnScreen({ browser });
      expect(pieces.length, `${path} lists pieces`).toBeGreaterThan(0);
      for (const piece of pieces) {
        expect(piece.href, `${piece.name} links to its page`).toMatch(new RegExp(`^${path}/\\d+`));
      }
      total += pieces.length;
    }

    await app.open("/new-in");
    expect(await piecesOnScreen({ browser })).toHaveLength(total);
  });

  test("photos reach the browser as AVIF and can be kept for a month", async ({ app, browser }) => {
    await app.open(SECTIONS[0].path);
    await settled(browser);
    const photo = String(
      await browser.evaluate(() => document.querySelector<HTMLImageElement>("main img")?.currentSrc ?? ""),
    );
    expect(photo, "the photo goes through the image optimizer").toContain("/_next/image?");

    const response = await fetch(photo, { headers: { accept: "image/avif,image/webp,*/*" } });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/avif");
    const maxAge = Number(response.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1]);
    expect(maxAge).toBeGreaterThanOrEqual(31 * 24 * 60 * 60);
  });
});
