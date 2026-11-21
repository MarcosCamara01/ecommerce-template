"use client";

import { useActionState, useEffect, useRef } from "react";

import { requestPasswordReset } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/AuthShell";
import { CheckEmail } from "@/components/auth/CheckEmail";
import { FormError } from "@/components/auth/FormError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingButton from "@/components/ui/loading-button";
import { AUTH_PAGES } from "@/lib/auth/email-flows";
import { invalidFields } from "@/lib/auth/form-errors";
import { FORGOT_PASSWORD_START } from "@/lib/auth/form-state";

const FIELDS = ["email"] as const;

export function ForgotPasswordForm() {
  const [state, formAction, isSubmitting] = useActionState(
    requestPasswordReset,
    FORGOT_PASSWORD_START,
  );
  const emailRef = useRef<HTMLInputElement>(null);
  const failure = state.step === "form" ? state.failure : null;

  useEffect(() => {
    if (failure && invalidFields(failure, FIELDS).length) emailRef.current?.focus();
  }, [failure]);

  if (state.step === "sent") {
    return (
      <AuthShell
        word="Reset"
        title="Check your email"
        description="Open the link to set a new password."
        footerText="Remembered it?"
        footerHref={AUTH_PAGES.signIn}
        footerLinkLabel="Sign in here"
      >
        <CheckEmail email={state.email} ifAccountExists>
          Didn’t get it? Check the address and your spam folder, then ask again in a minute.
        </CheckEmail>
      </AuthShell>
    );
  }

  const invalid = invalidFields(failure, FIELDS);

  return (
    <AuthShell
      word="Reset"
      title="Forgot your password?"
      description="Enter your email and we’ll send you a link to set a new one."
      footerText="Remembered it?"
      footerHref={AUTH_PAGES.signIn}
      footerLinkLabel="Sign in here"
    >
      <form action={formAction} className="flex flex-col gap-4">
        <FormError
          message={failure?.message ?? null}
          pending={isSubmitting}
          attempt={failure?.attempt}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="forgot-email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="forgot-email"
            type="email"
            ref={emailRef}
            placeholder="name@example.com"
            defaultValue={state.email}
            name="email"
            autoComplete="email"
            required
            aria-invalid={invalid.includes("email") || undefined}
            readOnly={isSubmitting}
          />
        </div>

        <LoadingButton
          type="submit"
          className="mt-1.5 w-full text-base"
          loading={isSubmitting}
        >
          {isSubmitting ? "Sending link…" : "Send link"}
        </LoadingButton>
      </form>
    </AuthShell>
  );
}
