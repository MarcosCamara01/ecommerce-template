"use client";

/** FUNCTIONALITY */
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
/** COMPONENTS */
import { PasswordInput } from "./form/PasswordInput";
import Link from "next/link";
import { ErrorMessage } from "../ui/errorMessage";
/** ICONS */
import { FcGoogle } from "react-icons/fc";

const Signin = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const [error, setError] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user) {
      window.location.reload();
    }
  }, [session]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError("");

      const email = emailRef.current?.value;
      const password = passwordRef.current?.value;

      if (!email || !password) {
        setError("Please fill in all fields");
        return;
      }

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error as string);
      }

      if (!res?.error) {
        return router.push("/");
      }
    },
    []
  );

  return (
    <section className="flex items-center justify-center w-full pt-12 xs:h-80vh">
      <form
        className="p-6 xs:p-10	w-full max-w-350 flex flex-col justify-between items-center gap-2.5	
                border border-solid border-[#2E2E2E] bg-[#0A0A0A] rounded-md"
        onSubmit={handleSubmit}
      >
        {error && <ErrorMessage message={error} />}
        <h1 className="w-full mb-5 text-2xl font-bold">Signin</h1>

        <label className="w-full text-sm">Email:</label>
        <input
          ref={emailRef}
          onChange={() => setError("")}
          type="email"
          placeholder="Email"
          className="w-full text-[#A1A1A1] h-8 border border-solid border-[#2E2E2E] py-1 px-2.5 rounded bg-black text-13"
          name="email"
        />

        <label className="w-full text-sm">Password:</label>
        <PasswordInput ref={passwordRef} onChange={() => setError("")} />

        <button
          className="w-full bg-black border border-solid border-[#2E2E2E] py-1.5 mt-2.5 rounded transition-all hover:bg-[#1F1F1F] hover:border-[#454545] text-13"
          type="submit"
        >
          Signup
        </button>

        <div className="relative flex items-center justify-center w-full h-10">
          <div className="absolute w-full h-px top-2/4 bg-[#2E2E2E]"></div>
          <p className="z-10 flex items-center justify-center w-8 h-6 bg-[#0A0A0A]">
            or
          </p>
        </div>

        <button
          className="flex text-[#A1A1A1] items-center gap-3 px-4 py-2 text-sm align-middle transition-all bg-black border border-solid rounded border-[#2E2E2E] ease hover:bg-[#1F1F1F] hover:border-[#454545]"
          onClick={(e) => {
            e.preventDefault();
            signIn("google");
          }}
          type="button"
        >
          <FcGoogle size={20} /> Sign in with Google
        </button>
        <Link
          href="/register"
          className="text-sm transition duration-150 text-[#A1A1A1] ease hover:text-white"
        >
          Don&apos;t have an account?
        </Link>
      </form>
    </section>
  );
};

export default Signin;
