"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import LoadingButton from "@/components/ui/loadingButton";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/form/PasswordInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthMutation } from "@/hooks/auth";
import { FormEvent, useEffect, useRef, useState } from "react";
import { FaGoogle } from "react-icons/fa6";
import { MdError } from "react-icons/md";

const Login = () => {
  const { signIn, signInWithGoogle } = useAuthMutation();
  const [redirectSearch, setRedirectSearch] = useState("");

  const emailRef = useRef<HTMLInputElement>(null!);
  const passwordRef = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    const redirect = new URLSearchParams(window.location.search).get("redirect");

    if (redirect && redirect.startsWith("/")) {
      setRedirectSearch(`?redirect=${encodeURIComponent(redirect)}`);
    }
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    signIn.mutate({
      email: emailRef.current.value,
      password: passwordRef.current.value,
    });
  };

  const error = signIn.error || signInWithGoogle.error;
  const isSubmitting = signIn.isPending;
  const isGoogleLoading = signInWithGoogle.isPending;
  const isLoading = isSubmitting || isGoogleLoading;

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in with your email and password to access your account."
      footerText="Don't have an account?"
      footerHref={`/register${redirectSearch}`}
      footerLinkLabel="Create one here"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-[#4a1f23] bg-[#1a0b0d] px-3.5 py-2.5 text-[#ff8d92]">
            <MdError className="mt-0.5 shrink-0" size={16} />
            <p className="text-[13px] leading-5">
              {error instanceof Error
                ? error.message
                : "Invalid email or password"}
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
          onClick={() => signInWithGoogle.mutate()}
          disabled={isLoading}
          className="h-11 w-full rounded-md border-border-primary bg-background-primary text-sm font-medium text-white hover:border-[#3b3b3b] hover:bg-background-tertiary"
        >
          <FaGoogle className="mr-2.5 size-4" />
          {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Login;
