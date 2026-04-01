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

function RegisterContent() {
  const { signUp, signInWithGoogle } = useAuthMutation();
  const searchParams = useSearchParams();
  const nameRef = useRef<HTMLInputElement>(null!);
  const emailRef = useRef<HTMLInputElement>(null!);
  const passwordRef = useRef<HTMLInputElement>(null!);

  const redirect = searchParams.get("redirect");
  const redirectSearch =
    redirect && redirect.startsWith("/")
      ? `?redirect=${encodeURIComponent(redirect)}`
      : "";

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    signUp.mutate({
      email: emailRef.current.value,
      password: passwordRef.current.value,
      name: nameRef.current.value,
    });
  };

  const error = signUp.error || signInWithGoogle.error;
  const isSubmitting = signUp.isPending;
  const isGoogleLoading = signInWithGoogle.isPending;
  const isLoading = isSubmitting || isGoogleLoading;

  return (
    <AuthShell
      title="Create your account"
      description="Create your account in seconds with your email and password."
      footerText="Already have an account?"
      footerHref={`/login${redirectSearch}`}
      footerLinkLabel="Sign in here"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-[#4a1f23] bg-[#1a0b0d] px-3.5 py-2.5 text-[#ff8d92]">
            <MdError className="mt-0.5 shrink-0" size={16} />
            <p className="text-[13px] leading-5">
              {error instanceof Error
                ? error.message
                : "Error creating account"}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="register-name"
              className="text-[13px] text-color-tertiary"
            >
              Full name
            </Label>
            <Input
              id="register-name"
              type="text"
              ref={nameRef}
              required
              placeholder="Alex Morgan"
              className="h-11 rounded-md border-border-primary bg-background-primary px-3.5 text-sm text-white placeholder:text-color-secondary focus-visible:ring-white/20 focus-visible:ring-offset-0"
              name="name"
              autoComplete="name"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="register-email"
              className="text-[13px] text-color-tertiary"
            >
              Email
            </Label>
            <Input
              id="register-email"
              type="email"
              ref={emailRef}
              required
              placeholder="name@example.com"
              className="h-11 rounded-md border-border-primary bg-background-primary px-3.5 text-sm text-white placeholder:text-color-secondary focus-visible:ring-white/20 focus-visible:ring-offset-0"
              name="email"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="register-password"
              className="text-[13px] text-color-tertiary"
            >
              Password
            </Label>
            <PasswordInput
              id="register-password"
              ref={passwordRef}
              name="password"
              autoComplete="new-password"
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
          {isSubmitting ? "Creating account..." : "Create account"}
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
}

export default function Register() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
