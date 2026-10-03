import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { QueryClient, MutationObserver } from "@tanstack/react-query";
import ts from "typescript";
import { safeLocalCallback } from "../../lib/auth/local-callback.ts";

const source = await readFile(new URL("./useAuthMutation.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function loadAuthMutation(result) {
  const client = new QueryClient({ defaultOptions: { mutations: { gcTime: 0 } } });
  client.setQueryData(["qa"], "session cache");
  const navigations = [];
  const notices = [];
  const respond = async () => result;
  const modules = {
    "@tanstack/react-query": {
      useQueryClient: () => client,
      useMutation: (options) => {
        const observer = new MutationObserver(client, options);
        return { mutateAsync: observer.mutate.bind(observer) };
      },
    },
    "@/lib/auth/client": { authClient: { signIn: { email: respond, social: respond }, signUp: { email: respond }, signOut: respond } },
    "@/lib/auth/local-callback": { safeLocalCallback },
    "next/navigation": { useRouter: () => ({ push: (url) => navigations.push(url), refresh: () => navigations.push("refresh") }) },
    sonner: { toast: { error: (message) => notices.push(message) } },
  };
  const hookModule = { exports: {} };
  new Function("require", "module", "exports", "console", compiled)(
    (id) => modules[id], hookModule, hookModule.exports, { error: () => {} },
  );
  return { mutations: hookModule.exports.useAuthMutation(), client, navigations, notices };
}

for (const action of ["signInWithGoogle", "signOut"]) {
  test(`${action} rejects a returned auth error without changing identity cache`, async () => {
    const { mutations, client, navigations, notices } = loadAuthMutation({
      error: { message: "Auth temporarily unavailable" }, data: null,
    });
    try {
      await assert.rejects(mutations[action].mutateAsync({}), { message: "Auth temporarily unavailable" });
      assert.equal(client.getQueryData(["qa"]), "session cache");
      assert.deepEqual(navigations, []);
      assert.equal(notices.length, 1);
    } finally {
      client.clear();
    }
  });
}

test("Google sign-in leaves provider navigation to Better Auth", async () => {
  const { mutations, client, navigations } = loadAuthMutation({
    error: null, data: { url: "https://accounts.google.com/authorize", redirect: true },
  });
  try {
    await mutations.signInWithGoogle.mutateAsync({ callbackURL: "/cart" });
    assert.deepEqual(navigations, []);
  } finally {
    client.clear();
  }
});
