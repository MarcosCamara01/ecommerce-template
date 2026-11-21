"use server";

import { getCanonicalAppOrigin } from "@/lib/app-origin";
import { AUTH_PAGES } from "@/lib/auth/email-flows";
import { callAuthEndpoint } from "@/lib/auth/endpoint";
import type { AuthErrorCode } from "@/lib/auth/form-errors";
import {
  type ForgotPasswordState,
  type ResetPasswordState,
  type SignUpState,
  nextFailure,
} from "@/lib/auth/form-state";
import { safeLocalCallback } from "@/lib/auth/local-callback";

const DEAD_LINK_CODES: ReadonlySet<AuthErrorCode> = new Set([
  "INVALID_TOKEN",
  "TOKEN_EXPIRED",
  "USER_NOT_FOUND",
]);

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

export async function signUp(state: SignUpState, form: FormData): Promise<SignUpState> {
  const name = field(form, "name");
  const email = field(form, "email");
  const result = await callAuthEndpoint("/sign-up/email", {
    name,
    email,
    password: field(form, "password"),
    callbackURL: safeLocalCallback(field(form, "callbackURL"), getCanonicalAppOrigin()),
  });
  return result.ok
    ? { step: "check-email", email }
    : {
        step: "form",
        name,
        email,
        failure: nextFailure(state.step === "form" ? state.failure : null, result.code),
      };
}

export async function requestPasswordReset(
  state: ForgotPasswordState,
  form: FormData,
): Promise<ForgotPasswordState> {
  const email = field(form, "email");
  const result = await callAuthEndpoint("/request-password-reset", {
    email,
    redirectTo: AUTH_PAGES.resetPassword,
  });
  return result.ok
    ? { step: "sent", email }
    : {
        step: "form",
        email,
        failure: nextFailure(state.step === "form" ? state.failure : null, result.code),
      };
}

export async function resetPassword(
  state: ResetPasswordState,
  form: FormData,
): Promise<ResetPasswordState> {
  const token = field(form, "token");
  if (!token) return { step: "expired" };
  const result = await callAuthEndpoint("/reset-password", {
    token,
    newPassword: field(form, "password"),
  });
  if (result.ok) return { step: "done" };
  if (DEAD_LINK_CODES.has(result.code)) return { step: "expired" };
  return {
    step: "form",
    failure: nextFailure(state.step === "form" ? state.failure : null, result.code),
  };
}
