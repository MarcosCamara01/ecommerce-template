import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const route = await readFile(
  "src/app/api/admin/fulfillment/replay/route.ts",
  "utf8",
);

test("replay route authenticates before parsing and maps malformed JSON to 400", async () => {
  assert.ok(
    route.indexOf("requireCapabilityFromHeaders") < route.indexOf("request.json()"),
    "authentication must run before request body parsing",
  );
  assert.match(route, /catch \(error\)[\s\S]+error instanceof SyntaxError/);
  assert.match(
    route,
    /error instanceof SyntaxError[\s\S]+Invalid replay request[\s\S]+status: 400/,
  );
  assert.match(
    route,
    /error instanceof IdentityError[\s\S]+authentication_required[\s\S]+401 : 403/,
  );
  assert.match(route, /Replay failed[\s\S]+status: 500/);
});

test("replay route enforces authentication, capability, and authorized execution", async () => {
  for (const [identityCode, expectedStatus] of [
    ["authentication_required", 401],
    ["capability_required", 403],
  ]) {
    const harness = loadRouteHarness({ identityCode });
    const response = await harness.POST(requestWith({
      kind: "work",
      checkoutSessionId: "cs_runtime_replay",
      reason: "Runtime replay evidence",
    }, harness.events));
    assert.equal(response.status, expectedStatus);
    assert.deepEqual(harness.events, ["authorize"]);
  }

  const authorized = loadRouteHarness();
  const response = await authorized.POST(requestWith({
    kind: "work",
    checkoutSessionId: "cs_runtime_replay",
    reason: "Runtime replay evidence",
  }, authorized.events));
  assert.equal(response.status, 202);
  assert.deepEqual(authorized.events, ["authorize", "parse", "replay:work"]);
});

class IdentityError extends Error {
  constructor(code) {
    super(code);
    this.name = "IdentityError";
    this.code = code;
  }
}

function loadRouteHarness({ identityCode } = {}) {
  const events = [];
  const modules = {
    "next/server": {
      NextResponse: {
        json: (body, init = {}) => ({ body, status: init.status ?? 200 }),
      },
    },
    zod: nativeRequire("zod"),
    "@/lib/identity": {
      IdentityError,
      requireCapabilityFromHeaders: async () => {
        events.push("authorize");
        if (identityCode) throw new IdentityError(identityCode);
        return { kind: "user", userId: "operator-1" };
      },
    },
    "@/lib/data-access": {
      dataAccess: {
        forFulfillmentOperator: () => ({
          replayWork: async () => {
            events.push("replay:work");
            return true;
          },
          replayEffect: async () => {
            events.push("replay:effect");
            return true;
          },
        }),
      },
    },
  };
  const compiled = ts.transpileModule(route, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "route.ts",
  }).outputText;
  const routeModule = { exports: {} };
  const mockedRequire = (id) => modules[id] ?? nativeRequire(id);
  new Function("require", "module", "exports", compiled)(
    mockedRequire,
    routeModule,
    routeModule.exports,
  );
  return { ...routeModule.exports, events };
}

function requestWith(payload, events) {
  return {
    headers: new Headers(),
    json: async () => {
      events.push("parse");
      return payload;
    },
  };
}
