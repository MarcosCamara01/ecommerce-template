"use client";

import { PasswordInput } from "@/components/ui/form/PasswordInput";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa6";
import { MdError } from "react-icons/md";
import { useAuthMutation } from "@/hooks/auth";
import { FormEvent, useRef } from "react";
import LoadingButton from "@/components/ui/loadingButton";

const Login = () => {
  const { signIn, signInWithGoogle } = useAuthMutation();

  const emailRef = useRef<HTMLInputElement>(null!);
  const passwordRef = useRef<HTMLInputElement>(null!);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    signIn.mutate({
      email: emailRef.current.value,
      password: passwordRef.current.value,
    });
  };

  const error = signIn.error || signInWithGoogle.error;
  const isLoading = signIn.isPending || signInWithGoogle.isPending;

  return (
    <section className="flex items-center justify-center w-full pt-12 xs:h-80vh">
      <form
        className="p-6 xs:p-10 w-full max-w-350 flex flex-col justify-between items-center gap-2.5 border border-solid border-[#2E2E2E] bg-background-secondary rounded-md"
        onSubmit={handleSubmit}
      >
        {error && (
          <div className="text-[#FF6166] flex items-center justify-center gap-2">
            <MdError />
            <div className="text-sm">
              {error instanceof Error
                ? error.message
                : "Invalid email or password"}
            </div>
          </div>
        )}

        <h1 className="w-full mb-5 text-2xl font-bold">Sign in</h1>

        <label className="w-full text-sm">Email:</label>
        <input
          type="email"
          ref={emailRef}
          placeholder="Email"
          className="w-full text-color-secondary h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded bg-background-primary text-13"
          name="email"
          required
          disabled={isLoading}
        />

        <label className="w-full text-sm">Password:</label>
        <PasswordInput
          ref={passwordRef}
          name="password"
          required
          disabled={isLoading}
        />

        <LoadingButton
          type="submit"
          className="w-full bg-background-primary border border-solid border-[#2E2E2E] py-0 mt-2.5 rounded transition-all hover:bg-background-tertiary hover:border-[#454545] text-13"
          loading={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </LoadingButton>

        <div className="relative flex items-center justify-center w-full h-10">
          <div className="absolute w-full h-px top-2/4 bg-[#2E2E2E]"></div>
          <p className="z-10 flex items-center justify-center w-8 h-6 bg-background-secondary">
            or
          </p>
        </div>

        <button
          type="button"
          onClick={() => signInWithGoogle.mutate()}
          disabled={signInWithGoogle.isPending}
          className="flex text-color-secondary items-center gap-3 px-4 py-2 text-sm align-middle transition-all bg-background-primary border border-solid rounded border-[#2E2E2E] ease hover:bg-background-tertiary hover:border-[#454545] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaGoogle />
          Sign in with Google
        </button>
        <Link
          href="/register"
          className="text-sm transition duration-150 text-color-secondary ease hover:text-white"
        >
          Don&apos;t have an account?
        </Link>
      </form>
    </section>
  );
};

export default Login;
