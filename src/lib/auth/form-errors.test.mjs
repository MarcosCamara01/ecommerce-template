import assert from "node:assert/strict";
import test from "node:test";

import { invalidFields } from "./form-errors.ts";

const SIGN_IN = ["email", "password"];
const SIGN_UP = ["name", "email", "password"];
const authError = (code) => Object.assign(new Error("refused"), { code });

test("no error flags no field", () => {
  assert.deepEqual(invalidFields(null, SIGN_UP), []);
});

test("a wrong email or password flags both, and never the name", () => {
  assert.deepEqual(invalidFields(authError("INVALID_EMAIL_OR_PASSWORD"), SIGN_IN), ["email", "password"]);
  assert.deepEqual(invalidFields(authError("INVALID_EMAIL_OR_PASSWORD"), SIGN_UP), ["email", "password"]);
});

test("a short password flags only the password", () => {
  assert.deepEqual(invalidFields(authError("PASSWORD_TOO_SHORT"), SIGN_UP), ["password"]);
});

test("an email already in use flags only the email", () => {
  assert.deepEqual(invalidFields(authError("USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"), SIGN_UP), ["email"]);
  assert.deepEqual(invalidFields(authError("USER_ALREADY_EXISTS"), SIGN_UP), ["email"]);
});

test("an error that names no field flags every field of the form", () => {
  assert.deepEqual(invalidFields(new Error("Network error"), SIGN_UP), SIGN_UP);
  assert.deepEqual(invalidFields("Invalid email or password", SIGN_IN), SIGN_IN);
  assert.deepEqual(invalidFields(authError("FAILED_TO_CREATE_USER"), SIGN_UP), SIGN_UP);
});
