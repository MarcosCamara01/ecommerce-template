import assert from "node:assert/strict";
import test from "node:test";

import { MailDeliveryError, failureFromResendResponse } from "./delivery-error.ts";

test("Resend refusals that no retry can fix are permanent", () => {
  for (const [status, name, reason] of [
    [400, "validation_error", "rejected"],
    [400, "invalid_idempotency_key", "rejected"],
    [422, "missing_required_field", "rejected"],
    [401, "missing_api_key", "unauthorized"],
    [403, "validation_error", "rejected"],
    [403, "restricted_api_key", "unauthorized"],
    [403, "suspended_api_key", "unauthorized"],
    [404, "not_found", "rejected"],
    [409, "invalid_idempotent_request", "idempotency_conflict"],
    [429, "daily_quota_exceeded", "quota_exceeded"],
    [429, "monthly_quota_exceeded", "quota_exceeded"],
  ]) {
    const failure = failureFromResendResponse(status, { name, message: "refused" });
    assert.ok(failure instanceof MailDeliveryError, `${status} ${name}`);
    assert.equal(failure.reason, reason, `${status} ${name}`);
    assert.equal(failure.retryable, false, `${status} ${name}`);
    assert.equal(failure.status, status, `${status} ${name}`);
  }
});

test("Resend refusals that can succeed later retry", () => {
  for (const [status, name, reason] of [
    [409, "concurrent_idempotent_requests", "in_flight"],
    [429, "rate_limit_exceeded", "rate_limited"],
    [500, "application_error", "unavailable"],
    [503, "service_unavailable", "unavailable"],
  ]) {
    const failure = failureFromResendResponse(status, { name });
    assert.equal(failure.reason, reason, `${status} ${name}`);
    assert.equal(failure.retryable, true, `${status} ${name}`);
  }
});

test("an unreadable error body classifies by status alone", () => {
  for (const body of [null, "<html>Bad gateway</html>", {}, { name: 42 }]) {
    assert.equal(failureFromResendResponse(409, body).retryable, true, "409 retries");
    assert.equal(failureFromResendResponse(429, body).retryable, true, "429 retries");
    assert.equal(failureFromResendResponse(400, body).retryable, false, "400 is permanent");
    assert.equal(failureFromResendResponse(403, body).retryable, false, "403 is permanent");
  }
});

test("a failure never carries Resend's message text", () => {
  const failure = failureFromResendResponse(403, {
    name: "validation_error",
    message: "The buyer@example.test address is on the suppression list",
  });
  assert.doesNotMatch(failure.message, /buyer@example\.test|suppression/);
  assert.match(failure.message, /403/);
  assert.match(failure.message, /validation_error/);
});

test("a delivery error's retryability follows its reason", () => {
  assert.equal(new MailDeliveryError("not_configured", "disabled").retryable, false);
  assert.equal(new MailDeliveryError("unavailable", "timeout").retryable, true);
  assert.equal(new MailDeliveryError("unavailable", "timeout").status, null);
});
