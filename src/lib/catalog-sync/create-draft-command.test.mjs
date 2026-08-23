import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  parseStoredCreateCommand,
  selectCreateCommand,
  serializeCreateCommand,
} from "./create-draft-command.ts";

const firstId = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";

test("the same product draft resumes the same command", () => {
  const stored = serializeCreateCommand({ id: firstId, fingerprint: "draft-a" });
  assert.deepEqual(
    selectCreateCommand(stored, "draft-a", () => secondId),
    { id: firstId, fingerprint: "draft-a" },
  );
});

test("a changed product draft rotates the command without clearing form data", () => {
  const stored = serializeCreateCommand({ id: firstId, fingerprint: "draft-a" });
  assert.deepEqual(
    selectCreateCommand(stored, "draft-b", () => secondId),
    { id: secondId, fingerprint: "draft-b" },
  );
});

test("legacy or malformed session values are never reused", () => {
  assert.equal(parseStoredCreateCommand(firstId), null);
  assert.equal(parseStoredCreateCommand('{"id":"bad"}'), null);
});

test("operator-attention responses retain the original command identity", async () => {
  const form = await readFile("src/components/admin/ProductForm.tsx", "utf8");
  assert.doesNotMatch(form, /result\.retryable === false[\s\S]*?createCommand\.clear/);
  assert.match(form, /result\.success &&[\s\S]*?!result\.accepted[\s\S]*?createCommand\.clear/);
});
