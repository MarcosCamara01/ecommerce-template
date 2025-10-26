"use client";

import { PasswordInput } from "@/components/ui/form/PasswordInput";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa6";
import { MdError } from "react-icons/md";
import { useAuthMutation } from "@/hooks/auth";
import { FormEvent, useRef } from "react";

const Register = () => {
  const { signUp, signInWithGoogle } = useAuthMutation();

  const nameRef = useRef<HTMLInputElement>(null!);
  const emailRef = useRef<HTMLInputElement>(null!);
  const passwordRef = useRef<HTMLInputElement>(null!);
  // const phoneRef = useRef<HTMLInputElement>(null!);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    signUp.mutate({
      email: emailRef.current.value,
      password: passwordRef.current.value,
      name: nameRef.current.value,
    });
  };

  const error = signUp.error || signInWithGoogle.error;
  const isLoading = signUp.isPending || signInWithGoogle.isPending;

  return (
    <section className="flex items-center justify-center w-full pt-12 xs:h-80vh">
      <form
        onSubmit={handleSubmit}
        className="p-6 xs:p-10 w-full max-w-350 flex flex-col justify-between items-center gap-2.5 border border-solid border-[#2E2E2E] bg-background-secondary rounded-md"
      >
        {error && (
          <div className="text-[#FF6166] flex items-center justify-center gap-2">
            <MdError />
            <div className="text-sm">
              {error instanceof Error
                ? error.message
                : "Error creating account"}
            </div>
          </div>
        )}
        <h1 className="w-full mb-5 text-2xl font-bold">Signup</h1>

        <label className="w-full text-sm">Fullname:</label>
        <input
          type="text"
          ref={nameRef}
          required
          placeholder="Fullname"
          className="w-full text-color-secondary h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded bg-black text-13"
          name="name"
          disabled={isLoading}
        />

        <label className="w-full text-sm">Email:</label>
        <input
          type="email"
          ref={emailRef}
          required
          placeholder="Email"
          className="w-full text-color-secondary h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded bg-black text-13"
          name="email"
          disabled={isLoading}
        />

        <label className="w-full text-sm">Password:</label>
        <PasswordInput
          ref={passwordRef}
          name="password"
          required
          disabled={isLoading}
        />

        {/* <label className="w-full text-sm">Phone:</label>
        <input
          type="text"
          placeholder="Phone (not required)"
          className="w-full text-color-secondary h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded bg-black text-13"
          name="phone"
          disabled={isLoading}
        /> */}

        <button
          type="submit"
          disabled={isLoading}
          className="items-center w-full gap-3 px-4 py-2 text-sm font-semibold text-center text-white transition-all ease rounded align-middle bg-violet-600 border-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating account..." : "Sign up"}
        </button>

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
          className="w-full bg-black border border-solid border-[#2E2E2E] py-1.5 mt-2.5 rounded transition-all hover:bg-background-tertiary hover:border-[#454545] text-13"
        >
          <FaGoogle />
          Sign in with Google
        </button>
        <Link
          href="/login"
          className="text-sm transition duration-150 text-color-secondary ease hover:text-white"
        >
          Already have an account?
        </Link>
      </form>
    </section>
  );
};

export default Register;
