import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { QueryClient, MutationObserver } from "@tanstack/react-query";
import { createAuthClient } from "better-auth/client";
import ts from "typescript";

const require = createRequire(import.meta.url);

async function profileHarness({ rejected = false } = {}) {
  let serverName = "Original name";
  const events = [];
  const authClient = createAuthClient({
    baseURL: "http://profile.example.test",
    fetchOptions: {
      customFetchImpl: async () => {
        events.push(`session:${serverName}`);
        return Response.json({
          user: { id: "profile-qa", name: serverName, email: "profile@example.test" },
          session: {
            id: "qa-session",
            token: "qa-only-token",
            userId: "profile-qa",
            expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
          },
        });
      },
    },
  });
  const session = authClient.$store.atoms.session;
  await session.get().refetch();
  const client = new QueryClient({ defaultOptions: { mutations: { gcTime: 0 } } });
  let mutation;
  const modules = {
    react: { useRef: () => ({ current: { value: "Updated name" } }) },
    "@tanstack/react-query": {
      useMutation: (options) => {
        mutation = new MutationObserver(client, options);
        return { mutate: () => {}, isPending: false };
      },
    },
    "next/navigation": { useRouter: () => ({ refresh: () => events.push("refresh") }) },
    sonner: { toast: { success: () => events.push("success"), error: () => events.push("error") } },
    "@/lib/auth/client": { useSession: () => session.get() },
    "@/components/ui/button": { Button: "button" },
    "@/components/ui/dialog": Object.fromEntries(
      ["Dialog", "DialogClose", "DialogContent", "DialogDescription", "DialogFooter", "DialogHeader", "DialogTitle"]
        .map((name) => [name, name]),
    ),
    "@/components/ui/input": { Input: "input" },
    "@/components/ui/label": { Label: "label" },
    "@/components/ui/loadingButton": { __esModule: true, default: "button" },
  };
  const source = await readFile(new URL("./EditProfile.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const component = { exports: {} };
  new Function("require", "module", "exports", "fetch", compiled)(
    (id) => modules[id] ?? require(id), component, component.exports,
    async (_url, options) => {
      if (rejected) return Response.json({ error: "Invalid profile" }, { status: 400 });
      serverName = JSON.parse(options.body).name;
      events.push(`save:${serverName}`);
      return Response.json({ user: { name: serverName } });
    },
  );
  component.exports.default({
    manager: { active: true, set: () => {}, close: () => events.push(`close:${session.get().data.user.name}`) },
    returnFocusRef: { current: null },
  });
  return { mutation, session, events, dispose: () => client.clear() };
}

test("saving a profile refreshes the client session before closing the dialog", async () => {
  const harness = await profileHarness();
  try {
    await harness.mutation.mutate();
    assert.equal(harness.session.get().data.user.name, "Updated name");
    assert.deepEqual(harness.events, [
      "session:Original name", "save:Updated name", "session:Updated name",
      "close:Updated name", "refresh", "success",
    ]);
  } finally {
    harness.dispose();
  }
});

test("a rejected profile update keeps the current session and dialog", async () => {
  const harness = await profileHarness({ rejected: true });
  try {
    await assert.rejects(harness.mutation.mutate(), { message: "Invalid profile" });
    assert.equal(harness.session.get().data.user.name, "Original name");
    assert.deepEqual(harness.events, ["session:Original name", "error"]);
  } finally {
    harness.dispose();
  }
});
