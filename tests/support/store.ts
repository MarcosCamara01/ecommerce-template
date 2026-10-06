import { test as base } from "@e2e-dev/web";
import type { Browser, Cookie } from "@e2e-dev/web";
import { expect } from "e2e";
import type { Agent, App } from "e2e";
import { z } from "zod";

/**
 * Tests that create accounts or fill a bag change the database behind the
 * store, so they only run when asked to: against a disposable database,
 * never the one real shoppers use.
 */
export const WRITES = process.env.E2E_ALLOW_WRITES === "1";
export const NEEDS_WRITES =
  "changes data: set E2E_ALLOW_WRITES=1 against a disposable database";

/** A shopper with order history, signed in by its own setup when given. */
export const HAS_CUSTOMER = Boolean(process.env.E2E_USER_CUSTOMER_PASSWORD);
export const NEEDS_CUSTOMER =
  "set E2E_USER_CUSTOMER_USERNAME and E2E_USER_CUSTOMER_PASSWORD to a shopper with orders";

/** An account that may manage the catalog. */
export const HAS_ADMIN = Boolean(process.env.E2E_USER_ADMIN_PASSWORD);
export const NEEDS_ADMIN =
  "set E2E_USER_ADMIN_USERNAME and E2E_USER_ADMIN_PASSWORD to an admin";

/**
 * Every run signs up its own shoppers, one per part of the suite, so files
 * that run side by side never meet in the same bag or wishlist.
 */
export const SHOPPERS = ["bag", "wishlist", "account", "phone"] as const;
type Shopper = (typeof SHOPPERS)[number];

/** The options of a group that runs as one of this run's new shoppers. */
export const asShopper = (session: Shopper) =>
  WRITES
    ? { session, tags: ["shopper", "writes"] }
    : { skip: NEEDS_WRITES, tags: ["shopper", "writes"] };

export const SECTIONS = [
  { label: "T-shirts", path: "/t-shirts" },
  { label: "Pants", path: "/pants" },
  { label: "Sweatshirts", path: "/sweatshirts" },
] as const;

/** A name as a pattern: headings are set in capitals, cards in sentence case. */
export const named = (name: string, { whole = true } = {}) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(whole ? `^${escaped}$` : escaped, "i");
};

export const formatEuros = (amount: number) => `€${amount.toFixed(2)}`;

export type Piece = {
  /** The name as the cards write it: "Washed zip-up hoodie". */
  name: string;
  href: string;
  price: number;
  /** The sizes in stock, in the order the card lists them. */
  sizes: string[];
};

/** What a test can look at the page with: the browser, and the agent when it has one. */
type Page = { browser: Browser; agent?: Agent };

/**
 * Whether the page has stopped arriving: nothing announces that it is
 * loading, and every photo inside the window that has started to load has
 * finished. (A card keeps a second photo for the pointer; the browser does
 * not fetch it until it is revealed, and it is not waited for.) Runs in the
 * page. A judgment looks once and does not wait, so the page has to be ready.
 */
const pageSettled = () => {
  const shown = (element: Element) => (element as HTMLElement).checkVisibility();
  const loading = Array.from(
    document.querySelectorAll('[aria-busy="true"], [aria-label^="Loading"], [aria-label^="Checking"]'),
  ).some(shown);
  const photos = Array.from(document.querySelectorAll<HTMLImageElement>("main img")).filter((photo) => {
    const box = photo.getBoundingClientRect();
    return shown(photo) && box.bottom > 0 && box.top < window.innerHeight;
  });
  const quiet =
    document.readyState === "complete" &&
    !loading &&
    photos.every((photo) => (photo.complete ? photo.naturalWidth > 0 : photo.currentSrc === ""));

  // Quiet has to last: a page is still for an instant between arriving and
  // starting to fetch what it shows, and that instant must not count.
  const clock = window as unknown as { quietSince?: number };
  if (!quiet) {
    clock.quietSince = undefined;
    return false;
  }
  clock.quietSince = clock.quietSince ?? performance.now();
  return performance.now() - clock.quietSince >= 700;
};

