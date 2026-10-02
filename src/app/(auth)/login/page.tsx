"use client";

import { Suspense, type FormEvent, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { FaGoogle } from "react-icons/fa6";
import { MdError } from "react-icons/md";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/form/PasswordInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingButton from "@/components/ui/loadingButton";
import { useAuthMutation } from "@/hooks/auth";
import { safeLocalCallback } from "@/lib/auth/local-callback";

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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    signIn.mutate({
      email: emailRef.current.value,
      password: passwordRef.current.value,
      callbackURL,
    });
  };

  const error = signIn.error || signInWithGoogle.error || nativeError;
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
        <input type="hidden" name="mode" value="sign-in" />
        <input type="hidden" name="callbackURL" value={callbackURL} />
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-field bg-err-bg px-3.5 py-3 text-sm text-err-fg"
          >
            <MdError className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
            <p>
              {error instanceof Error ? error.message : error}
            </p>
          </div>
        )}

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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
        </div>

        <LoadingButton
          type="submit"
          className="mt-1.5 w-full text-base"
          loading={isSubmitting}
          disabled={isLoading}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
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
