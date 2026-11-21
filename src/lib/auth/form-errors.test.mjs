import assert from "node:assert/strict";
import test from "node:test";

import { authErrorCode, authFailureMessage, invalidFields } from "./form-errors.ts";

const SIGN_IN = ["email", "password"];
const SIGN_UP = ["name", "email", "password"];
const authError = (code, message = "refused") => Object.assign(new Error(message), { code });

test("no error flags no field", () => {
  assert.deepEqual(invalidFields(null, SIGN_UP), []);
  assert.equal(authFailureMessage(null), null);
});

test("a wrong email or password flags both, and never the name", () => {
  assert.deepEqual(invalidFields(authError("INVALID_EMAIL_OR_PASSWORD"), SIGN_IN), ["email", "password"]);
  assert.deepEqual(invalidFields(authError("INVALID_EMAIL_OR_PASSWORD"), SIGN_UP), ["email", "password"]);
});

test("a short password flags only the password", () => {
  assert.deepEqual(invalidFields(authError("PASSWORD_TOO_SHORT"), SIGN_UP), ["password"]);
});

test("an unverified email, an expired link or a rate limit flags no field", () => {
  for (const code of ["EMAIL_NOT_VERIFIED", "TOKEN_EXPIRED", "INVALID_TOKEN", "RATE_LIMITED"]) {
    assert.deepEqual(invalidFields({ code }, SIGN_IN), [], code);
  }
});

test("an error that names no field flags every field of the form", () => {
  assert.deepEqual(invalidFields(new Error("Network error"), SIGN_UP), SIGN_UP);
  assert.deepEqual(invalidFields("Invalid email or password", SIGN_IN), SIGN_IN);
  assert.deepEqual(invalidFields(authError("FAILED_TO_CREATE_USER"), SIGN_UP), SIGN_UP);
  assert.deepEqual(invalidFields({ code: "UNKNOWN" }, SIGN_UP), SIGN_UP);
});

test("a known code reads as the store's copy; an unknown one keeps its own message", () => {
  assert.match(
    authFailureMessage(authError("EMAIL_NOT_VERIFIED", "Email not verified")),
    /verify your email/i,
  );
  assert.equal(
    authFailureMessage(authError("INVALID_EMAIL_OR_PASSWORD", "anything")),
    "Invalid email or password",
  );
  assert.equal(authFailureMessage(new Error("Network error")), "Network error");
  assert.equal(authFailureMessage("Plain words"), "Plain words");
  assert.match(authFailureMessage({ code: "UNKNOWN" }), /something went wrong/i);
});

test("a query-string error is narrowed to a known code", () => {
  assert.equal(authErrorCode("EMAIL_NOT_VERIFIED"), "EMAIL_NOT_VERIFIED");
  assert.equal(authErrorCode("TOKEN_EXPIRED"), "TOKEN_EXPIRED");
  assert.equal(authErrorCode("<script>"), "UNKNOWN");
  assert.equal(authErrorCode("toString"), "UNKNOWN");
  assert.equal(authErrorCode(null), "UNKNOWN");
});