/** Waits until the open page has finished arriving. */
export const settled = (browser: Browser) =>
  expect.poll(() => browser.evaluate(pageSettled), { timeout: 15_000 }).toBe(true);

/** The cards of the open listing as the page builds them today. Runs in the page. */
const cardsInPage = () =>
  Array.from(document.querySelectorAll<HTMLElement>("main article"))
    // A page left by a link stays in the document, hidden, for the way back.
    .filter((card) => card.checkVisibility())
    .map((card) => ({
      name: card.querySelector("[aria-label^='Quick add ']")?.getAttribute("aria-label")?.slice("Quick add ".length) ?? "",
      href: card.querySelector("a[href]")?.getAttribute("href") ?? "",
      price: Number(card.innerText.match(/€\s?(\d+(?:\.\d{2})?)/)?.[1] ?? Number.NaN),
      sizes: Array.from(card.querySelectorAll("[aria-label$=', to bag']"))
        .map((button) => button.getAttribute("aria-label")?.match(/, size (\w+), to bag$/)?.[1] ?? "")
        .filter(Boolean),
    }));

const listed = z.object({
  pieces: z.array(z.object({ name: z.string(), price: z.number(), sizes: z.array(z.string()), link: z.string() })),
});

/**
 * The pieces of the listing on screen. The suite never assumes a catalog: it
 * works with whatever the store sells.
 *
 * The cards are read straight from the page, which costs nothing. That
 * reading knows how a card is built today; the day it finds no card it can
 * read, the agent reads the listing instead, so a redesign of the cards
 * slows the suite down but does not stop it.
 */
export async function piecesOnScreen({ browser, agent }: Page): Promise<Piece[]> {
  let pieces: Piece[] = [];
  const readable = (cards: Piece[]) =>
    cards.length > 0 && cards.every((card) => card.name && card.href && card.price > 0);

  if (process.env.E2E_READ_WITH_AGENT !== "1") {
    // A card is on screen a moment before its quick add is: give it that moment.
    await expect
      .poll(async () => {
        pieces = (await browser.evaluate(cardsInPage)) as Piece[];
        return readable(pieces);
      })
      .toBe(true)
      .catch(() => undefined);
    if (readable(pieces) || !agent) return pieces;
  }
  if (!agent) throw new Error("E2E_READ_WITH_AGENT needs a test that has the agent");

  await settled(browser);
  const read = await agent.extract(
    "every piece listed in the main part of this page, in the order shown: its name as its card writes it, its price in euros as a number, the sizes its card offers to add to the bag, and the address its link leads to",
    { schema: listed },
  );
  return read.pieces.map(({ name, price, sizes, link }) => ({
    name,
    price,
    sizes,
    // The agent is shown long addresses cut short: the path is what opens the page.
    href: link.replace(/^https?:\/\/[^/]+/, "").split("?")[0].replace(/…$/, ""),
  }));
}

/** The first piece on the open listing that fits, or a failure that says why. */
export async function pieceOnScreen(
  page: Page,
  fits: (piece: Piece) => boolean = () => true,
  what = "piece in stock",
): Promise<Piece> {
  const piece = (await piecesOnScreen(page)).find(
    (candidate) => candidate.name && candidate.sizes.length > 0 && fits(candidate),
  );
  if (!piece) throw new Error(`The listing shows no ${what}; the suite needs a stocked catalog.`);
  return piece;
}

/** An address nobody else in the run has: 10.x.y.z, picked at random. */
const visitorAddress = () =>
  `10.${[0, 0, 0].map(() => 1 + Math.floor(Math.random() * 254)).join(".")}`;

type Account = { name: string; email: string; password: string };

