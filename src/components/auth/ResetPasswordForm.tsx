"use client";

import { useActionState, useEffect, useRef } from "react";

import { resetPassword } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormError } from "@/components/auth/FormError";
import { buttonClass } from "@/components/ui/button-classes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "@/components/ui/link";
import LoadingButton from "@/components/ui/loading-button";
import { PasswordInput } from "@/components/ui/password-input";
import { AUTH_PAGES } from "@/lib/auth/email-flows";
import { invalidFields } from "@/lib/auth/form-errors";
import { RESET_PASSWORD_START, type ResetPasswordState } from "@/lib/auth/form-state";

const FIELDS = ["password"] as const;
const EXPIRED: ResetPasswordState = { step: "expired" };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isSubmitting] = useActionState(
    resetPassword,
    token ? RESET_PASSWORD_START : EXPIRED,
  );
  const passwordRef = useRef<HTMLInputElement>(null);
  const failure = state.step === "form" ? state.failure : null;

  useEffect(() => {
    if (failure && invalidFields(failure, FIELDS).length) passwordRef.current?.focus();
  }, [failure]);

  if (state.step === "expired") {
    return (
      <AuthShell
        word="Reset"
        title="This link has expired"
        description="A reset link works once, and only for a while. Ask for a new one."
        footerText="Remembered it?"
        footerHref={AUTH_PAGES.signIn}
        footerLinkLabel="Sign in here"
      >
        <Link
          href={AUTH_PAGES.forgotPassword}
          className={buttonClass({ className: "w-full text-base" })}
        >
          Ask for a new link
        </Link>
      </AuthShell>
    );
  }

  if (state.step === "done") {
    return (
      <AuthShell
        word="Done"
        title="Password changed"
        description="You’re signed out on every device. Sign in with your new password."
        footerText="No account yet?"
        footerHref={AUTH_PAGES.register}
        footerLinkLabel="Create one here"
      >
        {/* A full load, so no page keeps the session the reset just revoked. */}
        <a
          href={AUTH_PAGES.signIn}
          className={buttonClass({ className: "w-full text-base" })}
        >
          Sign in
        </a>
      </AuthShell>
    );
  }

  const invalid = invalidFields(failure, FIELDS);

  return (
    <AuthShell
      word="Reset"
      title="Set a new password"
      description="Choose a new password. Setting it signs you out on every device."
      footerText="Remembered it?"
      footerHref={AUTH_PAGES.signIn}
      footerLinkLabel="Sign in here"
    >
      <form action={formAction} className="flex flex-col gap-4">
        <Input type="hidden" name="token" value={token} className="hidden" />
        <FormError
          message={failure?.message ?? null}
          pending={isSubmitting}
          attempt={failure?.attempt}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="reset-password" className="text-sm font-medium">
              New password
            </Label>
            <span id="reset-password-hint" className="text-13 text-muted">
              At least 8 characters
            </span>
          </div>
          <PasswordInput
            id="reset-password"
            ref={passwordRef}
            name="password"
            autoComplete="new-password"
            aria-describedby="reset-password-hint"
            required
            minLength={8}
            aria-invalid={invalid.includes("password") || undefined}
            readOnly={isSubmitting}
          />
        </div>

        <LoadingButton
          type="submit"
          className="mt-1.5 w-full text-base"
          loading={isSubmitting}
        >
          {isSubmitting ? "Saving password…" : "Save password"}
        </LoadingButton>
      </form>
    </AuthShell>
  );
}
