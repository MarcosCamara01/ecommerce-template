import assert from "node:assert/strict";
import test from "node:test";

import { checkoutBindingContractFailures } from "./checkout-binding-contract.ts";

const canonical = {
  owner: "app_owner",
  securityDefiner: true,
  language: "sql",
  argumentNames: ["p_user_id", "p_intent_id", "p_checkout_session_id"],
  argumentTypes: "text, text, text",
  result: "SETOF app_private.checkout_intents",
  settings: ["search_path=pg_catalog, app_private"],
  body: `UPDATE app_private.checkout_intents AS intent
    SET checkout_session_id = p_checkout_session_id
    WHERE intent.id = p_intent_id
      AND intent.user_id = p_user_id
      AND (intent.checkout_session_id IS NULL OR intent.checkout_session_id = p_checkout_session_id)
    RETURNING intent.*`,
  privileges: ["app_owner:EXECUTE", "app_runtime:EXECUTE"],
};

test("the canonical checkout binding contract is accepted", () => {
  assert.deepEqual(checkoutBindingContractFailures([canonical]), []);
});

test("cutover marking rejects body, owner, security, search path, and ACL drift", () => {
  for (const drift of [
    { owner: "postgres" },
    { securityDefiner: false },
    { settings: null },
    { body: "select null" },
    { privileges: ["PUBLIC:EXECUTE", "app_owner:EXECUTE"] },
  ]) {
    assert.notDeepEqual(
      checkoutBindingContractFailures([{ ...canonical, ...drift }]),
      [],
    );
  }
});