/** A shopper nobody has seen before: every run signs up its own. */
export const newAccount = (label: string): Account => {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return {
    name: `E2E ${label}`,
    email: `e2e-${label}-${stamp}@example.test`,
    password: `e2e-${stamp}-${Math.random().toString(36).slice(2, 12)}`,
  };
};

/**
 * Calls the auth API the way the forms do. Sign-in and sign-up are rate
 * limited (three every ten seconds), so a refusal is waited out as the
 * server asks instead of failing the run.
 */
async function authenticate(
  app: App,
  path: "/api/auth/sign-up/email" | "/api/auth/sign-in/email",
  body: Record<string, string>,
): Promise<Cookie[]> {
  if (!app.baseUrl) throw new Error("The target has no app.url");
  const origin = new URL(app.baseUrl).origin;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(new URL(path, origin), {
      method: "POST",
      headers: { "content-type": "application/json", origin, "x-forwarded-for": visitorAddress() },
      body: JSON.stringify(body),
    });
    if (response.status === 429) {
      const seconds = Number(response.headers.get("x-retry-after") ?? response.headers.get("retry-after") ?? 10);
      await new Promise((resolve) => setTimeout(resolve, (seconds + 1) * 1000));
      continue;
    }
    if (!response.ok) {
      throw new Error(`${path} answered ${response.status}: ${(await response.text()).slice(0, 200)}`);
    }
    return response.headers.getSetCookie().map((header) => {
      const [pair, ...attributes] = header.split(";").map((part) => part.trim());
      const flags = new Map(
        attributes.map((attribute) => {
          const [key, ...rest] = attribute.split("=");
          return [key.toLowerCase(), rest.join("=")] as const;
        }),
      );
      const sameSite = flags.get("samesite")?.toLowerCase();
      return {
        name: pair.slice(0, pair.indexOf("=")),
        value: pair.slice(pair.indexOf("=") + 1),
        url: origin,
        httpOnly: flags.has("httponly"),
        secure: flags.has("secure"),
        sameSite: sameSite === "strict" ? "Strict" : sameSite === "none" ? "None" : "Lax",
        ...(flags.has("max-age") ? { expires: Math.floor(Date.now() / 1000) + Number(flags.get("max-age")) } : {}),
      } satisfies Cookie;
    });
  }
  throw new Error(`${path} kept answering 429`);
}

/** Creates the account and returns the cookies of its first session. */
export const signUp = (app: App, account: Account) =>
  authenticate(app, "/api/auth/sign-up/email", account);

export const signIn = (app: App, account: Pick<Account, "email" | "password">) =>
  authenticate(app, "/api/auth/sign-in/email", account);

type Api = (path: string, init?: RequestInit) => Promise<Response>;

/**
 * The suite's `test`. Two things come with it.
 *
 * `visitor`: every test is a visitor of its own, with its own address. The
 * auth server counts requests per client address and a whole suite coming
 * from one machine would otherwise share one allowance (a hundred session
 * checks, then ten seconds of refusals for everybody). A server that reads
 * the address from X-Forwarded-For, as a local `next start` does, gives each
 * test its own count; a platform that overwrites the header counts as before.
 *
 * `api`: a request to the store that carries the cookies of the browser, so
 * a test can read or reset what the signed-in shopper owns.
 */
export const test = base
  .extend<{ visitor: string }>({
    visitor: async ({ browser }, provide) => {
      const address = visitorAddress();
      await browser.route("**/api/auth/**", (route) =>
        route.continue({ headers: { ...route.request.headers, "x-forwarded-for": address } }),
      );
      await provide(address);
    },
  })
  .extend<{ api: Api }>({
    api: async ({ app, browser, visitor }, provide) => {
      await provide(async (path, init) => {
        if (!app.baseUrl) throw new Error("The target has no app.url");
        const origin = new URL(app.baseUrl).origin;
        const headers = new Headers(init?.headers);
        headers.set("origin", origin);
        headers.set("x-forwarded-for", visitor);
        headers.set(
          "cookie",
          (await browser.cookies()).map((cookie) => `${cookie.name}=${cookie.value}`).join("; "),
        );
        return fetch(new URL(path, origin), { redirect: "manual", ...init, headers });
      });
    },
  });

