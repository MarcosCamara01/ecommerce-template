import assert from "node:assert/strict";
import test from "node:test";

import { createCatalogRouteHandler } from "./authorization.ts";

const classifyError = (error) => error?.status ?? null;

test("anonymous catalog administration receives 401", async () => {
  let authorizedCalls = 0;
  const handler = createCatalogRouteHandler(
    async () => { throw { status: 401 }; },
    classifyError,
    async () => {
      authorizedCalls += 1;
      return Response.json({ accepted: true });
    },
  );
  const response = await handler({ headers: new Headers() });
  assert.equal(response.status, 401);
  assert.equal(authorizedCalls, 0);
});

test("authenticated catalog administration without capability receives 403", async () => {
  let authorizedCalls = 0;
  const handler = createCatalogRouteHandler(
    async () => { throw { status: 403 }; },
    classifyError,
    async () => {
      authorizedCalls += 1;
      return Response.json({ accepted: true });
    },
  );
  const response = await handler({ headers: new Headers() });
  assert.equal(response.status, 403);
  assert.equal(authorizedCalls, 0);
});

test("authorized catalog administration receives its Principal", async () => {
  const principal = Object.freeze({ kind: "user", userId: "admin-1" });
  let receivedPrincipal;
  let requestedCapability;
  const handler = createCatalogRouteHandler(
    async (_headers, capability) => {
      requestedCapability = capability;
      return principal;
    },
    classifyError,
    async (_request, authorizedPrincipal) => {
      receivedPrincipal = authorizedPrincipal;
      return Response.json({ accepted: true }, { status: 202 });
    },
  );
  const response = await handler({ headers: new Headers() });
  assert.equal(response.status, 202);
  assert.equal(receivedPrincipal, principal);
  assert.equal(requestedCapability, "catalog:manage");
});
