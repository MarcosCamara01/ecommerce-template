"use client";

import { Suspense, type FormEvent, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { FaGoogle } from "react-icons/fa6";

import { AuthShell } from "@/components/auth/AuthShell";
import { FormError } from "@/components/auth/FormError";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingButton from "@/components/ui/loading-button";
import { useAuthMutation } from "@/hooks/auth/useAuthMutation";
import { invalidFields } from "@/lib/auth/form-errors";
import { safeLocalCallback } from "@/lib/auth/local-callback";

const FIELDS = ["name", "email", "password"] as const;

function RegisterContent() {
  const { signUp, signInWithGoogle } = useAuthMutation();
  const searchParams = useSearchParams();
  const nameRef = useRef<HTMLInputElement>(null!);
  const emailRef = useRef<HTMLInputElement>(null!);
  const passwordRef = useRef<HTMLInputElement>(null!);

  const redirect = searchParams.get("redirect");
  const callbackURL = safeLocalCallback(redirect);
  const redirectSearch =
    redirect && callbackURL !== "/"
      ? `?redirect=${encodeURIComponent(callbackURL)}`
      : "";
  const nativeError = searchParams.get("error")
    ? "Could not create the account. Check the form and try again."
    : null;

  // Focus goes to the field to fix, unless it is already in one of them.
  const focusInvalid = (failure: unknown) => {
    const refs = { name: nameRef, email: emailRef, password: passwordRef };
    const fields = invalidFields(failure, FIELDS).map((field) => refs[field].current);
    if (!fields.some((field) => field === document.activeElement)) fields[0]?.focus();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    signUp.mutate(
      {
        email: emailRef.current.value,
        password: passwordRef.current.value,
        name: nameRef.current.value,
        callbackURL,
      },
      { onError: focusInvalid },
    );
  };

  const error = signUp.error || signInWithGoogle.error || nativeError;
  const invalid = invalidFields(signUp.error ?? nativeError, FIELDS);
  const isSubmitting = signUp.isPending;
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
      footerHref={`/login${redirectSearch}`}
      footerLinkLabel="Sign in here"
    >
      <form
        method="post"
        action="/api/auth/email-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <Input type="hidden" name="mode" value="sign-up" className="hidden" />
        <Input type="hidden" name="callbackURL" value={callbackURL} className="hidden" />
        <FormError message={error instanceof Error ? error.message : error} />

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