// What the store has recorded, read from its own API. The agent judges what
// a shopper sees; money, quantities and ownership are checked here, where no
// wording and no layout can change the answer.

type BagItem = {
  size: string;
  quantity: number;
  product: { name: string; price: number };
};
type SavedItem = {
  id: number;
  product: { id: number; name: string; variants: { id: number; sizes: string[] }[] };
};

/** The number in a piece's address: /pants/104 is product 104. */
const productId = (piece: Piece) => Number(piece.href.split("?")[0].split("/")[2]);

/** A line of the bag as the tests name it: a piece, a size and how many. */
export const line = (piece: Piece, size: string, quantity = 1) => ({
  name: piece.name.toLowerCase(),
  size,
  quantity,
  price: piece.price,
});

/** The lines of the shopper's bag, as the store has them. */
async function bagInStore(api: Api) {
  const response = await api("/api/user/cart?view=details");
  expect(response.status).toBe(200);
  const { items } = (await response.json()) as { items: BagItem[] };
  return items.map((item) => ({
    name: item.product.name.toLowerCase(),
    size: item.size,
    quantity: item.quantity,
    price: item.product.price,
  }));
}

/** The bag holds exactly these lines, in any order. */
export async function expectBag(api: Api, lines: ReturnType<typeof line>[]) {
  const bag = await bagInStore(api);
  expect(bag).toHaveLength(lines.length);
  expect(bag).toEqual(expect.arrayContaining(lines));
}

export const emptyBag = async (api: Api) =>
  expect((await api("/api/user/cart", { method: "DELETE" })).status).toBe(200);

const savedItems = async (api: Api) => {
  const response = await api("/api/user/wishlist?view=details");
  expect(response.status).toBe(200);
  return ((await response.json()) as { items: SavedItem[] }).items;
};

/** The names of the pieces on the shopper's wishlist, as the store has them. */
export const savedInStore = async (api: Api) =>
  (await savedItems(api)).map((item) => item.product.name.toLowerCase());

export async function forgetSaved(api: Api) {
  for (const { id } of await savedItems(api)) {
    await api(`/api/user/wishlist?itemId=${id}`, { method: "DELETE" });
  }
}

/** Saves a piece to the wishlist without touching the screen, to set a scene. */
export async function save(api: Api, piece: Piece) {
  const response = await api("/api/user/wishlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productId: productId(piece) }),
  });
  expect(response.status).toBe(200);
}

/**
 * Puts a line in the bag without touching the screen, to set a scene. The
 * bag wants the id of a variant and the store has no catalog API, but a
 * saved piece comes back with its variants: the piece is saved for a moment
 * to look the id up.
 */
export async function putInBag(api: Api, piece: Piece, size: string, quantity = 1) {
  await save(api, piece);
  const saved = (await savedItems(api)).find((item) => item.product.id === productId(piece));
  const variant = saved?.product.variants.find((candidate) => candidate.sizes.includes(size));
  await api(`/api/user/wishlist?productId=${productId(piece)}`, { method: "DELETE" });
  if (!variant) throw new Error(`${piece.name} has no variant in size ${size}`);

  const response = await api("/api/user/cart", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ variantId: variant.id, size, quantity }),
  });
  expect(response.status).toBe(200);
}

/** Who the store says is signed in, or nobody. */
export async function shopperInStore(api: Api) {
  const response = await api("/api/auth/get-session");
  expect(response.status).toBe(200);
  const session = (await response.json()) as { user?: { name: string; email: string } } | null;
  return session?.user ?? null;
}
