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
  const notice = searchParams.get("notice");

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
      title="Welcome back"
      description="Sign in with your email and password to access your account."
      footerText="Don't have an account?"
      footerHref={`/register${redirectSearch}`}
      footerLinkLabel="Create one here"
    >
      <form
        className="space-y-5"
        method="post"
        action="/api/auth/email-form"
        onSubmit={handleSubmit}
      >
        <input type="hidden" name="mode" value="sign-in" />
        <input type="hidden" name="callbackURL" value={callbackURL} />
        {notice === "check-email" && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-200">
            Check your email to confirm your address before signing in.
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-[#4a1f23] bg-[#1a0b0d] px-3.5 py-2.5 text-[#ff8d92]">
            <MdError className="mt-0.5 shrink-0" size={16} />
            <p className="text-[13px] leading-5">
              {error instanceof Error ? error.message : error}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="login-email"
              className="text-[13px] text-color-tertiary"
            >
              Email
            </Label>
            <Input
              id="login-email"
              type="email"
              ref={emailRef}
              placeholder="name@example.com"
              className="h-11 rounded-md border-border-primary bg-background-primary px-3.5 text-sm text-white placeholder:text-color-secondary focus-visible:ring-white/20 focus-visible:ring-offset-0"
              name="email"
              autoComplete="email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="login-password"
              className="text-[13px] text-color-tertiary"
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
          className="h-11 w-full rounded-md bg-white text-sm font-semibold text-black transition-colors hover:bg-neutral-200 focus-visible:ring-white/20 focus-visible:ring-offset-0"
          loading={isSubmitting}
          disabled={isLoading}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </LoadingButton>

        {googleAuthEnabled && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-border-primary" />
              <span className="relative bg-background-secondary px-3 text-[10px] uppercase tracking-[0.28em] text-color-secondary">
                Or
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => signInWithGoogle.mutate({ callbackURL })}
              disabled={isLoading}
              className="h-11 w-full rounded-md border-border-primary bg-background-primary text-sm font-medium text-white hover:border-[#3b3b3b] hover:bg-background-tertiary"
            >
              <FaGoogle className="mr-2.5 size-4" aria-hidden="true" />
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
