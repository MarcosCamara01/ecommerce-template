"use server";

import { getCanonicalAppOrigin } from "@/lib/app-origin";
import { callAuthEndpoint } from "@/lib/auth/endpoint";
import { nextFailure, type SignUpState } from "@/lib/auth/form-state";
import { safeLocalCallback } from "@/lib/auth/local-callback";

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
