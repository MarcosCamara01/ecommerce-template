import assert from "node:assert/strict";
import test from "node:test";

import { checkoutBindingContractFailures } from "./checkout-binding-contract.ts";

const guarded = {
  owner: "app_owner",
  securityDefiner: true,
  language: "sql",
  settings: ["search_path=pg_catalog, app_private"],
  privileges: ["app_owner:EXECUTE", "app_runtime:EXECUTE"],
};

const canonical = [
  {
    ...guarded,
    name: "bind_checkout_intent",
    argumentNames: ["p_user_id", "p_intent_id", "p_checkout_session_id"],
    argumentTypes: "text, text, text",
    result: "SETOF app_private.checkout_intents",
    body: `UPDATE app_private.checkout_intents AS intent
      SET checkout_session_id = p_checkout_session_id
      WHERE intent.id = p_intent_id
        AND intent.user_id = p_user_id
        AND (intent.checkout_session_id IS NULL OR intent.checkout_session_id = p_checkout_session_id)
      RETURNING intent.*`,
  },
  {
    ...guarded,
    name: "retire_checkout_intents",
    argumentNames: ["p_user_id", "p_checkout_session_ids"],
    argumentTypes: "text, text[]",
    result: "void",
    body: `UPDATE app_private.checkout_intents AS intent
      SET expires_at = now()
      WHERE intent.user_id = p_user_id
        AND intent.checkout_session_id = ANY (p_checkout_session_ids)
        AND intent.expires_at > now()`,
  },
];

test("the canonical checkout intent functions are accepted", () => {
  assert.deepEqual(checkoutBindingContractFailures(canonical), []);
});

test("cutover marking rejects body, owner, security, search path, and ACL drift", () => {
  for (const drift of [
    { owner: "postgres" },
    { securityDefiner: false },
    { settings: null },
    { body: "select null" },
    { privileges: ["PUBLIC:EXECUTE", "app_owner:EXECUTE"] },
  ]) {
    for (const index of canonical.keys()) {
      const routines = canonical.map((routine, at) =>
        at === index ? { ...routine, ...drift } : routine,
      );
      assert.notDeepEqual(checkoutBindingContractFailures(routines), []);
    }
  }
});

test("a missing retirement function is rejected", () => {
  assert.deepEqual(checkoutBindingContractFailures(canonical.slice(0, 1)), [
    "retire_checkout_intents overload count is 0, expected 1",
  ]);
});

test("retirement can only shorten the caller's own unexpired intents", () => {
  const retire = canonical[1];
  for (const body of [
    retire.body.replace("AND intent.expires_at > now()", ""),
    retire.body.replace("WHERE intent.user_id = p_user_id\n        AND", "WHERE"),
    retire.body.replace("SET expires_at = now()", "SET checkout_session_id = NULL"),
  ]) {
    assert.notDeepEqual(
      checkoutBindingContractFailures([canonical[0], { ...retire, body }]),
      [],
    );
  }
});
