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

const FIELDS = ["email", "password"] as const;

function LoginContent() {
  const { signIn, signInWithGoogle } = useAuthMutation();
  const searchParams = useSearchParams();
  const emailRef = useRef<HTMLInputElement>(null!);
  const passwordRef = useRef<HTMLInputElement>(null!);

  const redirect = searchParams.get("redirect");
  const callbackURL = safeLocalCallback(redirect);
  const redirectSearch =
    redirect && callbackURL !== "/"
      ? `?redirect=${encodeURIComponent(callbackURL)}`
      : "";
  const nativeError = searchParams.get("error")
    ? "Invalid email or password"
    : null;

  // Focus goes to the field to fix, unless it is already in one of them.
  const focusInvalid = (failure: unknown) => {
    const refs = { email: emailRef, password: passwordRef };
    const fields = invalidFields(failure, FIELDS).map((field) => refs[field].current);
    if (!fields.some((field) => field === document.activeElement)) fields[0]?.focus();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    signIn.mutate(
      {
        email: emailRef.current.value,
        password: passwordRef.current.value,
        callbackURL,
      },
      { onError: focusInvalid },
    );
  };

  const error = signIn.error || signInWithGoogle.error || nativeError;
  const invalid = invalidFields(signIn.error ?? nativeError, FIELDS);
  const isSubmitting = signIn.isPending;
  const isGoogleLoading = signInWithGoogle.isPending;
  const isLoading = isSubmitting || isGoogleLoading;
  const googleAuthEnabled =
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  return (
    <AuthShell
      word="Hello again"
      title="Welcome back"
      description="Sign in with your email and password to access your account."
      footerText="Don't have an account?"
      footerHref={`/register${redirectSearch}`}
      footerLinkLabel="Create one here"
    >
      <form
        className="flex flex-col gap-4"
        method="post"
        action="/api/auth/email-form"
        onSubmit={handleSubmit}
      >
        <Input type="hidden" name="mode" value="sign-in" className="hidden" />
        <Input type="hidden" name="callbackURL" value={callbackURL} className="hidden" />
        <FormError
          message={error instanceof Error ? error.message : error}
          pending={signIn.isPending}
          attempt={signIn.submittedAt}
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="login-email"
              className="text-sm font-medium"
            >
              Email
            </Label>
            <Input
              id="login-email"
              type="email"
              ref={emailRef}
              placeholder="name@example.com"

              name="email"
              autoComplete="email"
              required
              aria-invalid={invalid.includes("email") || undefined}
              readOnly={isLoading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="login-password"
              className="text-sm font-medium"
            >
              Password
            </Label>
            <PasswordInput
              id="login-password"
              ref={passwordRef}
              name="password"
              autoComplete="current-password"
              required
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
          {isSubmitting ? "Signing in…" : "Sign in"}
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

export default function Login() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
