"use client";

import { Suspense, useActionState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { FaGoogle } from "react-icons/fa6";

import { AuthShell } from "@/components/auth/AuthShell";
import { CheckEmail } from "@/components/auth/CheckEmail";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingButton from "@/components/ui/loading-button";
import { useAuthMutation } from "@/hooks/auth/useAuthMutation";
import { authPageHref } from "@/lib/auth/email-flows";
import { authFailureMessage, invalidFields } from "@/lib/auth/form-errors";
import { SIGN_UP_START } from "@/lib/auth/form-state";
import { safeLocalCallback } from "@/lib/auth/local-callback";

import { signUp } from "../actions";

const FIELDS = ["name", "email", "password"] as const;

function RegisterContent() {
  const { signInWithGoogle } = useAuthMutation();
  const [state, formAction, isSubmitting] = useActionState(signUp, SIGN_UP_START);
  const searchParams = useSearchParams();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const callbackURL = safeLocalCallback(searchParams.get("redirect"));
  const signInHref = authPageHref("signIn", { redirect: callbackURL });
  const failure = state.step === "form" ? state.failure : null;

  // Focus goes to the field to fix, unless it is already in one of them.
  useEffect(() => {
    if (!failure) return;
    const refs = { name: nameRef, email: emailRef, password: passwordRef };
    const fields = invalidFields(failure, FIELDS).map((field) => refs[field].current);
    if (!fields.some((field) => field === document.activeElement)) fields[0]?.focus();
  }, [failure]);

  if (state.step === "check-email") {
    return (
      <AuthShell
        word="Join"
        title="Check your email"
        description="Open the link we sent to finish creating your account."
        footerText="Already confirmed?"
        footerHref={signInHref}
        footerLinkLabel="Sign in here"
      >
        <CheckEmail email={state.email}>
          Didn’t get it? Sign in with your email and password, and we’ll send a new link.
        </CheckEmail>
      </AuthShell>
    );
  }

  const invalid = invalidFields(failure, FIELDS);
  const isGoogleLoading = signInWithGoogle.isPending;
  const isLoading = isSubmitting || isGoogleLoading;
  const googleAuthEnabled =
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  return (
    <AuthShell
      word="Join"
      title="Create your account"
      description="Create your account in seconds with your email and password."
      footerText="Already have an account?"
      footerHref={signInHref}
      footerLinkLabel="Sign in here"
    >
      <form action={formAction} className="flex flex-col gap-4">
        <Input type="hidden" name="callbackURL" value={callbackURL} className="hidden" />
        <FormError
          message={failure?.message ?? authFailureMessage(signInWithGoogle.error)}
          pending={isSubmitting}
          attempt={failure?.attempt}
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="register-name"
              className="text-sm font-medium"
            >
              Full name
            </Label>
            <Input
              id="register-name"
              type="text"
              ref={nameRef}
              required
              placeholder="Alex Morgan"
              defaultValue={state.name}

              name="name"
              autoComplete="name"
              aria-invalid={invalid.includes("name") || undefined}
              readOnly={isLoading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="register-email"
              className="text-sm font-medium"
            >
              Email
            </Label>
            <Input
              id="register-email"
              type="email"
              ref={emailRef}
              required
              placeholder="name@example.com"
              defaultValue={state.email}

              name="email"
              autoComplete="email"
              aria-invalid={invalid.includes("email") || undefined}
              readOnly={isLoading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="register-password" className="text-sm font-medium">
                Password
              </Label>
              <span id="register-password-hint" className="text-13 text-muted">
                At least 8 characters
              </span>
            </div>
            <PasswordInput
              id="register-password"
              ref={passwordRef}
              name="password"
              autoComplete="new-password"
              aria-describedby="register-password-hint"
              required
              minLength={8}
              aria-invalid={invalid.includes("password") || undefined}
              readOnly={isLoading}
            />
          </div>
        </div>

        <LoadingButton
          type="submit"
          className="mt-1.5 w-full text-base"
          loading={isSubmitting}
          disabled={isGoogleLoading}
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </LoadingButton>

        {googleAuthEnabled && (
          <>
            <div aria-hidden="true" className="flex items-center gap-3 text-13 text-muted">
              <span className="h-px grow bg-fg/25" />
              <span>or</span>
              <span className="h-px grow bg-fg/25" />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => signInWithGoogle.mutate({ callbackURL })}
              disabled={isLoading}
              className="w-full"
            >
              <FaGoogle className="size-4" aria-hidden="true" />
              {isGoogleLoading ? "Connecting to Google…" : "Continue with Google"}
            </Button>
          </>
        )}
      </form>
    </AuthShell>
  );
}

export default function Register() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
