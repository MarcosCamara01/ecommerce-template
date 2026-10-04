import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { QueryClient, MutationObserver } from "@tanstack/react-query";
import { tsImport } from "tsx/esm/api";
import ts from "typescript";

const require = createRequire(import.meta.url);
const schema = await tsImport("../lib/db/drizzle/schema/index.ts", import.meta.url);
const cartKeys = (await tsImport("./cart/keys.ts", import.meta.url)).CART_QUERY_KEYS;
const wishlistKeys = (await tsImport("./wishlist/keys.ts", import.meta.url)).WISHLIST_QUERY_KEYS;

async function loadMutation(kind, {
  authenticated = true,
  initialItems,
  getServerItems = () => initialItems ?? [],
  fetchMutation = async () => Response.json({ error: "Request rejected" }, { status: 400 }),
} = {}) {
  const client = new QueryClient({ defaultOptions: { mutations: { gcTime: 0 } } });
  const mutations = [];
  const notices = [];
  const listKey = kind === "cart" ? cartKeys.cartList("qa") : wishlistKeys.wishlistList("qa");
  let listReads = 0;
  let nextTemporaryId = 0;
  let fetchCalls = 0;
  client.setQueryDefaults(listKey, {
    retry: false,
    queryFn: async () => {
      listReads += 1;
      return { items: await getServerItems() };
    },
  });
  if (initialItems) client.setQueryData(listKey, { items: initialItems });
  const path = `./${kind}/mutations/use${kind === "cart" ? "Cart" : "Wishlist"}Mutation.ts`;
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const modules = {
    "@tanstack/react-query": {
      useQueryClient: () => client,
      useMutation: (options) => {
        const observer = new MutationObserver(client, options);
        mutations.push(observer);
        return { mutate: observer.mutate.bind(observer), mutateAsync: observer.mutate.bind(observer) };
      },
    },
    "@/lib/auth/client": { useSession: () => ({ data: authenticated ? { user: { id: "qa" } } : null }) },
    "@/lib/db/drizzle/schema": schema,
    sonner: { toast: { info: (message) => notices.push(message), error: (message) => notices.push(message) } },
    "../keys": { CART_QUERY_KEYS: cartKeys, WISHLIST_QUERY_KEYS: wishlistKeys },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const hookModule = { exports: {} };
  new Function("require", "module", "exports", "fetch", "console", "Math", compiled)(
    (id) => modules[id] ?? require(id), hookModule, hookModule.exports,
    async (...args) => {
      fetchCalls += 1;
      return fetchMutation(...args);
    },
    { error: () => {} },
    { floor: Math.floor, random: () => ++nextTemporaryId / 1e9 },
  );
  const createAddition = () => {
    const index = mutations.length;
    hookModule.exports[kind === "cart" ? "useCartMutation" : "useWishlistMutation"]();
    return mutations[index];
  };
  createAddition();
  return { client, mutations, notices, listKey, createAddition, listReads: () => listReads, fetchCalls: () => fetchCalls };
}

// The notices people read: the storefront says "bag" and "sign in".
const SIGN_IN = {
  cart: "Sign in to add to your bag",
  wishlist: "Sign in to save to your wishlist",
};
const ADD_ERROR = {
  cart: "Couldn’t add to your bag. Try again.",
  wishlist: "Couldn’t save to your wishlist. Try again.",
};
const BAG_ERROR = "Couldn’t update your bag. Try again.";

for (const kind of ["cart", "wishlist"]) {
  test(`${kind} unauthorized add shows sign-in guidance once and preserves other mutation feedback`, async () => {
    const { client, mutations, notices, fetchCalls } = await loadMutation(kind, { authenticated: false });
    try {
      const variables = kind === "cart"
        ? [{ variantId: 1, size: "M" }, { itemId: 1, quantity: 2 }, { itemId: 1 }, undefined]
        : [1, { itemId: 1 }];
      for (const [index, mutation] of mutations.entries()) {
        await assert.rejects(mutation.mutate(variables[index]), { message: "Unauthorized" });
      }
      assert.deepEqual(notices, kind === "cart"
        ? [SIGN_IN.cart, BAG_ERROR, BAG_ERROR, BAG_ERROR]
        : [SIGN_IN.wishlist, "Couldn’t update your wishlist. Try again."]);
      assert.equal(fetchCalls(), 0, "unauthenticated mutations stop before fetching");
    } finally {
      client.clear();
    }
  });

  test(`${kind} rejected first addition removes its optimistic row`, async () => {
    const { client, mutations, notices, listKey } = await loadMutation(kind);
    try {
      await assert.rejects(
        mutations[0].mutate(kind === "cart" ? { variantId: 1, size: "M" } : 1),
        { message: "Request rejected" },
      );
      assert.deepEqual(client.getQueryData(listKey)?.items ?? [], []);
      assert.deepEqual(notices, [ADD_ERROR[kind]]);
    } finally {
      client.clear();
    }
  });

  test(`${kind} expired-session addition shows sign-in guidance after rolling back`, async () => {
    const { client, mutations, notices, listKey } = await loadMutation(kind, {
      fetchMutation: async () => Response.json({ error: "authentication_required" }, { status: 401 }),
    });
    try {
      await assert.rejects(
        mutations[0].mutate(kind === "cart" ? { variantId: 1, size: "M" } : 1),
        { message: "authentication_required" },
      );
      assert.deepEqual(client.getQueryData(listKey)?.items ?? [], []);
      assert.deepEqual(notices, [SIGN_IN[kind]]);
    } finally {
      client.clear();
    }
  });

  for (const populated of [false, true]) {
    test(`${kind} failure preserves another successful addition with ${populated ? "populated" : "empty"} initial cache`, async () => {
      const original = itemFixture(kind, 100);
      const confirmed = itemFixture(kind, 2);
      let serverItems = populated ? [original] : [];
      const responses = new Map();
      const harness = await loadMutation(kind, {
        initialItems: populated ? [original] : undefined,
        getServerItems: () => serverItems,
        fetchMutation: async (_, request) => {
          const payload = JSON.parse(request.body);
          const id = payload.variantId ?? payload.productId;
          return new Promise((resolve) => responses.set(id, resolve));
        },
      });
      try {
        const failed = harness.mutations[0].mutate(kind === "cart" ? { variantId: 1, size: "M" } : 1);
        void failed.catch(() => {});
        await new Promise(setImmediate);
        const successful = harness.createAddition().mutate(kind === "cart" ? { variantId: 2, size: "M" } : 2);
        await new Promise(setImmediate);

        serverItems = [...serverItems, confirmed];
        responses.get(2)(Response.json({ item: confirmed }));
        await successful;
        responses.get(1)(Response.json({ error: "Request rejected" }, { status: 400 }));
        await assert.rejects(failed, { message: "Request rejected" });

        assert.deepEqual(
          harness.client.getQueryData(harness.listKey).items.map((item) => item.id).sort((a, b) => a - b),
          serverItems.map((item) => item.id).sort((a, b) => a - b),
        );
      } finally {
        harness.client.clear();
      }
    });
  }
}

test("failed cart addition preserves a quantity confirmed by another addition to the same line", async () => {
  const original = { ...itemFixture("cart", 1), quantity: 3 };
  const confirmed = { ...original, quantity: 4 };
  let serverItems = [original];
  const responses = [];
  const harness = await loadMutation("cart", {
    initialItems: [original],
    getServerItems: () => serverItems,
    fetchMutation: async () => new Promise((resolve) => responses.push(resolve)),
  });
  try {
    const failed = harness.mutations[0].mutate({ variantId: 1, size: "M", quantity: 2 });
    void failed.catch(() => {});
    await new Promise(setImmediate);
    const successful = harness.createAddition().mutate({ variantId: 1, size: "M" });
    await new Promise(setImmediate);

    serverItems = [confirmed];
    responses[1](Response.json({ item: confirmed }));
    await successful;
    responses[0](Response.json({ error: "Request rejected" }, { status: 400 }));
    await assert.rejects(failed, { message: "Request rejected" });

    assert.equal(harness.client.getQueryData(harness.listKey).items[0].quantity, 4);
    assert.ok(harness.listReads() > 0, "uncertain optimistic quantities reconcile with the server");
  } finally {
    harness.client.clear();
  }
});

test("a rejected addition restores the server quantity of an existing cart line", async () => {
  const original = { ...itemFixture("cart", 1), quantity: 3 };
  const harness = await loadMutation("cart", { initialItems: [original] });
  try {
    await assert.rejects(harness.mutations[0].mutate({ variantId: 1, size: "M", quantity: 2 }));
    assert.equal(harness.client.getQueryData(harness.listKey).items[0].quantity, 3);
  } finally {
    harness.client.clear();
  }
});

test("an existing cart line rolls back offline without replacing the original add error", async () => {
  const original = { ...itemFixture("cart", 1), quantity: 3 };
  const harness = await loadMutation("cart", {
    initialItems: [original],
    getServerItems: () => { throw new Error("Reconciliation is offline"); },
  });
  try {
    await assert.rejects(
      harness.mutations[0].mutate({ variantId: 1, size: "M", quantity: 2 }),
      { message: "Request rejected" },
    );
    assert.equal(harness.client.getQueryData(harness.listKey).items[0].quantity, 3);
    assert.deepEqual(harness.notices, [ADD_ERROR.cart]);
    assert.equal(harness.client.getQueryState(harness.listKey).error.message, "Reconciliation is offline");
  } finally {
    harness.client.clear();
  }
});

for (const scenario of ["empty cache", "populated cache", "same cart line"]) {
  test(`a stale failure refetch cannot overwrite a later cart success with ${scenario}`, async () => {
    const sameLine = scenario === "same cart line";
    const original = { ...itemFixture("cart", sameLine ? 1 : 100), quantity: 3 };
    const initialItems = scenario === "empty cache" ? [] : [original];
    const confirmed = sameLine ? { ...original, quantity: 4 } : itemFixture("cart", 2);
    let serverItems = initialItems;
    const responses = [];
    const refetches = [];
    const harness = await loadMutation("cart", {
      initialItems: scenario === "empty cache" ? undefined : initialItems,
      fetchMutation: async () => new Promise((resolve) => responses.push(resolve)),
      getServerItems: () => {
        const snapshot = structuredClone(serverItems);
        return new Promise((resolve) => refetches.push({ snapshot, resolve }));
      },
    });
    try {
      const failed = harness.mutations[0].mutate({ variantId: 1, size: "M", quantity: 2 });
      void failed.catch(() => {});
      await new Promise(setImmediate);
      const successful = harness.createAddition().mutate({ variantId: sameLine ? 1 : 2, size: "M" });
      await new Promise(setImmediate);

      responses[0](Response.json({ error: "Request rejected" }, { status: 400 }));
      await new Promise(setImmediate);
      assert.deepEqual(refetches[0].snapshot, initialItems);

      serverItems = sameLine ? [confirmed] : [...initialItems, confirmed];
      responses[1](Response.json({ item: confirmed }));
      await new Promise(setImmediate);
      assert.equal(refetches.length, 2, "success cancels the stale fetch and reconciles again");

      refetches[0].resolve(refetches[0].snapshot);
      await new Promise(setImmediate);
      assert.equal(
        harness.client.getQueryData(harness.listKey).items.find((item) => item.id === confirmed.id)?.quantity,
        confirmed.quantity,
        "the confirmed addition remains visible when the canceled old read resolves",
      );
      refetches[1].resolve(refetches[1].snapshot);
      await successful;
      await assert.rejects(failed, { message: "Request rejected" });
      assert.deepEqual(harness.client.getQueryData(harness.listKey).items, serverItems);
    } finally {
      harness.client.clear();
    }
  });
}

function itemFixture(kind, id) {
  return {
    id,
    userId: "qa",
    createdAt: "2026-10-03T10:00:00.000Z",
    updatedAt: "2026-10-03T10:00:00.000Z",
    ...(kind === "cart"
      ? { variantId: id, size: "M", quantity: 1, stripeId: `price_${id}` }
      : { productId: id }),
  };
}
